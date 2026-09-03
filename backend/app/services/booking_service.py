from datetime import date, timedelta
import uuid
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.models import Room, Booking, RoomDailyAvailability, BookingStatus, RoomStatus, User
from app.services.audit_service import log_action

def get_stay_dates(check_in: date, check_out: date) -> list[date]:
    if check_out <= check_in:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Check-out date must be strictly after check-in date"
        )
    dates = []
    current = check_in
    while current < check_out:
        dates.append(current)
        current += timedelta(days=1)
    return dates

def create_booking(
    db: Session,
    user: User,
    room_id: int,
    check_in_date: date,
    check_out_date: date,
    guest_name: str = None
) -> Booking:
    room = db.query(Room).filter(Room.id == room_id, Room.is_active == True).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found or inactive")

    stay_dates = get_stay_dates(check_in_date, check_out_date)
    nights = len(stay_dates)
    total_price = room.price_per_night * nights

    conflict_count = db.query(RoomDailyAvailability).filter(
        RoomDailyAvailability.room_id == room_id,
        RoomDailyAvailability.date.in_(stay_dates)
    ).count()

    if conflict_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Selected room is not available for the full requested date range. Overbooking rejected."
        )

    booking_ref = f"BK-{uuid.uuid4().hex[:8].upper()}"
    booking = Booking(
        booking_reference=booking_ref,
        user_id=user.id,
        room_id=room_id,
        check_in_date=check_in_date,
        check_out_date=check_out_date,
        total_price=total_price,
        status=BookingStatus.CONFIRMED.value,
        guest_name=guest_name or user.full_name,
        guest_email=user.email
    )

    try:
        db.add(booking)
        db.flush()

        for single_date in stay_dates:
            avail = RoomDailyAvailability(
                room_id=room_id,
                date=single_date,
                booking_id=booking.id,
                is_booked=True
            )
            db.add(avail)

        log_action(
            db,
            user_email=user.email,
            action="CREATE_BOOKING",
            target_type="BOOKING",
            target_id=booking.booking_reference,
            details=f"Booked Room {room.room_number} ({check_in_date} to {check_out_date}) for ",
            user_id=user.id
        )
        db.commit()
        db.refresh(booking)
        return booking

    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Concurrency conflict: The room was just booked for these dates by another request. Zero overbooking enforced."
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

def check_in_booking(db: Session, booking_id: int, staff_user: User) -> Booking:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking.status != BookingStatus.CONFIRMED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot check in booking with status '{booking.status}'. Must be 'Confirmed'."
        )

    room = db.query(Room).filter(Room.id == booking.room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated room not found")

    # Status Transition Safeguard: Require room to NOT be in Cleaning or Maintenance
    if room.status in [RoomStatus.CLEANING.value, RoomStatus.MAINTENANCE.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot check in guest: Room {room.room_number} is currently '{room.status}'. Room must be set to 'Available' before check-in."
        )

    booking.status = BookingStatus.CHECKED_IN.value
    room.status = RoomStatus.OCCUPIED.value

    log_action(
        db,
        user_email=staff_user.email,
        action="CHECK_IN_GUEST",
        target_type="BOOKING",
        target_id=booking.booking_reference,
        details=f"Guest {booking.guest_name} checked into Room {room.room_number}",
        user_id=staff_user.id
    )
    db.commit()
    db.refresh(booking)
    return booking

def check_out_booking(db: Session, booking_id: int, staff_user: User) -> Booking:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking.status != BookingStatus.CHECKED_IN.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot check out booking with status '{booking.status}'. Must be 'Checked-In'."
        )

    room = db.query(Room).filter(Room.id == booking.room_id).first()
    booking.status = BookingStatus.CHECKED_OUT.value
    if room:
        room.status = RoomStatus.CLEANING.value

    # Early Check-Out Capacity Release:
    # If check-out occurs on or before the scheduled check_out_date, release all remaining locked dates from today onwards
    today = date.today()
    deleted_slots = db.query(RoomDailyAvailability).filter(
        RoomDailyAvailability.booking_id == booking.id,
        RoomDailyAvailability.date >= today
    ).delete()

    log_action(
        db,
        user_email=staff_user.email,
        action="CHECK_OUT_GUEST",
        target_type="BOOKING",
        target_id=booking.booking_reference,
        details=f"Guest {booking.guest_name} checked out from Room {room.room_number if room else booking.room_id}. Released {deleted_slots} remaining night(s). Room set to Cleaning.",
        user_id=staff_user.id
    )
    db.commit()
    db.refresh(booking)
    return booking

def cancel_booking(db: Session, booking_id: int, user: User) -> Booking:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if user.role == "GUEST" and booking.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to cancel this booking")

    if booking.status not in [BookingStatus.CONFIRMED.value, BookingStatus.PENDING.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel booking with status '{booking.status}'. Only Confirmed bookings can be cancelled prior to check-in."
        )

    booking.status = BookingStatus.CANCELLED.value
    # Immediate Cancellation Capacity Release:
    deleted_slots = db.query(RoomDailyAvailability).filter(RoomDailyAvailability.booking_id == booking.id).delete()

    log_action(
        db,
        user_email=user.email,
        action="CANCEL_BOOKING",
        target_type="BOOKING",
        target_id=booking.booking_reference,
        details=f"Booking {booking.booking_reference} cancelled. Released {deleted_slots} daily availability slot(s).",
        user_id=user.id
    )
    db.commit()
    db.refresh(booking)
    return booking

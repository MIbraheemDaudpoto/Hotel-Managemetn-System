from datetime import date, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.models import Room, RoomDailyAvailability, RoomStatus, UserRole, User, Booking, BookingStatus
from app.schemas.schemas import RoomResponse, RoomCreate, RoomUpdate, RoomStatusUpdate
from app.services.audit_service import log_action

router = APIRouter(prefix="/rooms", tags=["Rooms & Inventory"])

@router.get("", response_model=List[RoomResponse])
def get_rooms(
    check_in_date: Optional[date] = Query(None, description="Check-in date"),
    check_out_date: Optional[date] = Query(None, description="Check-out date"),
    room_type: Optional[str] = Query(None, description="Room type filter"),
    min_capacity: Optional[int] = Query(None, description="Minimum capacity filter"),
    status_filter: Optional[str] = Query(None, description="Filter by room status"),
    include_maintenance: bool = Query(False, description="Include maintenance rooms (Staff/Admin view)"),
    db: Session = Depends(get_db)
):
    query = db.query(Room).filter(Room.is_active == True)

    if not include_maintenance and not status_filter:
        query = query.filter(Room.status != RoomStatus.MAINTENANCE.value)

    if room_type:
        query = query.filter(Room.room_type.ilike(f"%{room_type}%"))
    if min_capacity:
        query = query.filter(Room.capacity >= min_capacity)
    if status_filter:
        query = query.filter(Room.status == status_filter)

    rooms = query.all()

    if check_in_date and check_out_date:
        if check_out_date <= check_in_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Check-out date must be strictly after check-in date"
            )
        # Same-day turnaround: Check [check_in, check_out) strictly excluding check_out date
        stay_dates = []
        cur = check_in_date
        while cur < check_out_date:
            stay_dates.append(cur)
            cur += timedelta(days=1)

        available_rooms = []
        for r in rooms:
            conflict_count = db.query(RoomDailyAvailability).filter(
                RoomDailyAvailability.room_id == r.id,
                RoomDailyAvailability.date.in_(stay_dates)
            ).count()
            if conflict_count == 0:
                available_rooms.append(r)
        return [RoomResponse.model_validate(r) for r in available_rooms]

    return [RoomResponse.model_validate(r) for r in rooms]

@router.get("/{room_id}", response_model=RoomResponse)
def get_room_by_id(room_id: int, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    return RoomResponse.model_validate(room)

@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(
    room_in: RoomCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role([UserRole.ADMIN.value]))
):
    existing = db.query(Room).filter(Room.room_number == room_in.room_number).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Room {room_in.room_number} already exists")

    room = Room(
        room_number=room_in.room_number,
        room_type=room_in.room_type,
        capacity=room_in.capacity,
        price_per_night=room_in.price_per_night,
        status=room_in.status,
        description=room_in.description,
        image_url=room_in.image_url,
        is_active=room_in.is_active
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    log_action(
        db,
        user_email=admin_user.email,
        action="CREATE_ROOM",
        target_type="ROOM",
        target_id=room.room_number,
        details=f"Created room {room.room_number} ({room.room_type}, /night)",
        user_id=admin_user.id
    )
    db.commit()
    return RoomResponse.model_validate(room)

@router.put("/{room_id}", response_model=RoomResponse)
def update_room(
    room_id: int,
    room_in: RoomUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role([UserRole.ADMIN.value]))
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    update_data = room_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(room, field, val)

    log_action(
        db,
        user_email=admin_user.email,
        action="UPDATE_ROOM",
        target_type="ROOM",
        target_id=room.room_number,
        details=f"Updated room {room.room_number} fields: {list(update_data.keys())}",
        user_id=admin_user.id
    )
    db.commit()
    db.refresh(room)
    return RoomResponse.model_validate(room)

@router.patch("/{room_id}/status", response_model=RoomResponse)
def update_room_status(
    room_id: int,
    status_update: RoomStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.FRONT_DESK.value, UserRole.ADMIN.value]))
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    valid_statuses = [s.value for s in RoomStatus]
    if status_update.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{status_update.status}'. Allowed: {valid_statuses}"
        )

    old_status = room.status
    room.status = status_update.status

    log_action(
        db,
        user_email=current_user.email,
        action="UPDATE_ROOM_STATUS",
        target_type="ROOM",
        target_id=room.room_number,
        details=f"Room {room.room_number} status changed from {old_status} to {room.status} by {current_user.role}",
        user_id=current_user.id
    )
    db.commit()
    db.refresh(room)
    return RoomResponse.model_validate(room)

@router.delete("/{room_id}", response_model=RoomResponse)
def deactivate_room(
    room_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role([UserRole.ADMIN.value]))
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    # Safeguard 2: Block deactivation if room has active or upcoming bookings
    active_bookings_count = db.query(Booking).filter(
        Booking.room_id == room.id,
        Booking.status.in_([BookingStatus.CONFIRMED.value, BookingStatus.CHECKED_IN.value])
    ).count()

    if active_bookings_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot deactivate Room {room.room_number}: Room currently has {active_bookings_count} active or upcoming reservation(s). Cancel or reassign them first."
        )

    room.is_active = False
    log_action(
        db,
        user_email=admin_user.email,
        action="DEACTIVATE_ROOM",
        target_type="ROOM",
        target_id=room.room_number,
        details=f"Admin {admin_user.email} deactivated room {room.room_number}",
        user_id=admin_user.id
    )
    db.commit()
    db.refresh(room)
    return RoomResponse.model_validate(room)

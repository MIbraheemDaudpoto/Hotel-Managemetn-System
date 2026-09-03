from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.models import Booking, User, UserRole, Room
from app.schemas.schemas import BookingCreate, BookingResponse, InvoiceResponse
from app.services.booking_service import create_booking, check_in_booking, check_out_booking, cancel_booking, get_stay_dates

router = APIRouter(prefix="/bookings", tags=["Bookings"])

@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def book_room(
    booking_in: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = create_booking(
        db=db,
        user=current_user,
        room_id=booking_in.room_id,
        check_in_date=booking_in.check_in_date,
        check_out_date=booking_in.check_out_date,
        guest_name=booking_in.guest_name
    )
    refreshed = db.query(Booking).options(joinedload(Booking.room)).filter(Booking.id == booking.id).first()
    return BookingResponse.model_validate(refreshed or booking)

@router.get("/my", response_model=List[BookingResponse])
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bookings = (
        db.query(Booking)
        .options(joinedload(Booking.room))
        .filter(Booking.user_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    return [BookingResponse.model_validate(b) for b in bookings]

@router.get("/all", response_model=List[BookingResponse])
def get_all_bookings(
    status_filter: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_role([UserRole.FRONT_DESK.value, UserRole.ADMIN.value]))
):
    query = db.query(Booking).options(joinedload(Booking.room))
    if status_filter:
        query = query.filter(Booking.status == status_filter)
    if date_from:
        query = query.filter(Booking.check_in_date >= date_from)
    if date_to:
        query = query.filter(Booking.check_out_date <= date_to)

    bookings = query.order_by(Booking.created_at.desc()).all()
    return [BookingResponse.model_validate(b) for b in bookings]

@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking_details(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = (
        db.query(Booking)
        .options(joinedload(Booking.room))
        .filter(Booking.id == booking_id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if current_user.role == UserRole.GUEST.value and booking.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return BookingResponse.model_validate(booking)

@router.get("/{booking_id}/invoice", response_model=InvoiceResponse)
def get_booking_invoice(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = (
        db.query(Booking)
        .options(joinedload(Booking.room))
        .filter(Booking.id == booking_id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    # RBAC: Only Admin, Front Desk, or the booking owner Guest can access this invoice
    if current_user.role == UserRole.GUEST.value and booking.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: You can only view invoices for your own reservations.")

    stay_dates = get_stay_dates(booking.check_in_date, booking.check_out_date)
    nights = max(len(stay_dates), 1)
    nightly_rate = booking.room.price_per_night if booking.room else (booking.total_price / nights)
    subtotal = booking.total_price
    tax_and_fees = 0.0

    return InvoiceResponse(
        invoice_number=f"INV-{booking.booking_reference}",
        hotel_name="Grand Hotel & Luxury Suites",
        hotel_address="100 Ocean Boulevard, Luxury Bay, CA 90210",
        hotel_contact="+1 (800) 555-4683 | info@grandhotel.com",
        booking_reference=booking.booking_reference,
        guest_name=booking.guest_name,
        guest_email=booking.guest_email,
        room_number=booking.room.room_number if booking.room else str(booking.room_id),
        room_type=booking.room.room_type if booking.room else "Standard Room",
        check_in_date=booking.check_in_date,
        check_out_date=booking.check_out_date,
        number_of_nights=nights,
        nightly_rate=nightly_rate,
        subtotal=subtotal,
        tax_and_fees=tax_and_fees,
        total_amount=subtotal + tax_and_fees,
        status=booking.status,
        issue_date=date.today()
    )

@router.post("/{booking_id}/check-in", response_model=BookingResponse)
def handle_check_in(
    booking_id: int,
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_role([UserRole.FRONT_DESK.value, UserRole.ADMIN.value]))
):
    booking = check_in_booking(db, booking_id, staff_user)
    refreshed = db.query(Booking).options(joinedload(Booking.room)).filter(Booking.id == booking.id).first()
    return BookingResponse.model_validate(refreshed or booking)

@router.post("/{booking_id}/check-out", response_model=BookingResponse)
def handle_check_out(
    booking_id: int,
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_role([UserRole.FRONT_DESK.value, UserRole.ADMIN.value]))
):
    booking = check_out_booking(db, booking_id, staff_user)
    refreshed = db.query(Booking).options(joinedload(Booking.room)).filter(Booking.id == booking.id).first()
    return BookingResponse.model_validate(refreshed or booking)

@router.post("/{booking_id}/cancel", response_model=BookingResponse)
def handle_cancel(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = cancel_booking(db, booking_id, current_user)
    refreshed = db.query(Booking).options(joinedload(Booking.room)).filter(Booking.id == booking.id).first()
    return BookingResponse.model_validate(refreshed or booking)

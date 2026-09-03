from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_role
from app.models.models import Room, Booking, BookingStatus, UserRole, User
from app.schemas.schemas import DailyOperationsResponse, RoomResponse, BookingResponse

router = APIRouter(prefix="/frontdesk", tags=["Front Desk Operations"])

@router.get("/today", response_model=DailyOperationsResponse)
def get_today_operations(
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_role([UserRole.FRONT_DESK.value, UserRole.ADMIN.value]))
):
    today = date.today()

    arrivals = db.query(Booking).filter(
        Booking.check_in_date == today,
        Booking.status == BookingStatus.CONFIRMED.value
    ).all()

    departures = db.query(Booking).filter(
        Booking.check_out_date == today,
        Booking.status == BookingStatus.CHECKED_IN.value
    ).all()

    in_house = db.query(Booking).filter(
        Booking.status == BookingStatus.CHECKED_IN.value
    ).all()

    all_rooms = db.query(Room).filter(Room.is_active == True).order_by(Room.room_number.asc()).all()

    return DailyOperationsResponse(
        today=today,
        expected_arrivals=[BookingResponse.model_validate(b) for b in arrivals],
        expected_departures=[BookingResponse.model_validate(b) for b in departures],
        active_in_house=[BookingResponse.model_validate(b) for b in in_house],
        all_rooms=[RoomResponse.model_validate(r) for r in all_rooms]
    )

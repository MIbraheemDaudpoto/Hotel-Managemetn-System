from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import require_role
from app.models.models import Room, Booking, RoomStatus, BookingStatus, UserRole, User
from app.schemas.schemas import DashboardKPIs

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("", response_model=DashboardKPIs)
def get_reports_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.FRONT_DESK.value, UserRole.ADMIN.value]))
):
    today = date.today()

    total_rooms = db.query(Room).filter(Room.is_active == True).count()
    occupied_rooms = db.query(Room).filter(Room.is_active == True, Room.status == RoomStatus.OCCUPIED.value).count()
    cleaning_rooms = db.query(Room).filter(Room.is_active == True, Room.status == RoomStatus.CLEANING.value).count()
    maintenance_rooms = db.query(Room).filter(Room.is_active == True, Room.status == RoomStatus.MAINTENANCE.value).count()
    available_rooms = db.query(Room).filter(Room.is_active == True, Room.status == RoomStatus.AVAILABLE.value).count()

    occupancy_rate = (occupied_rooms / total_rooms * 100.0) if total_rooms > 0 else 0.0

    today_checkins = db.query(Booking).filter(
        Booking.check_in_date == today,
        Booking.status.in_([BookingStatus.CONFIRMED.value, BookingStatus.CHECKED_IN.value])
    ).count()

    today_checkouts = db.query(Booking).filter(
        Booking.check_out_date == today,
        Booking.status.in_([BookingStatus.CHECKED_IN.value, BookingStatus.CHECKED_OUT.value])
    ).count()

    active_upcoming = db.query(Booking).filter(
        Booking.status.in_([BookingStatus.CONFIRMED.value, BookingStatus.CHECKED_IN.value])
    ).count()

    # Front Desk does not see financial revenue figures (masked to 0.0)
    if current_user.role == UserRole.ADMIN.value:
        total_revenue = db.query(func.coalesce(func.sum(Booking.total_price), 0.0)).filter(
            Booking.status.in_([BookingStatus.CONFIRMED.value, BookingStatus.CHECKED_IN.value, BookingStatus.CHECKED_OUT.value])
        ).scalar()
    else:
        total_revenue = 0.0

    return DashboardKPIs(
        total_rooms=total_rooms,
        occupied_rooms=occupied_rooms,
        cleaning_rooms=cleaning_rooms,
        maintenance_rooms=maintenance_rooms,
        available_rooms=available_rooms,
        occupancy_rate_percent=round(occupancy_rate, 1),
        today_checkins_count=today_checkins,
        today_checkouts_count=today_checkouts,
        total_active_and_upcoming_bookings=active_upcoming,
        total_revenue=float(total_revenue)
    )

from datetime import date
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import require_role
from app.models.models import Room, Booking, AuditLog, RoomStatus, BookingStatus, UserRole, User, HotelPolicy
from app.schemas.schemas import DashboardKPIs, AuditLogResponse, BookingResponse
from app.services.concierge_service import POLICIES
from app.services.audit_service import log_action

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

class PolicyUpdate(BaseModel):
    title: str
    content: str

class PolicyResponse(BaseModel):
    key: str
    title: str
    content: str

@router.get("/dashboard", response_model=DashboardKPIs)
def get_admin_dashboard_kpis(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role([UserRole.ADMIN.value]))
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

    total_revenue = db.query(func.coalesce(func.sum(Booking.total_price), 0.0)).filter(
        Booking.status.in_([BookingStatus.CONFIRMED.value, BookingStatus.CHECKED_IN.value, BookingStatus.CHECKED_OUT.value])
    ).scalar()

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

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role([UserRole.ADMIN.value]))
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [AuditLogResponse.model_validate(log) for log in logs]

@router.get("/policies", response_model=List[PolicyResponse])
def get_hotel_policies(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role([UserRole.ADMIN.value]))
):
    # Ensure default policies are seeded in DB
    existing = db.query(HotelPolicy).all()
    if not existing:
        for k, v in POLICIES.items():
            p = HotelPolicy(
                key=k,
                title=v["title"],
                content=v["content"]
            )
            db.add(p)
        db.commit()
        existing = db.query(HotelPolicy).all()

    return [
        PolicyResponse(
            key=p.key,
            title=p.title,
            content=p.content
        ) for p in existing
    ]

@router.put("/policies/{policy_key}", response_model=PolicyResponse)
def update_hotel_policy(
    policy_key: str,
    policy_in: PolicyUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role([UserRole.ADMIN.value]))
):
    policy = db.query(HotelPolicy).filter(HotelPolicy.key == policy_key).first()
    if not policy:
        policy = HotelPolicy(
            key=policy_key,
            title=policy_in.title,
            content=policy_in.content
        )
        db.add(policy)
    else:
        policy.title = policy_in.title
        policy.content = policy_in.content

    log_action(
        db,
        user_email=admin_user.email,
        action="UPDATE_HOTEL_POLICY",
        target_type="POLICY",
        target_id=policy_key,
        details=f"Admin updated policy '{policy_key}': {policy_in.title}",
        user_id=admin_user.id
    )
    db.commit()
    db.refresh(policy)
    return PolicyResponse(key=policy.key, title=policy.title, content=policy.content)

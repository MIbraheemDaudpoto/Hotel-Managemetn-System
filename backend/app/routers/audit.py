from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_role
from app.models.models import AuditLog, User, UserRole
from app.schemas.schemas import AuditLogResponse

router = APIRouter(prefix="/audit", tags=["Audit Logs"])

OPERATIONAL_ACTIONS = [
    "CREATE_BOOKING",
    "CHECK_IN_GUEST",
    "CHECK_OUT_GUEST",
    "UPDATE_ROOM_STATUS",
    "CANCEL_BOOKING"
]

@router.get("", response_model=List[AuditLogResponse])
def get_audit_trail(
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.FRONT_DESK.value, UserRole.ADMIN.value]))
):
    query = db.query(AuditLog).order_by(AuditLog.timestamp.desc())

    # Front Desk can only view non-sensitive operational logs
    if current_user.role == UserRole.FRONT_DESK.value:
        query = query.filter(AuditLog.action.in_(OPERATIONAL_ACTIONS))

    logs = query.limit(limit).all()
    return [AuditLogResponse.model_validate(log) for log in logs]

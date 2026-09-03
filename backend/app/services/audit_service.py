from typing import Optional
from sqlalchemy.orm import Session
from app.models.models import AuditLog

def log_action(
    db: Session,
    user_email: str,
    action: str,
    target_type: str,
    target_id: Optional[str] = None,
    details: Optional[str] = None,
    user_id: Optional[int] = None
):
    audit = AuditLog(
        user_id=user_id,
        user_email=user_email,
        action=action,
        target_type=target_type,
        target_id=str(target_id) if target_id is not None else None,
        details=details
    )
    db.add(audit)

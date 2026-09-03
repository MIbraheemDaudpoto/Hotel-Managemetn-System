from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_user, require_role
from app.models.models import User, UserRole
from app.schemas.schemas import UserRegister, UserLogin, UserResponse, TokenResponse, StaffCreate
from app.services.audit_service import log_action

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_guest(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    
    new_user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=UserRole.GUEST.value,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_action(db, user_email=new_user.email, action="GUEST_SELF_REGISTER", target_type="USER", target_id=str(new_user.id), user_id=new_user.id)
    db.commit()

    token = create_access_token(subject=str(new_user.id), role=new_user.role)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )

@router.post("/login", response_model=TokenResponse)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated. Please contact an administrator."
        )

    token = create_access_token(subject=str(user.id), role=user.role)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.post("/staff", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_staff_account(
    staff_in: StaffCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role([UserRole.ADMIN.value]))
):
    existing = db.query(User).filter(User.email == staff_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account with this email already exists."
        )

    if staff_in.role not in [UserRole.FRONT_DESK.value, UserRole.ADMIN.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be FRONT_DESK or ADMIN"
        )

    staff = User(
        email=staff_in.email.lower(),
        hashed_password=get_password_hash(staff_in.password),
        full_name=staff_in.full_name,
        role=staff_in.role,
        is_active=True
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)

    log_action(
        db,
        user_email=admin_user.email,
        action="PROVISION_STAFF_ACCOUNT",
        target_type="USER",
        target_id=str(staff.id),
        details=f"Admin {admin_user.email} provisioned {staff.role} account for {staff.email}",
        user_id=admin_user.id
    )
    db.commit()
    return UserResponse.model_validate(staff)

@router.get("/staff", response_model=list[UserResponse])
def list_staff_accounts(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role([UserRole.ADMIN.value]))
):
    staff_list = db.query(User).filter(User.role.in_([UserRole.FRONT_DESK.value, UserRole.ADMIN.value])).all()
    return [UserResponse.model_validate(u) for u in staff_list]

@router.patch("/staff/{user_id}/toggle-active", response_model=UserResponse)
def toggle_staff_active(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role([UserRole.ADMIN.value]))
):
    staff = db.query(User).filter(User.id == user_id).first()
    if not staff:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff user not found")
    
    if staff.id == admin_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot deactivate your own admin account")

    staff.is_active = not staff.is_active
    log_action(
        db,
        user_email=admin_user.email,
        action="TOGGLE_USER_STATUS",
        target_type="USER",
        target_id=str(staff.id),
        details=f"Admin {admin_user.email} set active={staff.is_active} for {staff.email}",
        user_id=admin_user.id
    )
    db.commit()
    db.refresh(staff)
    return UserResponse.model_validate(staff)

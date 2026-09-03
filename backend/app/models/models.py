from datetime import datetime, date
import enum
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, 
    Text, Enum as SQLEnum, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class UserRole(str, enum.Enum):
    GUEST = "GUEST"
    FRONT_DESK = "FRONT_DESK"
    ADMIN = "ADMIN"

class RoomStatus(str, enum.Enum):
    AVAILABLE = "Available"
    OCCUPIED = "Occupied"
    CLEANING = "Cleaning"
    MAINTENANCE = "Maintenance"

class BookingStatus(str, enum.Enum):
    PENDING = "Pending"
    CONFIRMED = "Confirmed"
    CHECKED_IN = "Checked-In"
    CHECKED_OUT = "Checked-Out"
    CANCELLED = "Cancelled"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.GUEST.value, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(50), unique=True, index=True, nullable=False)
    room_type = Column(String(100), nullable=False)
    capacity = Column(Integer, default=2, nullable=False)
    price_per_night = Column(Float, nullable=False)
    status = Column(String(50), default=RoomStatus.AVAILABLE.value, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    bookings = relationship("Booking", back_populates="room")
    daily_availabilities = relationship("RoomDailyAvailability", back_populates="room", cascade="all, delete-orphan")

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_reference = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    check_in_date = Column(Date, nullable=False, index=True)
    check_out_date = Column(Date, nullable=False, index=True)
    total_price = Column(Float, nullable=False)
    status = Column(String(50), default=BookingStatus.CONFIRMED.value, nullable=False, index=True)
    guest_name = Column(String(255), nullable=False)
    guest_email = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="bookings")
    room = relationship("Room", back_populates="bookings")
    daily_records = relationship("RoomDailyAvailability", back_populates="booking", cascade="all, delete-orphan")

class RoomDailyAvailability(Base):
    __tablename__ = "room_daily_availabilities"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    is_booked = Column(Boolean, default=True, nullable=False)

    room = relationship("Room", back_populates="daily_availabilities")
    booking = relationship("Booking", back_populates="daily_records")

    __table_args__ = (
        UniqueConstraint("room_id", "date", name="uq_room_date_availability"),
    )

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_email = Column(String(255), nullable=False)
    action = Column(String(100), nullable=False)
    target_type = Column(String(100), nullable=False)
    target_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="audit_logs")

class HotelPolicy(Base):
    __tablename__ = "hotel_policies"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

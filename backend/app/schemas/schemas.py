from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class StaffCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    full_name: str
    role: str = "FRONT_DESK"

class RoomBase(BaseModel):
    room_number: str
    room_type: str
    capacity: int = 2
    price_per_night: float
    status: str = "Available"
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    room_number: Optional[str] = None
    room_type: Optional[str] = None
    capacity: Optional[int] = None
    price_per_night: Optional[float] = None
    status: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class RoomStatusUpdate(BaseModel):
    status: str

class RoomResponse(RoomBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime

class BookingCreate(BaseModel):
    room_id: int
    check_in_date: date
    check_out_date: date
    guest_name: Optional[str] = None

class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    booking_reference: str
    user_id: int
    room_id: int
    check_in_date: date
    check_out_date: date
    total_price: float
    status: str
    guest_name: str
    guest_email: str
    created_at: datetime
    updated_at: datetime
    room: Optional[RoomResponse] = None

class InvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    invoice_number: str
    hotel_name: str
    hotel_address: str
    hotel_contact: str
    booking_reference: str
    guest_name: str
    guest_email: str
    room_number: str
    room_type: str
    check_in_date: date
    check_out_date: date
    number_of_nights: int
    nightly_rate: float
    subtotal: float
    tax_and_fees: float
    total_amount: float
    status: str
    issue_date: date

class DailyOperationsResponse(BaseModel):
    today: date
    expected_arrivals: List[BookingResponse]
    expected_departures: List[BookingResponse]
    active_in_house: List[BookingResponse]
    all_rooms: List[RoomResponse]

class DashboardKPIs(BaseModel):
    total_rooms: int
    occupied_rooms: int
    cleaning_rooms: int
    maintenance_rooms: int
    available_rooms: int
    occupancy_rate_percent: float
    today_checkins_count: int
    today_checkouts_count: int
    total_active_and_upcoming_bookings: int
    total_revenue: float

class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: Optional[int]
    user_email: str
    action: str
    target_type: str
    target_id: Optional[str]
    details: Optional[str]
    timestamp: datetime

class PolicyUpdate(BaseModel):
    title: str
    content: str

class PolicyResponse(BaseModel):
    key: str
    title: str
    content: str

class ConciergeChatRequest(BaseModel):
    message: str

class ConciergeChatResponse(BaseModel):
    reply: str
    category: str
    matched_policy_key: Optional[str] = None
    suggested_actions: List[str] = []

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.models import User, Room, HotelPolicy, UserRole, RoomStatus

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        if not db.query(User).filter(User.email == "admin@hotel.com").first():
            admin = User(
                email="admin@hotel.com",
                hashed_password=get_password_hash("Admin123!"),
                full_name="Admin Manager",
                role=UserRole.ADMIN.value,
                is_active=True
            )
            db.add(admin)

        if not db.query(User).filter(User.email == "frontdesk@hotel.com").first():
            frontdesk = User(
                email="frontdesk@hotel.com",
                hashed_password=get_password_hash("FrontDesk123!"),
                full_name="Alice FrontDesk",
                role=UserRole.FRONT_DESK.value,
                is_active=True
            )
            db.add(frontdesk)

        if not db.query(User).filter(User.email == "guest@hotel.com").first():
            guest = User(
                email="guest@hotel.com",
                hashed_password=get_password_hash("Guest123!"),
                full_name="John Doe (Guest)",
                role=UserRole.GUEST.value,
                is_active=True
            )
            db.add(guest)

        sample_rooms = [
            {"room_number": "101", "room_type": "Standard Single", "capacity": 1, "price_per_night": 95.0, "status": RoomStatus.AVAILABLE.value, "description": "Cozy single room with high-speed Wi-Fi, work desk, and private ensuite bathroom."},
            {"room_number": "102", "room_type": "Deluxe Double", "capacity": 2, "price_per_night": 145.0, "status": RoomStatus.AVAILABLE.value, "description": "Spacious double room featuring plush Queen bed, city views, mini-bar, and smart TV."},
            {"room_number": "201", "room_type": "Deluxe Double", "capacity": 2, "price_per_night": 155.0, "status": RoomStatus.AVAILABLE.value, "description": "Second-floor deluxe room with balcony and morning garden view."},
            {"room_number": "204", "room_type": "Executive Suite", "capacity": 3, "price_per_night": 220.0, "status": RoomStatus.AVAILABLE.value, "description": "City-view room with king bed, executive workspace, and soaking tub."},
            {"room_number": "301", "room_type": "Penthouse Suite", "capacity": 4, "price_per_night": 380.0, "status": RoomStatus.AVAILABLE.value, "description": "Luxury top-floor suite with panoramic skyline terrace, dining area, and master bedroom."},
            {"room_number": "302", "room_type": "Deluxe Double", "capacity": 2, "price_per_night": 150.0, "status": RoomStatus.CLEANING.value, "description": "Deluxe twin bed room currently undergoing scheduled housekeeping turnover."},
            {"room_number": "401", "room_type": "Presidential Suite", "capacity": 4, "price_per_night": 550.0, "status": RoomStatus.MAINTENANCE.value, "description": "Presidential suite undergoing audio-visual system upgrades."}
        ]

        for r_data in sample_rooms:
            if not db.query(Room).filter(Room.room_number == r_data["room_number"]).first():
                db.add(Room(**r_data))

        policies = [
            {"key": "wifi", "title": "Wi-Fi Access & Network Details", "content": "Complimentary high-speed Wi-Fi is available across all guest rooms, lobby, and dining areas. Network: 'GrandHotel_Guest', Password: 'WelcomeToGrand2026'."},
            {"key": "breakfast", "title": "Breakfast Hours & Dining Options", "content": "Hot & continental buffet breakfast is served daily at Azure Dining on Level 1 from 6:30 AM to 10:30 AM (Mon-Fri) and 7:00 AM to 11:00 AM (Sat-Sun)."},
            {"key": "pool", "title": "Swimming Pool & Wellness Amenities", "content": "Heated rooftop pool and spa are located on Level 12, open 6:00 AM to 10:00 PM daily. Fresh towels provided."},
            {"key": "checkin_checkout", "title": "Check-in & Check-out Hours", "content": "Standard Check-in is at 3:00 PM. Standard Check-out is by 11:00 AM. Late check-out requests available upon inquiry."},
            {"key": "cancellation", "title": "Cancellation Policy", "content": "Free cancellation is permitted up to 24 hours before check-in date. Cancellations within 24 hours incur the first night charge."}
        ]

        for p_data in policies:
            if not db.query(HotelPolicy).filter(HotelPolicy.key == p_data["key"]).first():
                db.add(HotelPolicy(**p_data))

        db.commit()
        print("Database seed completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

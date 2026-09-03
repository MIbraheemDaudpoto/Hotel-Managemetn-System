import pytest
import time
import concurrent.futures
from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.models import Room, User, RoomDailyAvailability

client = TestClient(app)

def test_concurrent_double_booking_prevention():
    login_admin = client.post("/api/auth/login", json={"email": "admin@hotel.com", "password": "Admin123!"})
    assert login_admin.status_code == 200
    admin_token = login_admin.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    timestamp_id = int(time.time() * 1000) % 1000000
    
    # Create isolated room for concurrency test
    create_room = client.post("/api/rooms", json={
        "room_number": f"C{timestamp_id % 1000:03d}",
        "room_type": "Concurrency Suite",
        "capacity": 2,
        "price_per_night": 200.0,
        "status": "Available",
        "is_active": True
    }, headers=admin_headers)
    assert create_room.status_code == 201
    target_room_id = create_room.json()["id"]

    login_res = client.post("/api/auth/login", json={"email": "guest@hotel.com", "password": "Guest123!"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    test_check_in = date.today() + timedelta(days=1200 + (timestamp_id % 100))
    test_check_out = test_check_in + timedelta(days=3)

    payload = {
        "room_id": target_room_id,
        "check_in_date": test_check_in.isoformat(),
        "check_out_date": test_check_out.isoformat(),
        "guest_name": f"Concurrent Tester {timestamp_id}"
    }

    def attempt_booking(i):
        test_c = TestClient(app)
        return test_c.post("/api/bookings", json=payload, headers=headers)

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(attempt_booking, i) for i in range(10)]
        results = [f.result() for f in futures]

    statuses = [r.status_code for r in results]
    success_count = statuses.count(201)
    conflict_count = statuses.count(409)

    print(f"\n[Test Pass Concurrency Results] Success (201): {success_count} | Conflict Rejected (409): {conflict_count}")
    # Strictly exactly ONE booking must succeed, and ALL 9 others must be rejected with 409 Conflict
    assert success_count == 1, f"Expected exactly 1 booking to succeed, got {success_count}"
    assert conflict_count == 9, f"Expected 9 bookings to be rejected with 409 Conflict, got {conflict_count}"

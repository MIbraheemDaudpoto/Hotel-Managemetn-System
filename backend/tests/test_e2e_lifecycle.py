import pytest
import time
from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_guest_to_stay_lifecycle():
    # 1. Guest Registration with unique email
    timestamp_id = int(time.time() * 1000) % 1000000
    unique_email = f"tester_{timestamp_id}@test.com"
    reg_res = client.post("/api/auth/register", json={
        "email": unique_email,
        "password": "Password123!",
        "full_name": f"Guest Tester {timestamp_id}"
    })
    assert reg_res.status_code == 201, reg_res.text
    guest_token = reg_res.json()["access_token"]
    guest_headers = {"Authorization": f"Bearer {guest_token}"}

    # 2. Room Catalog Search with dynamic offset to guarantee availability across repeated runs
    day_offset = (timestamp_id % 300) + 100
    check_in = date.today() + timedelta(days=day_offset)
    check_out = date.today() + timedelta(days=day_offset + 3)

    search_res = client.get(
        f"/api/rooms?check_in_date={check_in.isoformat()}&check_out_date={check_out.isoformat()}&room_type=Deluxe",
        headers=guest_headers
    )
    assert search_res.status_code == 200
    rooms = search_res.json()
    assert len(rooms) > 0, f"Expected Deluxe rooms available for dates {check_in} to {check_out}"
    selected_room = rooms[0]

    # 3. Create Booking
    book_res = client.post("/api/bookings", json={
        "room_id": selected_room["id"],
        "check_in_date": check_in.isoformat(),
        "check_out_date": check_out.isoformat(),
        "guest_name": f"Guest Tester {timestamp_id}"
    }, headers=guest_headers)
    assert book_res.status_code == 201
    booking_data = book_res.json()
    booking_id = booking_data["id"]
    assert booking_data["status"] == "Confirmed"
    assert booking_data["booking_reference"].startswith("BK-")

    # 4. Guest AI Concierge Query
    chat_res = client.post("/api/concierge/chat", json={"message": "What time is breakfast served?"})
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert "Azure Dining" in chat_data["reply"] or "Breakfast" in chat_data["reply"]
    assert chat_data["category"] == "breakfast"

    # 5. Front Desk Login
    fd_login = client.post("/api/auth/login", json={"email": "frontdesk@hotel.com", "password": "FrontDesk123!"})
    assert fd_login.status_code == 200
    fd_token = fd_login.json()["access_token"]
    fd_headers = {"Authorization": f"Bearer {fd_token}"}

    # 6. Front Desk Check-in
    checkin_res = client.post(f"/api/bookings/{booking_id}/check-in", headers=fd_headers)
    assert checkin_res.status_code == 200
    assert checkin_res.json()["status"] == "Checked-In"

    # Verify Room status updated to Occupied
    room_check = client.get(f"/api/rooms/{selected_room['id']}")
    assert room_check.json()["status"] == "Occupied"

    # 7. Front Desk Check-out
    checkout_res = client.post(f"/api/bookings/{booking_id}/check-out", headers=fd_headers)
    assert checkout_res.status_code == 200
    assert checkout_res.json()["status"] == "Checked-Out"

    # Verify Room automatically transitioned to Cleaning per PRS requirement
    room_after_checkout = client.get(f"/api/rooms/{selected_room['id']}")
    assert room_after_checkout.json()["status"] == "Cleaning"

    # 8. Front Desk updates room status to Available once cleaned
    status_update_res = client.patch(
        f"/api/rooms/{selected_room['id']}/status",
        json={"status": "Available"},
        headers=fd_headers
    )
    assert status_update_res.status_code == 200
    assert status_update_res.json()["status"] == "Available"

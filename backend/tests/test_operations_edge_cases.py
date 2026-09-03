import pytest
import time
from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.models import Room, RoomStatus, BookingStatus, RoomDailyAvailability
from app.services.concierge_service import POLICIES

client = TestClient(app)

def test_operations_edge_cases_and_admin_settings():
    print("\n========================================================")
    print("[EDGE CASES AUDIT] AUDITING 5 OPERATIONS GAPS & ADMIN SETTINGS")
    print("========================================================")

    # Setup Auth tokens
    admin_res = client.post("/api/auth/login", json={"email": "admin@hotel.com", "password": "Admin123!"})
    assert admin_res.status_code == 200
    admin_headers = {"Authorization": f"Bearer {admin_res.json()['access_token']}"}

    fd_res = client.post("/api/auth/login", json={"email": "frontdesk@hotel.com", "password": "FrontDesk123!"})
    assert fd_res.status_code == 200
    fd_headers = {"Authorization": f"Bearer {fd_res.json()['access_token']}"}

    uid = int(time.time() * 1000) % 1000000
    guest1_res = client.post("/api/auth/register", json={
        "email": f"edge_guest_1_{uid}@test.com", "password": "Password123!", "full_name": "Guest One"
    })
    assert guest1_res.status_code == 201
    guest1_headers = {"Authorization": f"Bearer {guest1_res.json()['access_token']}"}

    guest2_res = client.post("/api/auth/register", json={
        "email": f"edge_guest_2_{uid}@test.com", "password": "Password123!", "full_name": "Guest Two"
    })
    assert guest2_res.status_code == 201
    guest2_headers = {"Authorization": f"Bearer {guest2_res.json()['access_token']}"}

    # Create dedicated test room
    test_room_num = f"8{uid % 100:02d}"
    create_room = client.post("/api/rooms", json={
        "room_number": test_room_num,
        "room_type": "Executive Penthouse Suite",
        "capacity": 3,
        "price_per_night": 299.0,
        "status": "Available",
        "description": "Suite for operations edge-cases verification",
        "is_active": True
    }, headers=admin_headers)
    assert create_room.status_code == 201
    room_id = create_room.json()["id"]

    # ----------------------------------------------------
    # EDGE CASE 1: SAME-DAY TURNAROUND
    # ----------------------------------------------------
    print("\n[1/6] Testing Same-Day Turnaround (Guest A out on day X, Guest B in on day X)...")
    day_1 = date.today() + timedelta(days=900 + (uid % 50))
    turnaround_date = day_1 + timedelta(days=3)
    day_3 = turnaround_date + timedelta(days=3)

    # Guest A books [day_1, turnaround_date)
    book_a = client.post("/api/bookings", json={
        "room_id": room_id,
        "check_in_date": day_1.isoformat(),
        "check_out_date": turnaround_date.isoformat(),
        "guest_name": "Guest A"
    }, headers=guest1_headers)
    assert book_a.status_code == 201, f"Guest A booking failed: {book_a.text}"

    # Guest B books [turnaround_date, day_3) on the same room
    book_b = client.post("/api/bookings", json={
        "room_id": room_id,
        "check_in_date": turnaround_date.isoformat(),
        "check_out_date": day_3.isoformat(),
        "guest_name": "Guest B"
    }, headers=guest2_headers)
    assert book_b.status_code == 201, f"Same-day turnaround booking rejected erroneously: {book_b.text}"
    print("  [OK] Same-Day Turnaround verified: Check-out date is strictly excluded from availability lock.")

    # ----------------------------------------------------
    # EDGE CASE 2: ROOM DEACTIVATION CONFLICTS
    # ----------------------------------------------------
    print("\n[2/6] Testing Room Deactivation Safeguard with Active/Upcoming Bookings...")
    deact_blocked = client.delete(f"/api/rooms/{room_id}", headers=admin_headers)
    assert deact_blocked.status_code == 400
    assert "active or upcoming reservation" in deact_blocked.json()["detail"]
    print("  [OK] Room deactivation blocked successfully when active/upcoming reservations exist.")

    # ----------------------------------------------------
    # EDGE CASE 3: STATUS TRANSITION SAFEGUARDS
    # ----------------------------------------------------
    print("\n[3/6] Testing Status Transition Safeguard (Block Check-In if Cleaning/Maintenance)...")
    client.patch(f"/api/rooms/{room_id}/status", json={"status": "Cleaning"}, headers=fd_headers)
    booking_a_id = book_a.json()["id"]
    ci_blocked_clean = client.post(f"/api/bookings/{booking_a_id}/check-in", headers=fd_headers)
    assert ci_blocked_clean.status_code == 400
    assert "Cleaning" in ci_blocked_clean.json()["detail"]

    client.patch(f"/api/rooms/{room_id}/status", json={"status": "Maintenance"}, headers=fd_headers)
    ci_blocked_maint = client.post(f"/api/bookings/{booking_a_id}/check-in", headers=fd_headers)
    assert ci_blocked_maint.status_code == 400
    assert "Maintenance" in ci_blocked_maint.json()["detail"]

    client.patch(f"/api/rooms/{room_id}/status", json={"status": "Available"}, headers=fd_headers)
    ci_success = client.post(f"/api/bookings/{booking_a_id}/check-in", headers=fd_headers)
    assert ci_success.status_code == 200
    assert ci_success.json()["status"] == "Checked-In"
    print("  [OK] Status transition safeguard verified: Check-in blocked until room is set to 'Available'.")

    # ----------------------------------------------------
    # EDGE CASE 4: CANCELLATION CAPACITY RELEASE
    # ----------------------------------------------------
    print("\n[4/6] Testing Cancellation Capacity Release & Availability Recovery...")
    booking_b_id = book_b.json()["id"]
    cancel_b = client.post(f"/api/bookings/{booking_b_id}/cancel", headers=guest2_headers)
    assert cancel_b.status_code == 200
    assert cancel_b.json()["status"] == "Cancelled"

    book_rebooked = client.post("/api/bookings", json={
        "room_id": room_id,
        "check_in_date": turnaround_date.isoformat(),
        "check_out_date": day_3.isoformat(),
        "guest_name": "Guest One Rebook"
    }, headers=guest1_headers)
    assert book_rebooked.status_code == 201
    print("  [OK] Cancellation capacity release verified: Locked dates purged and immediately bookable.")

    # ----------------------------------------------------
    # EDGE CASE 5: EARLY CHECK-OUT CAPACITY RELEASE
    # ----------------------------------------------------
    print("\n[5/6] Testing Early Check-Out Capacity Release...")
    early_checkin = date.today()
    early_checkout = early_checkin + timedelta(days=5)

    early_book = client.post("/api/bookings", json={
        "room_id": room_id,
        "check_in_date": early_checkin.isoformat(),
        "check_out_date": early_checkout.isoformat(),
        "guest_name": "Early Depart Guest"
    }, headers=guest1_headers)
    assert early_book.status_code == 201
    early_book_id = early_book.json()["id"]

    client.patch(f"/api/rooms/{room_id}/status", json={"status": "Available"}, headers=fd_headers)
    client.post(f"/api/bookings/{early_book_id}/check-in", headers=fd_headers)

    co_res = client.post(f"/api/bookings/{early_book_id}/check-out", headers=fd_headers)
    assert co_res.status_code == 200
    assert co_res.json()["status"] == "Checked-Out"

    future_start = early_checkin + timedelta(days=1)
    future_end = early_checkin + timedelta(days=4)
    guest2_early_rebook = client.post("/api/bookings", json={
        "room_id": room_id,
        "check_in_date": future_start.isoformat(),
        "check_out_date": future_end.isoformat(),
        "guest_name": "Guest Rebooking Early Released Slots"
    }, headers=guest2_headers)
    assert guest2_early_rebook.status_code == 201
    print("  [OK] Early check-out capacity release verified: Unused future nights purged and returned to pool.")

    # ----------------------------------------------------
    # ITEM 1: ADMIN SYSTEM SETTINGS & DYNAMIC POLICY UPDATE
    # ----------------------------------------------------
    print("\n[6/6] Testing Admin System Settings & Dynamic AI Concierge Policy Update...")
    policies_get = client.get("/api/admin/policies", headers=admin_headers)
    assert policies_get.status_code == 200
    assert len(policies_get.json()) >= 5

    # Update Wi-Fi Policy
    new_wifi_pass = f"UpdatedSecret_{uid}"
    put_policy = client.put("/api/admin/policies/wifi", json={
        "title": "Updated High-Speed Wi-Fi Credentials",
        "content": f"Connect to 'Grand_VIP_5G'. Password is '{new_wifi_pass}'. Network is GrandHotel_Guest."
    }, headers=admin_headers)
    assert put_policy.status_code == 200

    # Query AI Concierge to confirm dynamic policy reflection
    concierge_res = client.post("/api/concierge/chat", json={
        "message": "What is the wifi password?"
    })
    assert concierge_res.status_code == 200
    assert new_wifi_pass in concierge_res.json()["reply"]
    print("  [OK] Admin dynamic policy update verified: AI Concierge immediately used updated policy text.")

    # Restore default policy for other tests
    client.put("/api/admin/policies/wifi", json={
        "title": POLICIES["wifi"]["title"],
        "content": POLICIES["wifi"]["content"]
    }, headers=admin_headers)

    print("\n========================================================")
    print("[SUCCESS] ALL OPERATIONS GAPS & SETTINGS AUDITED & VERIFIED")
    print("========================================================\n")

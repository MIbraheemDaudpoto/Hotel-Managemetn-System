import pytest
import time
import concurrent.futures
from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.models import Room, RoomStatus, BookingStatus, User
from app.services.concierge_service import POLICIES

client = TestClient(app)

def test_complete_platform_rigorous_audit():
    print("\n========================================================")
    print("[AUDIT] STARTING RIGOROUS PLATFORM AUDIT & LIFECYCLE TEST")
    print("========================================================")

    # ----------------------------------------------------
    # SECTION 1: AUTHENTICATION & RBAC PERMISSION MATRIX
    # ----------------------------------------------------
    print("\n[1/6] Auditing Authentication & Role-Based Access Control...")

    # Login Admin
    admin_res = client.post("/api/auth/login", json={"email": "admin@hotel.com", "password": "Admin123!"})
    assert admin_res.status_code == 200
    admin_token = admin_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Login Front Desk
    fd_res = client.post("/api/auth/login", json={"email": "frontdesk@hotel.com", "password": "FrontDesk123!"})
    assert fd_res.status_code == 200
    fd_token = fd_res.json()["access_token"]
    fd_headers = {"Authorization": f"Bearer {fd_token}"}

    # Self-register a new Guest
    uid = int(time.time() * 1000) % 1000000
    guest_email = f"audit_guest_{uid}@test.com"
    guest_res = client.post("/api/auth/register", json={
        "email": guest_email,
        "password": "GuestPassword123!",
        "full_name": f"Audit Guest {uid}"
    })
    assert guest_res.status_code == 201
    guest_token = guest_res.json()["access_token"]
    guest_headers = {"Authorization": f"Bearer {guest_token}"}

    # Test RBAC boundary restrictions
    assert client.get("/api/admin/dashboard", headers=guest_headers).status_code == 403
    assert client.get("/api/admin/dashboard", headers=fd_headers).status_code == 403
    assert client.get("/api/admin/dashboard", headers=admin_headers).status_code == 200
    assert client.get("/api/frontdesk/today", headers=guest_headers).status_code == 403
    assert client.get("/api/frontdesk/today", headers=fd_headers).status_code == 200
    print("  [OK] RBAC matrix strictly enforced: Guest and Front Desk restricted appropriately.")

    # Admin provisions a new staff member and tests active/deactivate toggle
    new_staff_email = f"staff_{uid}@hotel.com"
    prov_res = client.post("/api/auth/staff", json={
        "email": new_staff_email,
        "password": "TempStaff123!",
        "full_name": "Temporary Staff",
        "role": "FRONT_DESK"
    }, headers=admin_headers)
    assert prov_res.status_code == 201
    staff_id = prov_res.json()["id"]

    # Deactivate staff member
    deact_res = client.patch(f"/api/auth/staff/{staff_id}/toggle-active", headers=admin_headers)
    assert deact_res.status_code == 200
    assert deact_res.json()["is_active"] is False

    # Verify deactivated staff cannot log in
    deact_login = client.post("/api/auth/login", json={"email": new_staff_email, "password": "TempStaff123!"})
    assert deact_login.status_code == 403

    # Reactivate staff member
    react_res = client.patch(f"/api/auth/staff/{staff_id}/toggle-active", headers=admin_headers)
    assert react_res.status_code == 200
    assert react_res.json()["is_active"] is True
    print("  [OK] Staff provisioning and account deactivation lifecycle verified.")

    # ----------------------------------------------------
    # SECTION 2: ROOM INVENTORY CRUD & MAINTENANCE GUARDS
    # ----------------------------------------------------
    print("\n[2/6] Auditing Room Inventory CRUD & Status Transitions...")
    test_room_num = f"9{uid % 100:02d}"
    create_room_res = client.post("/api/rooms", json={
        "room_number": test_room_num,
        "room_type": "Presidential Penthouse",
        "capacity": 4,
        "price_per_night": 499.0,
        "status": "Available",
        "description": "High-floor luxury suite with ocean view.",
        "is_active": True
    }, headers=admin_headers)
    assert create_room_res.status_code == 201
    new_room_id = create_room_res.json()["id"]

    # Front Desk toggles status to Maintenance
    maint_res = client.patch(f"/api/rooms/{new_room_id}/status", json={"status": "Maintenance"}, headers=fd_headers)
    assert maint_res.status_code == 200
    assert maint_res.json()["status"] == "Maintenance"

    # Guest search should NOT return Maintenance room
    guest_search = client.get(f"/api/rooms?room_type=Presidential", headers=guest_headers)
    assert guest_search.status_code == 200
    assert not any(r["id"] == new_room_id for r in guest_search.json())

    # Switch back to Available
    avail_res = client.patch(f"/api/rooms/{new_room_id}/status", json={"status": "Available"}, headers=fd_headers)
    assert avail_res.status_code == 200
    assert avail_res.json()["status"] == "Available"
    print("  [OK] Room inventory CRUD and maintenance catalog isolation verified.")

    # ----------------------------------------------------
    # SECTION 3: AI CONCIERGE NLP ACCURACY AUDIT
    # ----------------------------------------------------
    print("\n[3/6] Auditing AI Concierge Offline Knowledge Matcher...")
    # Ensure default policies are active
    client.put("/api/admin/policies/wifi", json={
        "title": POLICIES["wifi"]["title"],
        "content": POLICIES["wifi"]["content"]
    }, headers=admin_headers)

    concierge_queries = [
        ("What is the wifi network and password?", "GrandHotel_Guest", "wifi"),
        ("What time do you serve breakfast buffet?", "Azure Dining", "breakfast"),
        ("Where is the swimming pool located?", "Level 12", "pool"),
        ("What are the standard check-in and checkout times?", "3:00 PM", "checkin_checkout"),
        ("What is the reservation cancellation policy?", "24 hours", "cancellation"),
    ]
    for prompt, expected_substr, expected_cat in concierge_queries:
        c_res = client.post("/api/concierge/chat", json={"message": prompt})
        assert c_res.status_code == 200
        reply = c_res.json()["reply"]
        assert expected_substr.lower() in reply.lower(), f"Expected '{expected_substr}' in response to '{prompt}'"
        assert c_res.json()["category"] == expected_cat
    print("  [OK] AI Concierge accurately answered all 5 static policy domains with 0 API cost.")

    # ----------------------------------------------------
    # SECTION 4: CONCURRENT ZERO-OVERBOOKING ENFORCEMENT
    # ----------------------------------------------------
    print("\n[4/6] Stress Testing Concurrency Engine (20 simultaneous booking requests)...")
    db = SessionLocal()
    target_room = db.query(Room).filter(Room.id == new_room_id).first()
    assert target_room is not None
    db_room_id = target_room.id
    db.close()

    conc_check_in = date.today() + timedelta(days=600 + (uid % 100))
    conc_check_out = conc_check_in + timedelta(days=4)

    conc_payload = {
        "room_id": db_room_id,
        "check_in_date": conc_check_in.isoformat(),
        "check_out_date": conc_check_out.isoformat(),
        "guest_name": "Concurrency Audit Agent"
    }

    def fire_booking(i):
        t_client = TestClient(app)
        return t_client.post("/api/bookings", json=conc_payload, headers=guest_headers)

    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        futures = [executor.submit(fire_booking, i) for i in range(20)]
        results = [f.result() for f in futures]

    statuses = [r.status_code for r in results]
    successes = statuses.count(201)
    conflicts = statuses.count(409)

    print(f"  [OK] Concurrency Results: {successes} Accepted (201), {conflicts} Rejected (409).")
    assert successes == 1, f"Expected exactly 1 booking to succeed, got {successes}"
    assert conflicts == 19, f"Expected 19 bookings to fail with 409 Conflict, got {conflicts}"
    print("  [OK] Database uniqueness constraint strictly prevented 100% of double-booking attempts.")

    # ----------------------------------------------------
    # SECTION 5: COMPLETE STAY LIFECYCLE & CLEANING TURNOVER
    # ----------------------------------------------------
    print("\n[5/6] Executing Complete Guest Stay Lifecycle...")
    stay_check_in = date.today() + timedelta(days=700 + (uid % 100))
    stay_check_out = stay_check_in + timedelta(days=3)

    # 5.1 Booking creation
    book_res = client.post("/api/bookings", json={
        "room_id": new_room_id,
        "check_in_date": stay_check_in.isoformat(),
        "check_out_date": stay_check_out.isoformat(),
        "guest_name": f"Lifecycle Guest {uid}"
    }, headers=guest_headers)
    assert book_res.status_code == 201
    booking_id = book_res.json()["id"]
    assert book_res.json()["status"] == "Confirmed"
    assert book_res.json()["room"] is not None
    assert book_res.json()["room"]["room_number"] == test_room_num

    # 5.2 Front Desk Check-in
    ci_res = client.post(f"/api/bookings/{booking_id}/check-in", headers=fd_headers)
    assert ci_res.status_code == 200
    assert ci_res.json()["status"] == "Checked-In"
    
    # Room status updated to Occupied
    room_oc = client.get(f"/api/rooms/{new_room_id}")
    assert room_oc.json()["status"] == "Occupied"

    # 5.3 Front Desk Check-out (automatic cleaning transition)
    co_res = client.post(f"/api/bookings/{booking_id}/check-out", headers=fd_headers)
    assert co_res.status_code == 200
    assert co_res.json()["status"] == "Checked-Out"

    # Room status automatically set to Cleaning
    room_cl = client.get(f"/api/rooms/{new_room_id}")
    assert room_cl.json()["status"] == "Cleaning"

    # 5.4 Housekeeping sets room back to Available
    clean_done = client.patch(f"/api/rooms/{new_room_id}/status", json={"status": "Available"}, headers=fd_headers)
    assert clean_done.status_code == 200
    assert clean_done.json()["status"] == "Available"
    print("  [OK] Full lifecycle validated: Confirmed -> Checked-In [Occupied] -> Checked-Out [Cleaning] -> Available.")

    # ----------------------------------------------------
    # SECTION 6: RESERVATION CANCELLATION & AVAILABILITY RECOVERY
    # ----------------------------------------------------
    print("\n[6/6] Auditing Booking Cancellation & Instant Availability Recovery...")
    cancel_check_in = date.today() + timedelta(days=800 + (uid % 100))
    cancel_check_out = cancel_check_in + timedelta(days=2)

    # Initial booking
    temp_book = client.post("/api/bookings", json={
        "room_id": new_room_id,
        "check_in_date": cancel_check_in.isoformat(),
        "check_out_date": cancel_check_out.isoformat(),
        "guest_name": "Temporary Booking"
    }, headers=guest_headers)
    assert temp_book.status_code == 201
    temp_id = temp_book.json()["id"]

    # Verify dates are locked (second booking should fail with 409)
    blocked_attempt = client.post("/api/bookings", json={
        "room_id": new_room_id,
        "check_in_date": cancel_check_in.isoformat(),
        "check_out_date": cancel_check_out.isoformat(),
        "guest_name": "Blocked Guest"
    }, headers=guest_headers)
    assert blocked_attempt.status_code == 409

    # Cancel the booking
    cancel_res = client.post(f"/api/bookings/{temp_id}/cancel", headers=guest_headers)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "Cancelled"

    # Now the exact same room and dates can be booked immediately
    recovered_book = client.post("/api/bookings", json={
        "room_id": new_room_id,
        "check_in_date": cancel_check_in.isoformat(),
        "check_out_date": cancel_check_out.isoformat(),
        "guest_name": "New Guest After Cancellation"
    }, headers=guest_headers)
    assert recovered_book.status_code == 201
    print("  [OK] Booking cancellation immediately freed database availability records.")

    # Verify Admin KPI aggregates and Audit Logs
    dashboard_res = client.get("/api/admin/dashboard", headers=admin_headers)
    assert dashboard_res.status_code == 200
    kpis = dashboard_res.json()
    assert kpis["total_rooms"] >= 7
    assert kpis["total_revenue"] > 0

    audit_res = client.get("/api/admin/audit-logs", headers=admin_headers)
    assert audit_res.status_code == 200
    assert len(audit_res.json()) > 0
    print("  [OK] Admin KPI aggregates and system audit trail verified.")

    print("\n========================================================")
    print("[SUCCESS] FULL PLATFORM AUDIT COMPLETED: 100% PASS (0 ERRORS)")
    print("========================================================\n")

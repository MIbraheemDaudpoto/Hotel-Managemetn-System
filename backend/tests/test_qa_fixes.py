import pytest
import time
from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.models.models import UserRole
from app.services.concierge_service import POLICIES

client = TestClient(app)

def test_qa_fixes_and_improvements():
    print("\n========================================================")
    print("[QA FIXES AUDIT] TESTING QA REPORT DEFECTS & ENHANCEMENTS")
    print("========================================================")

    uid = int(time.time() * 1000) % 1000000

    # 1. TEST CONFIG & .ENV LOADING
    print("\n[1/5] Verifying .env Configuration Loading...")
    assert settings.PROJECT_NAME == "Lean Hotel Management System API"
    assert settings.ALGORITHM == "HS256"
    assert settings.ACCESS_TOKEN_EXPIRE_MINUTES > 0
    print("  [OK] Secure configuration loaded successfully.")

    # 2. TEST 8-CHARACTER PASSWORD VALIDATION & 422 HANDLING
    print("\n[2/5] Verifying 8-Character Password Validation (422 response)...")
    short_pw_res = client.post("/api/auth/register", json={
        "email": f"short_pw_{uid}@test.com",
        "password": "123",  # Invalid short password (< 8 chars)
        "full_name": "Short Password User"
    })
    assert short_pw_res.status_code == 422
    err_json = short_pw_res.json()
    assert "detail" in err_json
    assert isinstance(err_json["detail"], list)
    assert any("at least 8" in str(d.get("msg", "")).lower() or "8 characters" in str(d.get("msg", "")).lower() for d in err_json["detail"])
    print("  [OK] Backend strictly rejects passwords < 8 characters with 422 validation error array.")

    # Register valid guest with >= 8 char password
    guest_email = f"qa_guest_{uid}@test.com"
    valid_reg = client.post("/api/auth/register", json={
        "email": guest_email,
        "password": "Password123!",
        "full_name": "QA Valid Guest"
    })
    assert valid_reg.status_code == 201
    guest_token = valid_reg.json()["access_token"]
    guest_headers = {"Authorization": f"Bearer {guest_token}"}
    guest_user_id = valid_reg.json()["user"]["id"]

    # Register a second guest
    guest2_reg = client.post("/api/auth/register", json={
        "email": f"qa_guest2_{uid}@test.com",
        "password": "Password123!",
        "full_name": "QA Guest Two"
    })
    assert guest2_reg.status_code == 201
    guest2_headers = {"Authorization": f"Bearer {guest2_reg.json()['access_token']}"}

    # Staff logins
    admin_login = client.post("/api/auth/login", json={"email": "admin@hotel.com", "password": "Admin123!"})
    assert admin_login.status_code == 200
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    fd_login = client.post("/api/auth/login", json={"email": "frontdesk@hotel.com", "password": "FrontDesk123!"})
    assert fd_login.status_code == 200
    fd_headers = {"Authorization": f"Bearer {fd_login.json()['access_token']}"}

    # 3. TEST BOOKING INVOICE GENERATION & RBAC ACCESS
    print("\n[3/5] Verifying Booking Invoice Generation & RBAC Access Control...")
    # Create a room
    room_res = client.post("/api/rooms", json={
        "room_number": f"INV{uid % 1000:03d}",
        "room_type": "Presidential Oceanfront",
        "capacity": 4,
        "price_per_night": 350.0,
        "status": "Available",
        "is_active": True
    }, headers=admin_headers)
    assert room_res.status_code == 201
    room_id = room_res.json()["id"]

    # Guest 1 books room
    check_in = date.today() + timedelta(days=1500 + (uid % 100))
    check_out = check_in + timedelta(days=4)
    booking_res = client.post("/api/bookings", json={
        "room_id": room_id,
        "check_in_date": check_in.isoformat(),
        "check_out_date": check_out.isoformat(),
        "guest_name": "QA Valid Guest"
    }, headers=guest_headers)
    assert booking_res.status_code == 201
    booking_id = booking_res.json()["id"]

    # Guest 1 retrieves invoice (Succeeds)
    inv_guest = client.get(f"/api/bookings/{booking_id}/invoice", headers=guest_headers)
    assert inv_guest.status_code == 200
    inv_data = inv_guest.json()
    assert inv_data["booking_reference"] == booking_res.json()["booking_reference"]
    assert inv_data["number_of_nights"] == 4
    assert inv_data["nightly_rate"] == 350.0
    assert inv_data["total_amount"] == 1400.0
    assert "Grand Hotel" in inv_data["hotel_name"]

    # Guest 2 attempts to retrieve Guest 1's invoice (Rejected 403 Forbidden)
    inv_unauth = client.get(f"/api/bookings/{booking_id}/invoice", headers=guest2_headers)
    assert inv_unauth.status_code == 403
    assert "access denied" in inv_unauth.json()["detail"].lower()

    # Front Desk retrieves Guest 1's invoice (Succeeds)
    inv_fd = client.get(f"/api/bookings/{booking_id}/invoice", headers=fd_headers)
    assert inv_fd.status_code == 200
    assert inv_fd.json()["total_amount"] == 1400.0

    # Admin retrieves Guest 1's invoice (Succeeds)
    inv_admin = client.get(f"/api/bookings/{booking_id}/invoice", headers=admin_headers)
    assert inv_admin.status_code == 200
    print("  [OK] Booking invoice generation and RBAC access validated perfectly.")

    # 4. TEST FRONT DESK AUDIT LOG FILTERING
    print("\n[4/5] Verifying Front Desk Operational Audit Trail Filtering...")
    # Trigger an admin-sensitive action (Policy update)
    client.put("/api/admin/policies/wifi", json={
        "title": "Wi-Fi Access",
        "content": "GrandHotel_Guest Network Details"
    }, headers=admin_headers)

    # Front Desk requests audit logs
    fd_audit = client.get("/api/audit", headers=fd_headers)
    assert fd_audit.status_code == 200
    fd_logs = fd_audit.json()
    # Confirm no sensitive admin actions appear in Front Desk log
    for log in fd_logs:
        assert log["action"] in ["CREATE_BOOKING", "CHECK_IN_GUEST", "CHECK_OUT_GUEST", "UPDATE_ROOM_STATUS", "CANCEL_BOOKING"], f"Forbidden action {log['action']} leaked to Front Desk"

    # Admin requests audit logs (all actions present)
    admin_audit = client.get("/api/audit", headers=admin_headers)
    assert admin_audit.status_code == 200
    admin_actions = [log["action"] for log in admin_audit.json()]
    assert "UPDATE_HOTEL_POLICY" in admin_actions or "CREATE_ROOM" in admin_actions
    print("  [OK] Audit trail filtering verified: Front Desk only receives operational actions.")

    # Restore default policy for other tests
    client.put("/api/admin/policies/wifi", json={
        "title": POLICIES["wifi"]["title"],
        "content": POLICIES["wifi"]["content"]
    }, headers=admin_headers)

    # 5. TEST FRONT DESK REPORTS SUMMARY (FINANCIAL MASKING)
    print("\n[5/5] Verifying Reports Summary & Financial Masking...")
    fd_reports = client.get("/api/reports", headers=fd_headers)
    assert fd_reports.status_code == 200
    # Financial revenue is masked to 0.0 for Front Desk
    assert fd_reports.json()["total_revenue"] == 0.0
    assert fd_reports.json()["total_rooms"] > 0

    admin_reports = client.get("/api/reports", headers=admin_headers)
    assert admin_reports.status_code == 200
    assert admin_reports.json()["total_revenue"] > 0.0
    print("  [OK] Reports summary verified: Revenue masked for Front Desk, full metrics for Admin.")

    print("\n========================================================")
    print("[SUCCESS] ALL QA FIXES AUDITED & VALIDATED (100% PASS)")
    print("========================================================\n")

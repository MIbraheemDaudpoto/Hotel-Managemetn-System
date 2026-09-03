import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_role_based_access_control():
    # 1. Guest login
    guest_login = client.post("/api/auth/login", json={"email": "guest@hotel.com", "password": "Guest123!"})
    assert guest_login.status_code == 200
    guest_token = guest_login.json()["access_token"]
    guest_headers = {"Authorization": f"Bearer {guest_token}"}

    # 2. Front Desk login
    fd_login = client.post("/api/auth/login", json={"email": "frontdesk@hotel.com", "password": "FrontDesk123!"})
    assert fd_login.status_code == 200
    fd_token = fd_login.json()["access_token"]
    fd_headers = {"Authorization": f"Bearer {fd_token}"}

    # 3. Admin login
    admin_login = client.post("/api/auth/login", json={"email": "admin@hotel.com", "password": "Admin123!"})
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Guest cannot access Admin dashboard
    guest_dash = client.get("/api/admin/dashboard", headers=guest_headers)
    assert guest_dash.status_code == 403

    # Front Desk cannot access Admin dashboard
    fd_dash = client.get("/api/admin/dashboard", headers=fd_headers)
    assert fd_dash.status_code == 403

    # Admin CAN access Admin dashboard
    admin_dash = client.get("/api/admin/dashboard", headers=admin_headers)
    assert admin_dash.status_code == 200
    assert "occupancy_rate_percent" in admin_dash.json()

    # Guest cannot access Front Desk operations
    guest_fd = client.get("/api/frontdesk/today", headers=guest_headers)
    assert guest_fd.status_code == 403

    # Front Desk CAN access Front Desk operations
    fd_ops = client.get("/api/frontdesk/today", headers=fd_headers)
    assert fd_ops.status_code == 200

    # Unauthenticated user cannot access protected endpoints
    unauth = client.get("/api/auth/me")
    assert unauth.status_code == 401

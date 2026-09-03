# Hotel Management System

A lean single-property hotel operations platform with a React Native / Expo mobile client and a FastAPI backend.

## Features

- Guest registration, login, room search, booking, cancellation, and concierge chat
- Front Desk arrivals, departures, check-in, check-out, and room status management
- Admin dashboard, room inventory, staff accounts, booking history, policies, and audit logs
- Role-based access control and database-backed booking availability protection

## Requirements

- Python 3.11 or newer
- Node.js 20 or newer
- Expo Go compatible with Expo SDK 54
- Android or iOS device and a computer on the same Wi-Fi network for physical-device testing

## Backend Setup

From the project root, open a PowerShell terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m app.seed
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Backend URLs:

```text
http://localhost:8000
http://localhost:8000/docs
```

The backend uses SQLite by default. Environment variables can be placed in `backend/.env`; do not commit that file.

## Frontend Setup

Open a second PowerShell terminal from the project root:

```powershell
cd frontend
npm install
npx expo-doctor
npx expo start --lan
```

Scan the QR code with Expo Go. The phone and computer must use the same Wi-Fi network.

For a physical device, the app discovers the computer's Expo LAN address automatically. To set the API address manually:

```powershell
$env:EXPO_PUBLIC_API_URL="http://192.168.1.25:8000/api"
npx expo start --lan -c
```

Replace `192.168.1.25` with the computer's IPv4 address from `ipconfig`.

If Windows Firewall blocks the phone, allow port 8000 in an elevated PowerShell terminal:

```powershell
New-NetFirewallRule -DisplayName "Hotel API Port 8000" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
```

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Guest | `guest@hotel.com` | `Guest123!` |
| Front Desk | `frontdesk@hotel.com` | `FrontDesk123!` |
| Admin | `admin@hotel.com` | `Admin123!` |

## Testing

Run backend tests:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m pytest -q
```

Run frontend type checking:

```powershell
cd frontend
npx tsc --noEmit
```

Validate the Expo project:

```powershell
npx expo-doctor
```

## Startup Order

1. Start the backend API on port 8000.
2. Start Expo with `npx expo start --lan`.
3. Open the project in Expo Go on the device.

## Project Structure

```text
backend/    FastAPI API, SQLAlchemy models, migrations, seed data, and tests
frontend/   Expo Router mobile application
```

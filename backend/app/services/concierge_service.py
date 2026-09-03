import re
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.models import HotelPolicy

POLICIES = {
    "wifi": {
        "title": "Wi-Fi Access & Network Details",
        "keywords": ["wifi", "wi-fi", "internet", "password", "network", "connect", "broadband", "web"],
        "content": "Complimentary high-speed Wi-Fi is available across all guest rooms, lobby, and dining areas. Network name: 'GrandHotel_Guest'. Password: 'WelcomeToGrand2026'. No login portal required.",
        "actions": ["View Wi-Fi Details", "Contact IT Support"]
    },
    "breakfast": {
        "title": "Breakfast Hours & Dining Options",
        "keywords": ["breakfast", "dining", "morning meal", "buffet", "eat", "food", "restaurant", "menu"],
        "content": "Continental & Hot Buffet breakfast is served daily at the Azure Dining Room on Level 1 from 6:30 AM to 10:30 AM (weekdays) and 7:00 AM to 11:00 AM (weekends & holidays). In-room breakfast dining can also be ordered through room service until 11:30 AM.",
        "actions": ["Order Room Service", "View Restaurant Menu"]
    },
    "pool": {
        "title": "Swimming Pool & Wellness Amenities",
        "keywords": ["pool", "swimming", "swim", "spa", "gym", "fitness", "sauna", "towel", "jacuzzi"],
        "content": "Our heated rooftop infinity pool and wellness spa on Level 12 are open daily from 6:00 AM to 10:00 PM. Complimentary fresh towels and sun loungers are provided on-site. Adult-only hours are from 8:00 PM to 10:00 PM.",
        "actions": ["View Pool Rules", "Book Spa Treatment"]
    },
    "checkin_checkout": {
        "title": "Check-in & Check-out Hours",
        "keywords": ["check-in", "check in", "check-out", "check out", "checkout", "checkin", "arrival", "departure", "late checkout", "early checkin", "time", "hours"],
        "content": "Standard Check-in time begins at 3:00 PM. Standard Check-out time is by 11:00 AM. Early check-in (from 12:00 PM) and express late check-out (up to 2:00 PM) can be requested at the Front Desk subject to availability.",
        "actions": ["Request Late Check-out", "Contact Front Desk"]
    },
    "cancellation": {
        "title": "Reservation Cancellation & Refund Policy",
        "keywords": ["cancel", "cancellation", "refund", "modify", "change date", "policy", "penalty", "charge", "terms"],
        "content": "Bookings may be cancelled free of charge up to 24 hours prior to standard check-in (3:00 PM on arrival date). Cancellations within 24 hours are subject to a fee equal to the first night's room rate. Cancel directly via the 'My Bookings' tab.",
        "actions": ["Manage My Bookings", "View Cancellation Terms"]
    },
    "parking": {
        "title": "Parking & Valet Services",
        "keywords": ["parking", "park", "car", "valet", "garage", "vehicle", "ev", "charging"],
        "content": "Secure underground parking is available for all registered hotel guests at /night. Valet parking is available at the main entrance. We also offer 4 dedicated Level-2 EV charging stations on Parking Level B1.",
        "actions": ["Request Valet", "View Parking Map"]
    },
    "housekeeping": {
        "title": "Housekeeping & Room Cleaning",
        "keywords": ["cleaning", "housekeeping", "towel", "linen", "amenity", "clean", "trash", "soap", "shampoo"],
        "content": "Daily housekeeping service is conducted between 9:00 AM and 4:00 PM. You can request extra towels, pillows, toiletries, or make a Do Not Disturb request via Front Desk or the concierge at any time.",
        "actions": ["Request Fresh Towels", "Set Do Not Disturb"]
    }
}

def answer_concierge_query(query: str, db: Session = None) -> Dict[str, Any]:
    cleaned = query.lower().strip()
    
    if any(cleaned.startswith(g) for g in ["hi", "hello", "hey", "good morning", "good evening", "greetings"]):
        return {
            "reply": "Hello! Welcome to our Grand Hotel Concierge. I am your 24/7 AI Assistant. I can help you with Wi-Fi details, pool & spa hours, breakfast timings, check-in/check-out rules, and cancellation policies. How can I assist your stay today?",
            "category": "greeting",
            "matched_policy_key": None,
            "suggested_actions": ["Wi-Fi Info", "Breakfast Hours", "Pool & Gym", "Check-in/Out Times", "Cancellation Policy"]
        }

    best_match_key = None
    max_score = 0
    
    for key, data in POLICIES.items():
        score = 0
        for kw in data["keywords"]:
            if kw in cleaned:
                score += len(kw)
        if score > max_score:
            max_score = score
            best_match_key = key

    if best_match_key and max_score > 0:
        policy_data = POLICIES[best_match_key]
        if db:
            db_policy = db.query(HotelPolicy).filter(HotelPolicy.key == best_match_key).first()
            if db_policy:
                return {
                    "reply": f"{db_policy.title}\n\n{db_policy.content}",
                    "category": best_match_key,
                    "matched_policy_key": best_match_key,
                    "suggested_actions": policy_data["actions"]
                }

        return {
            "reply": f"{policy_data['title']}\n\n{policy_data['content']}",
            "category": best_match_key,
            "matched_policy_key": best_match_key,
            "suggested_actions": policy_data["actions"]
        }

    return {
        "reply": "Thank you for asking! For specific stay inquiries, here are our quick reference guides for Wi-Fi ('WelcomeToGrand2026'), Breakfast (6:30-10:30 AM on L1), Rooftop Pool (6:00 AM-10:00 PM on L12), and Check-in (3:00 PM) / Check-out (11:00 AM). You can also tap below or contact our Front Desk at ext 0.",
        "category": "general",
        "matched_policy_key": None,
        "suggested_actions": ["Wi-Fi Info", "Breakfast Times", "Pool Hours", "Cancellation Policy"]
    }

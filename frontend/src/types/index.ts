export type UserRole = 'GUEST' | 'FRONT_DESK' | 'ADMIN';

export type RoomStatus = 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance';

export type BookingStatus = 'Pending' | 'Confirmed' | 'Checked-In' | 'Checked-Out' | 'Cancelled';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Room {
  id: number;
  room_number: string;
  room_type: string;
  capacity: number;
  price_per_night: number;
  status: RoomStatus;
  description?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Booking {
  id: number;
  booking_reference: string;
  user_id: number;
  room_id: number;
  check_in_date: string;
  check_out_date: string;
  total_price: number;
  status: BookingStatus;
  guest_name: string;
  guest_email: string;
  created_at: string;
  updated_at: string;
  room?: Room;
}

export interface Invoice {
  invoice_number: string;
  hotel_name: string;
  hotel_address: string;
  hotel_contact: string;
  booking_reference: string;
  guest_name: string;
  guest_email: string;
  room_number: string;
  room_type: string;
  check_in_date: string;
  check_out_date: string;
  number_of_nights: number;
  nightly_rate: number;
  subtotal: number;
  tax_and_fees: number;
  total_amount: number;
  status: string;
  issue_date: string;
}

export interface DailyOperations {
  today: string;
  expected_arrivals: Booking[];
  expected_departures: Booking[];
  active_in_house: Booking[];
  all_rooms: Room[];
}

export interface DashboardKPIs {
  total_rooms: number;
  occupied_rooms: number;
  cleaning_rooms: number;
  maintenance_rooms: number;
  available_rooms: number;
  occupancy_rate_percent: number;
  today_checkins_count: number;
  today_checkouts_count: number;
  total_active_and_upcoming_bookings: number;
  total_revenue: number;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_email: string;
  action: string;
  target_type: string;
  target_id?: string;
  details?: string;
  timestamp: string;
}

export interface HotelPolicyItem {
  key: string;
  title: string;
  content: string;
}

export interface ConciergeMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  category?: string;
  suggested_actions?: string[];
}

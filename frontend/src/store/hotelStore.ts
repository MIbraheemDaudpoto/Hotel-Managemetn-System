import { create } from 'zustand';
import { Room, Booking, DailyOperations, DashboardKPIs, AuditLog, ConciergeMessage, HotelPolicyItem, Invoice } from '../types';
import { apiClient } from '../api/client';
import { parseApiError } from '../api/auth';

interface HotelState {
  rooms: Room[];
  selectedRoom: Room | null;
  checkInDate: string;
  checkOutDate: string;
  roomTypeFilter: string;
  capacityFilter: number;
  isLoadingRooms: boolean;

  myBookings: Booking[];
  allBookings: Booking[];
  bookingStatusFilter: string;
  bookingDateFrom: string;
  bookingDateTo: string;
  isLoadingBookings: boolean;

  currentInvoice: Invoice | null;
  isLoadingInvoice: boolean;

  operations: DailyOperations | null;
  isLoadingOperations: boolean;

  kpis: DashboardKPIs | null;
  auditLogs: AuditLog[];
  staffList: any[];
  policies: HotelPolicyItem[];
  isLoadingAdmin: boolean;

  messages: ConciergeMessage[];
  isChatLoading: boolean;

  setCheckInDate: (date: string) => void;
  setCheckOutDate: (date: string) => void;
  setRoomTypeFilter: (type: string) => void;
  setCapacityFilter: (cap: number) => void;
  setSelectedRoom: (room: Room | null) => void;
  setBookingStatusFilter: (status: string) => void;
  setBookingDateFrom: (date: string) => void;
  setBookingDateTo: (date: string) => void;
  setCurrentInvoice: (inv: Invoice | null) => void;

  fetchRooms: () => Promise<void>;
  fetchMyBookings: () => Promise<void>;
  fetchAllBookings: (status?: string, dateFrom?: string, dateTo?: string) => Promise<void>;
  fetchInvoice: (bookingId: number) => Promise<Invoice | null>;
  createBooking: (roomId: number, checkIn: string, checkOut: string, guestName?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  cancelBooking: (bookingId: number) => Promise<boolean>;

  fetchOperations: () => Promise<void>;
  checkInGuest: (bookingId: number) => Promise<boolean>;
  checkOutGuest: (bookingId: number) => Promise<boolean>;
  updateRoomStatus: (roomId: number, status: string) => Promise<boolean>;

  fetchDashboardKPIs: () => Promise<void>;
  fetchAuditLogs: () => Promise<void>;
  fetchStaffList: () => Promise<void>;
  fetchPolicies: () => Promise<void>;
  updatePolicy: (key: string, title: string, content: string) => Promise<boolean>;
  createRoom: (roomData: Partial<Room>) => Promise<boolean>;
  updateRoom: (roomId: number, roomData: Partial<Room>) => Promise<boolean>;
  deactivateRoom: (roomId: number) => Promise<boolean>;
  createStaff: (staffData: any) => Promise<boolean>;
  toggleStaffActive: (userId: number) => Promise<boolean>;

  sendConciergeMessage: (text: string) => Promise<void>;
  clearChat: () => void;
}

const getTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const getDayAfterTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().split('T')[0];
};

export const useHotelStore = create<HotelState>((set, get) => ({
  rooms: [],
  selectedRoom: null,
  checkInDate: getTomorrowDate(),
  checkOutDate: getDayAfterTomorrowDate(),
  roomTypeFilter: '',
  capacityFilter: 1,
  isLoadingRooms: false,

  myBookings: [],
  allBookings: [],
  bookingStatusFilter: '',
  bookingDateFrom: '',
  bookingDateTo: '',
  isLoadingBookings: false,

  currentInvoice: null,
  isLoadingInvoice: false,

  operations: null,
  isLoadingOperations: false,

  kpis: null,
  auditLogs: [],
  staffList: [],
  policies: [],
  isLoadingAdmin: false,

  messages: [
    {
      id: 'welcome',
      text: 'Welcome to Grand Hotel! I am your 24/7 AI Concierge. Ask me anything about Wi-Fi credentials, pool hours, breakfast service, check-in/out policies, or booking rules.',
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggested_actions: ['Wi-Fi Info', 'Breakfast Hours', 'Pool & Spa', 'Check-in/Out Times', 'Cancellation Policy'],
    },
  ],
  isChatLoading: false,

  setCheckInDate: (date) => set({ checkInDate: date }),
  setCheckOutDate: (date) => set({ checkOutDate: date }),
  setRoomTypeFilter: (type) => set({ roomTypeFilter: type }),
  setCapacityFilter: (cap) => set({ capacityFilter: cap }),
  setSelectedRoom: (room) => set({ selectedRoom: room }),
  setBookingStatusFilter: (status) => set({ bookingStatusFilter: status }),
  setBookingDateFrom: (date) => set({ bookingDateFrom: date }),
  setBookingDateTo: (date) => set({ bookingDateTo: date }),
  setCurrentInvoice: (inv) => set({ currentInvoice: inv }),

  fetchRooms: async () => {
    set({ isLoadingRooms: true });
    try {
      const { checkInDate, checkOutDate, roomTypeFilter, capacityFilter } = get();
      const params: any = {};
      if (checkInDate && checkOutDate) {
        params.check_in_date = checkInDate;
        params.check_out_date = checkOutDate;
      }
      if (roomTypeFilter) params.room_type = roomTypeFilter;
      if (capacityFilter > 1) params.min_capacity = capacityFilter;

      const res = await apiClient.get('/rooms', { params });
      set({ rooms: res.data, isLoadingRooms: false });
    } catch {
      set({ isLoadingRooms: false });
    }
  },

  fetchMyBookings: async () => {
    set({ isLoadingBookings: true });
    try {
      const res = await apiClient.get('/bookings/my');
      set({ myBookings: res.data, isLoadingBookings: false });
    } catch {
      set({ isLoadingBookings: false });
    }
  },

  fetchAllBookings: async (statusFilter, dateFrom, dateTo) => {
    set({ isLoadingBookings: true });
    try {
      const { bookingStatusFilter, bookingDateFrom, bookingDateTo } = get();
      const params: any = {};
      const status = statusFilter !== undefined ? statusFilter : bookingStatusFilter;
      const from = dateFrom !== undefined ? dateFrom : bookingDateFrom;
      const to = dateTo !== undefined ? dateTo : bookingDateTo;

      if (status) params.status_filter = status;
      if (from) params.date_from = from;
      if (to) params.date_to = to;

      const res = await apiClient.get('/bookings/all', { params });
      set({ allBookings: res.data, isLoadingBookings: false });
    } catch {
      set({ isLoadingBookings: false });
    }
  },

  fetchInvoice: async (bookingId) => {
    set({ isLoadingInvoice: true });
    try {
      const res = await apiClient.get(`/bookings/${bookingId}/invoice`);
      set({ currentInvoice: res.data, isLoadingInvoice: false });
      return res.data;
    } catch (err: any) {
      set({ isLoadingInvoice: false });
      return null;
    }
  },

  createBooking: async (roomId, checkIn, checkOut, guestName) => {
    try {
      const res = await apiClient.post('/bookings', {
        room_id: roomId,
        check_in_date: checkIn,
        check_out_date: checkOut,
        guest_name: guestName,
      });
      await get().fetchMyBookings();
      await get().fetchRooms();
      return { success: true, data: res.data };
    } catch (err: any) {
      const msg = parseApiError(err);
      return { success: false, error: msg };
    }
  },

  cancelBooking: async (bookingId) => {
    try {
      await apiClient.post(`/bookings/${bookingId}/cancel`);
      await get().fetchMyBookings();
      await get().fetchRooms();
      return true;
    } catch {
      return false;
    }
  },

  fetchOperations: async () => {
    set({ isLoadingOperations: true });
    try {
      const res = await apiClient.get('/frontdesk/today');
      set({ operations: res.data, isLoadingOperations: false });
    } catch {
      set({ isLoadingOperations: false });
    }
  },

  checkInGuest: async (bookingId) => {
    try {
      await apiClient.post(`/bookings/${bookingId}/check-in`);
      await get().fetchOperations();
      return true;
    } catch {
      return false;
    }
  },

  checkOutGuest: async (bookingId) => {
    try {
      await apiClient.post(`/bookings/${bookingId}/check-out`);
      await get().fetchOperations();
      return true;
    } catch {
      return false;
    }
  },

  updateRoomStatus: async (roomId, status) => {
    try {
      await apiClient.patch(`/rooms/${roomId}/status`, { status });
      await get().fetchOperations();
      await get().fetchRooms();
      return true;
    } catch {
      return false;
    }
  },

  fetchDashboardKPIs: async () => {
    set({ isLoadingAdmin: true });
    try {
      const res = await apiClient.get('/admin/dashboard');
      set({ kpis: res.data, isLoadingAdmin: false });
    } catch {
      set({ isLoadingAdmin: false });
    }
  },

  fetchAuditLogs: async () => {
    try {
      const res = await apiClient.get('/audit');
      set({ auditLogs: res.data });
    } catch {}
  },

  fetchStaffList: async () => {
    try {
      const res = await apiClient.get('/auth/staff');
      set({ staffList: res.data });
    } catch {}
  },

  fetchPolicies: async () => {
    try {
      const res = await apiClient.get('/admin/policies');
      set({ policies: res.data });
    } catch {}
  },

  updatePolicy: async (key, title, content) => {
    try {
      await apiClient.put(`/admin/policies/${key}`, { title, content });
      await get().fetchPolicies();
      return true;
    } catch {
      return false;
    }
  },

  createRoom: async (roomData) => {
    try {
      await apiClient.post('/rooms', roomData);
      await get().fetchRooms();
      await get().fetchDashboardKPIs();
      return true;
    } catch {
      return false;
    }
  },

  updateRoom: async (roomId, roomData) => {
    try {
      await apiClient.put(`/rooms/${roomId}`, roomData);
      await get().fetchRooms();
      return true;
    } catch {
      return false;
    }
  },

  deactivateRoom: async (roomId) => {
    try {
      await apiClient.delete(`/rooms/${roomId}`);
      await get().fetchRooms();
      await get().fetchDashboardKPIs();
      return true;
    } catch {
      return false;
    }
  },

  createStaff: async (staffData) => {
    try {
      await apiClient.post('/auth/staff', staffData);
      await get().fetchStaffList();
      return true;
    } catch {
      return false;
    }
  },

  toggleStaffActive: async (userId) => {
    try {
      await apiClient.patch(`/auth/staff/${userId}/toggle-active`);
      await get().fetchStaffList();
      return true;
    } catch {
      return false;
    }
  },

  sendConciergeMessage: async (text) => {
    const userMsg: ConciergeMessage = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      isChatLoading: true,
    }));

    try {
      const res = await apiClient.post('/concierge/chat', { message: text });
      const botMsg: ConciergeMessage = {
        id: (Date.now() + 1).toString(),
        text: res.data.reply,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: res.data.category,
        suggested_actions: res.data.suggested_actions,
      };

      set((state) => ({
        messages: [...state.messages, botMsg],
        isChatLoading: false,
      }));
    } catch {
      const errorMsg: ConciergeMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting to the concierge service right now. Please try again or ask Front Desk.",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      set((state) => ({
        messages: [...state.messages, errorMsg],
        isChatLoading: false,
      }));
    }
  },

  clearChat: () => {
    set({
      messages: [
        {
          id: 'welcome',
          text: 'Welcome to Grand Hotel! I am your 24/7 AI Concierge. Ask me anything about Wi-Fi credentials, pool hours, breakfast service, check-in/out policies, or booking rules.',
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggested_actions: ['Wi-Fi Info', 'Breakfast Hours', 'Pool & Spa', 'Check-in/Out Times', 'Cancellation Policy'],
        },
      ],
    });
  },
}));

import { create } from 'zustand';
import { User } from '../types';
import { apiClient, setAuthToken } from '../api/client';
import { parseApiError, validateRegistration } from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, fullName: string) => Promise<boolean>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { access_token, user } = response.data;
      setAuthToken(access_token);
      set({ token: access_token, user, isLoading: false, error: null });
      return true;
    } catch (err: any) {
      const msg = parseApiError(err);
      set({ isLoading: false, error: msg });
      return false;
    }
  },

  register: async (email: string, password: string, fullName: string) => {
    // Client-side validation
    const valErr = validateRegistration(email, password, fullName);
    if (valErr) {
      set({ error: valErr, isLoading: false });
      return false;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/auth/register', {
        email: email.trim(),
        password,
        full_name: fullName.trim(),
      });
      const { access_token, user } = response.data;
      setAuthToken(access_token);
      set({ token: access_token, user, isLoading: false, error: null });
      return true;
    } catch (err: any) {
      const msg = parseApiError(err);
      set({ isLoading: false, error: msg });
      return false;
    }
  },

  logout: () => {
    setAuthToken(null);
    set({ user: null, token: null, error: null });
  },

  fetchProfile: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      set({ user: response.data });
    } catch {
      get().logout();
    }
  },

  clearError: () => set({ error: null }),
}));

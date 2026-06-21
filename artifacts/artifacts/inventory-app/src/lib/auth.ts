import { create } from 'zustand';

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  token: localStorage.getItem('inventory_token'),
  user: (() => { try { const s = localStorage.getItem('inventory_user'); return s ? JSON.parse(s) : null; } catch { return null; } })(),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('inventory_token', token);
    } else {
      localStorage.removeItem('inventory_token');
      localStorage.removeItem('inventory_user');
    }
    set({ token });
  },
  setUser: (user) => {
    if (user) {
      localStorage.setItem('inventory_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('inventory_user');
    }
    set({ user });
  },
  logout: () => {
    localStorage.removeItem('inventory_token');
    localStorage.removeItem('inventory_user');
    set({ token: null, user: null });
  },
}));

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  uid: string;
  phone?: string;
  name?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  setAuthenticated: (value: boolean) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setUser: (user) => set({ user }),
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    {
      name: 'rapidmedicoco-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

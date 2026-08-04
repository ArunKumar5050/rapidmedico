import { useThemeStore } from '../store/theme';

export const colors = {
  light: {
    brand: {
      primary: '#059669',
      accent: '#0284C7',
      emergency: '#DC2626',
    },
    background: {
      primary: '#F8FAFC',
      secondary: '#FFFFFF',
      elevated: '#F1F5F9',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      muted: '#94A3B8',
    },
    border: {
      default: '#E2E8F0',
      highlight: '#CBD5E1',
    },
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    }
  },
  dark: {
    brand: {
      primary: '#10B981',
      accent: '#06B6D4',
      emergency: '#EF4444',
    },
    background: {
      primary: '#0A0F1D',
      secondary: '#131C2E',
      elevated: '#1E293B',
    },
    text: {
      primary: '#F8FAFC',
      secondary: '#94A3B8',
      muted: '#64748B',
    },
    border: {
      default: '#1E293B',
      highlight: 'rgba(16, 185, 129, 0.3)',
    },
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#06B6D4',
    }
  }
};

export const useThemeColors = () => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  return isDarkMode ? colors.dark : colors.light;
};

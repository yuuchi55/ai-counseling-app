import { create } from 'zustand';
import authService from '../services/authService';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Initialize auth state
  initialize: async () => {
    set({ isLoading: true });
    const result = await authService.checkAuth();
    if (result.success && result.authenticated) {
      set({ user: result.user, isAuthenticated: true });
    }
    set({ isLoading: false });
  },

  // Register
  register: async (userData) => {
    set({ isLoading: true, error: null });
    const result = await authService.register(userData);
    if (result.success) {
      set({ user: result.user, isAuthenticated: true, isLoading: false });
    } else {
      set({ error: result.message, isLoading: false });
    }
    return result;
  },

  // Login
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    const result = await authService.login(email, password);
    if (result.success) {
      set({ user: result.user, isAuthenticated: true, isLoading: false });
    } else {
      set({ error: result.message, isLoading: false });
    }
    return result;
  },

  // Logout
  logout: async () => {
    set({ isLoading: true });
    await authService.logout();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  // Logout from all devices
  logoutAll: async () => {
    set({ isLoading: true });
    const result = await authService.logoutAll();
    if (result.success) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
    return result;
  },

  // Update profile
  updateProfile: async (updates) => {
    set({ isLoading: true, error: null });
    const result = await authService.updateProfile(updates);
    if (result.success) {
      set({ user: result.user, isLoading: false });
    } else {
      set({ error: result.message, isLoading: false });
    }
    return result;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    set({ isLoading: true, error: null });
    const result = await authService.changePassword(currentPassword, newPassword);
    set({ isLoading: false });
    if (!result.success) {
      set({ error: result.message });
    }
    return result;
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    set({ isLoading: true, error: null });
    const result = await authService.requestPasswordReset(email);
    set({ isLoading: false });
    if (!result.success) {
      set({ error: result.message });
    }
    return result;
  },

  // Reset password
  resetPassword: async (token, password) => {
    set({ isLoading: true, error: null });
    const result = await authService.resetPassword(token, password);
    set({ isLoading: false });
    if (!result.success) {
      set({ error: result.message });
    }
    return result;
  },

  // Verify email
  verifyEmail: async (token) => {
    set({ isLoading: true, error: null });
    const result = await authService.verifyEmail(token);
    set({ isLoading: false });
    if (result.success && get().user) {
      set({ user: { ...get().user, isEmailVerified: true } });
    } else if (!result.success) {
      set({ error: result.message });
    }
    return result;
  },

  // Delete account
  deleteAccount: async (password) => {
    set({ isLoading: true, error: null });
    const result = await authService.deleteAccount(password);
    if (result.success) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    } else {
      set({ error: result.message, isLoading: false });
    }
    return result;
  },

  // Clear error
  clearError: () => set({ error: null })
}));

export default useAuthStore;
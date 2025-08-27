import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await api.post('/auth/refresh-token');
        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

const authService = {
  // Register new user
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      const { accessToken, user } = response.data.data;
      localStorage.setItem('accessToken', accessToken);
      return { success: true, user, accessToken };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  },

  // Login user
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user } = response.data.data;
      localStorage.setItem('accessToken', accessToken);
      return { success: true, user, accessToken };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  },

  // Logout user
  async logout() {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('accessToken');
      return { success: true };
    } catch (error) {
      localStorage.removeItem('accessToken');
      return { success: true };
    }
  },

  // Logout from all devices
  async logoutAll() {
    try {
      await api.post('/auth/logout-all');
      localStorage.removeItem('accessToken');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Logout failed'
      };
    }
  },

  // Get current user profile
  async getProfile() {
    try {
      const response = await api.get('/auth/profile');
      return { success: true, user: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch profile'
      };
    }
  },

  // Update user profile
  async updateProfile(updates) {
    try {
      const response = await api.put('/auth/profile', updates);
      return { success: true, user: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Profile update failed'
      };
    }
  },

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password change failed'
      };
    }
  },

  // Request password reset
  async requestPasswordReset(email) {
    try {
      await api.post('/auth/password-reset', { email });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password reset request failed'
      };
    }
  },

  // Reset password with token
  async resetPassword(token, password) {
    try {
      await api.post(`/auth/password-reset/${token}`, { password });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password reset failed'
      };
    }
  },

  // Verify email with token
  async verifyEmail(token) {
    try {
      await api.get(`/auth/verify-email/${token}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Email verification failed'
      };
    }
  },

  // Check authentication status
  async checkAuth() {
    try {
      const response = await api.get('/auth/check');
      return {
        success: true,
        authenticated: response.data.authenticated,
        user: response.data.data
      };
    } catch (error) {
      return { success: false, authenticated: false };
    }
  },

  // Delete account
  async deleteAccount(password) {
    try {
      await api.delete('/auth/account', { data: { password } });
      localStorage.removeItem('accessToken');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Account deletion failed'
      };
    }
  }
};

export default authService;
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
  verifyEmail: (email, otp) => api.post('/auth/verify-email', { email, otp }),
  resendOTP: (email) => api.post('/auth/resend-otp', { email }),
};

// Messages API calls
export const messagesAPI = {
  getMessages: (params = {}) => api.get('/messages', { params }),
  getRecentMessages: (roomId = null) => {
    const params = roomId ? { roomId } : {};
    return api.get('/messages/recent', { params });
  },
  sendMessage: (messageData) => api.post('/messages', messageData),
  editMessage: (messageId, messageData) => api.put(`/messages/${messageId}`, messageData),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
  searchMessages: (query) => api.get('/messages/search', { params: { query } }),
};

// Rooms API calls
export const roomsAPI = {
  getRooms: () => api.get('/rooms'),
  createRoom: (roomData) => api.post('/rooms/create', roomData),
  joinRoom: (roomCode) => api.post('/rooms/join', { roomCode }),
  leaveRoom: (roomId) => api.post(`/rooms/${roomId}/leave`),
  getRoomDetails: (roomId) => api.get(`/rooms/${roomId}`),
  deleteRoom: (roomId) => api.delete(`/rooms/${roomId}`),
};

// Utility functions
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export default api;
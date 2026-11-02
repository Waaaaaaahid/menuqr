import axios from 'axios';

// Set VITE_API_URL on Vercel to the Render API URL, including /api.
// Local development falls back to the Vite proxy path.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('menuqr_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle common auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname.startsWith('/dashboard') || window.location.pathname.startsWith('/setup')) {
        localStorage.removeItem('menuqr_token');
        localStorage.removeItem('menuqr_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

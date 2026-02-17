
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage } from './storage';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Add Token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle 401 & Refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = storage.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');
        
        // Call refresh endpoint directly (bypassing interceptor loop if possible, 
        // but since we use a different path it won't loop on 401 usually unless refresh is also 401)
        const { data } = await axios.post(`${api.defaults.baseURL}/refresh-token`, {
          refresh_token: refreshToken
        });
        
        // Save new tokens
        storage.setToken(data.access_token, data.refresh_token);
        
        // Update header and retry
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        // Refresh failed (expired or invalid)
        storage.clearToken();
        // Redirect to login if in browser
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
           // Optional: window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export { api };

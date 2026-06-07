import { apiClient } from './apiClient';

export const authApi = {
  register: (payload) => apiClient.post('/auth/register', payload),
  login: (payload) => apiClient.post('/auth/login', payload),
  googleLogin: (payload) => apiClient.post('/auth/google', payload),
  requestEmailVerification: (payload) => apiClient.post('/auth/email-verification/request', payload),
  confirmEmailVerification: (payload) => apiClient.post('/auth/email-verification/confirm', payload),
  me: () => apiClient.get('/auth/me'),
  logout: (refreshToken) => apiClient.post('/auth/logout', { refreshToken })
};

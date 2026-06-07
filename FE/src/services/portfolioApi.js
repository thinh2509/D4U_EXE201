import { apiClient } from './apiClient';

export const portfolioApi = {
  getMyPortfolio: () => apiClient.get('/students/me/portfolio'),
  createPortfolioItem: (payload) => apiClient.post('/students/me/portfolio-items', payload),
  updatePortfolioItem: (itemId, payload) => apiClient.put(`/students/me/portfolio-items/${itemId}`, payload),
  deletePortfolioItem: (itemId) => apiClient.delete(`/students/me/portfolio-items/${itemId}`),
  publishPortfolioItem: (itemId) => apiClient.post(`/students/me/portfolio-items/${itemId}/publish`),
  unpublishPortfolioItem: (itemId) => apiClient.post(`/students/me/portfolio-items/${itemId}/unpublish`),
  getPublicPortfolio: (studentId) => apiClient.get(`/students/${studentId}/portfolio`),
  hidePortfolioItem: (itemId, payload) => apiClient.post(`/admin/portfolio-items/${itemId}/hide`, payload)
};

import { apiClient } from './apiClient';

export const studentCapabilityApi = {
  getMySkills: () => apiClient.get('/students/me/skills'),
  createSkill: (payload) => apiClient.post('/students/me/skills', payload),
  updateSkill: (skillId, payload) => apiClient.put(`/students/me/skills/${skillId}`, payload),
  deleteSkill: (skillId) => apiClient.delete(`/students/me/skills/${skillId}`),
  getMyPortfolio: () => apiClient.get('/students/me/portfolio'),
  createPortfolioItem: (payload) => apiClient.post('/students/me/portfolio-items', payload),
  updatePortfolioItem: (itemId, payload) => apiClient.put(`/students/me/portfolio-items/${itemId}`, payload),
  deletePortfolioItem: (itemId) => apiClient.delete(`/students/me/portfolio-items/${itemId}`),
  publishPortfolioItem: (itemId) => apiClient.post(`/students/me/portfolio-items/${itemId}/publish`),
  unpublishPortfolioItem: (itemId) => apiClient.post(`/students/me/portfolio-items/${itemId}/unpublish`),
  getStudentProfile: (studentId) => apiClient.get(`/students/${studentId}/profile`),
  getStudentPortfolio: (studentId) => apiClient.get(`/students/${studentId}/portfolio`)
};

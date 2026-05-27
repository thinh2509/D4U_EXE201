import { apiClient } from './apiClient';

export const projectApi = {
  listDesignCategories: () => apiClient.get('/design-categories'),
  listOpenProjects: () => apiClient.get('/projects'),
  listMyProjects: () => apiClient.get('/projects/mine'),
  listMyApplications: () => apiClient.get('/smes/me/applications'),
  listSmeOffers: () => apiClient.get('/smes/me/offers'),
  listStudentApplications: () => apiClient.get('/students/me/applications'),
  listStudentOffers: () => apiClient.get('/students/me/offers'),
  listStudentProjects: () => apiClient.get('/students/me/projects'),
  getProject: (projectId) => apiClient.get(`/projects/${projectId}`),
  createDraft: (payload) => apiClient.post('/projects', payload),
  updateDraft: (projectId, payload) => apiClient.put(`/projects/${projectId}`, payload),
  publishProject: (projectId) => apiClient.post(`/projects/${projectId}/publish`),
  cancelProject: (projectId, cancellationReason) =>
    apiClient.post(`/projects/${projectId}/cancel`, { cancellationReason }),
  deleteProject: (projectId) => apiClient.delete(`/projects/${projectId}`),
  submitApplication: (projectId, payload) => apiClient.post(`/projects/${projectId}/applications`, payload),
  listApplications: (projectId) => apiClient.get(`/projects/${projectId}/applications`),
  createOffer: (projectId, payload) => apiClient.post(`/projects/${projectId}/offers`, payload),
  acceptOffer: (offerId) => apiClient.post(`/offers/${offerId}/accept`),
  rejectOffer: (offerId) => apiClient.post(`/offers/${offerId}/reject`)
};

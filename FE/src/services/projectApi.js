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
  generateAiProposal: (projectId) => apiClient.post('/students/me/ai/proposal-writer', { projectId }),
  getWorkspace: (projectId) => apiClient.get(`/projects/${projectId}/workspace`),
  listSubmissions: (projectId) => apiClient.get(`/projects/${projectId}/submissions`),
  createDraft: (payload) => apiClient.post('/projects', payload),
  updateDraft: (projectId, payload) => apiClient.put(`/projects/${projectId}`, payload),
  updateDeadlines: (projectId, payload) => apiClient.patch(`/projects/${projectId}/deadlines`, payload),
  publishProject: (projectId) => apiClient.post(`/projects/${projectId}/publish`),
  cancelProject: (projectId, cancellationReason) =>
    apiClient.post(`/projects/${projectId}/cancel`, { cancellationReason }),
  abandonProject: (projectId, cancellationReason) =>
    apiClient.post(`/projects/${projectId}/abandon`, { cancellationReason }),
  deleteProject: (projectId) => apiClient.delete(`/projects/${projectId}`),
  submitApplication: (projectId, payload) => apiClient.post(`/projects/${projectId}/applications`, payload),
  listApplications: (projectId) => apiClient.get(`/projects/${projectId}/applications`),
  createOffer: (projectId, payload) => apiClient.post(`/projects/${projectId}/offers`, payload),
  acceptOffer: (offerId) => apiClient.post(`/offers/${offerId}/accept`),
  rejectOffer: (offerId) => apiClient.post(`/offers/${offerId}/reject`),
  submitSubmission: (projectId, payload) => apiClient.post(`/projects/${projectId}/submissions`, payload),
  approveSubmission: (projectId, submissionId, payload) =>
    apiClient.post(`/projects/${projectId}/submissions/${submissionId}/approve`, payload),
  requestRevision: (projectId, submissionId, payload) =>
    apiClient.post(`/projects/${projectId}/submissions/${submissionId}/revision-requests`, payload),
  reportInvalidFile: (projectId, submissionId, payload) =>
    apiClient.post(`/projects/${projectId}/submissions/${submissionId}/invalid-file-reports`, payload)
};

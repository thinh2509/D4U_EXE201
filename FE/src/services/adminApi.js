import { apiClient } from './apiClient';

export const adminApi = {
  getDashboardStats: () => apiClient.get('/admin/dashboard/stats'),
  listUsers: (params) => apiClient.get('/admin/users', { params }),
  getUserDetail: (userId) => apiClient.get(`/admin/users/${userId}`),
  suspendUser: (userId, payload = {}) => apiClient.post(`/admin/users/${userId}/suspend`, payload),
  reactivateUser: (userId, payload = {}) => apiClient.post(`/admin/users/${userId}/reactivate`, payload),
  listProjects: (params) => apiClient.get('/admin/projects', { params }),
  getProjectDetail: (projectId) => apiClient.get(`/admin/projects/${projectId}`),
  forceCompleteProject: (projectId, payload = {}) => apiClient.post(`/projects/${projectId}/admin/force-complete`, payload),
  cancelProjectInReview: (projectId, payload = {}) => apiClient.post(`/projects/${projectId}/admin/cancel`, payload),
  listStudentVerifications: (status) =>
    apiClient.get('/admin/student-verifications', {
      params: status && status !== 'ALL' ? { status } : undefined
    }),
  getStudentVerification: (id) => apiClient.get(`/admin/student-verifications/${id}`),
  getStudentVerificationDocument: (id) =>
    apiClient.get(`/admin/student-verifications/${id}/document`, { responseType: 'blob' }),
  approveStudentVerification: (id) => apiClient.post(`/admin/student-verifications/${id}/approve`),
  rejectStudentVerification: (id, rejectionReason) =>
    apiClient.post(`/admin/student-verifications/${id}/reject`, { rejectionReason }),
  listFeaturePackagePurchases: () => apiClient.get('/admin/feature-package-purchases')
};

import { apiClient } from './apiClient';

export const adminApi = {
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

import { apiClient } from './apiClient';

export const profileApi = {
  getStudentProfile: () => apiClient.get('/students/me'),
  saveStudentProfile: (payload) => apiClient.put('/students/me', payload),
  submitStudentDocumentVerification: ({ documentType, file }) => {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('file', file);

    return apiClient.post('/students/me/verification', formData);
  },
  requestEduVerification: (payload) => apiClient.post('/students/me/edu-verification/request', payload),
  confirmEduVerification: (payload) => apiClient.post('/students/me/edu-verification/confirm', payload),
  getSmeProfile: () => apiClient.get('/smes/me'),
  saveSmeProfile: (payload) => apiClient.put('/smes/me', payload)
};

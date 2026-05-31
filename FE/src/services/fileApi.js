import { apiClient } from './apiClient';

export const fileApi = {
  uploadSubmission: (file) => {
    const body = new FormData();
    body.append('file', file);
    return apiClient.post('/files/submissions', body);
  },
  downloadSubmission: async (fileId, fileName) => {
    const blob = await apiClient.get(`/files/${fileId}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  }
};

import { apiClient } from './apiClient';

export const fileApi = {
  uploadSubmission: (file) => {
    const body = new FormData();
    body.append('file', file);
    return apiClient.post('/files/submissions', body);
  }
};

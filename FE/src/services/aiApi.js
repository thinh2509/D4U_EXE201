import { apiClient } from './apiClient';

export const aiApi = {
  suggestProjectBrief: (payload) => apiClient.post('/ai/project-brief-assistant', payload)
};

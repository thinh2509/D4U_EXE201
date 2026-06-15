import { apiClient } from './apiClient';

export const matchingApi = {
  matchProjectsForStudent: (payload = {}) => apiClient.post('/ai/matching/projects', payload),
  matchStudentsForProject: (projectId, payload = {}) => apiClient.post(`/ai/matching/projects/${projectId}/students`, {
    mode: 'HYBRID',
    ...payload
  })
};

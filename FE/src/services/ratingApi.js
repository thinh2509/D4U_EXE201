import { apiClient } from './apiClient';

export const ratingApi = {
  submitProjectRating: (projectId, payload) => apiClient.post(`/projects/${projectId}/ratings`, payload),
  listMyRatings: () => apiClient.get('/ratings/me')
};

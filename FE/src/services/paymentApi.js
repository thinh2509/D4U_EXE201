import { apiClient } from './apiClient';

export const paymentApi = {
  createOfferPayment: (offerId) => apiClient.post(`/offers/${offerId}/payment`),
  getProjectEscrow: (projectId) => apiClient.get(`/projects/${projectId}/escrow`),
  getPaymentStatus: (paymentId) => apiClient.get(`/payments/${paymentId}`),
  getReturnStatus: (paymentId) => apiClient.get(`/payments/${paymentId}/return-status`)
};

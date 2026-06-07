import { apiClient } from './apiClient';

export const walletApi = {
  getMyWallet: () => apiClient.get('/wallets/me'),
  listTransactions: () => apiClient.get('/wallets/me/transactions'),
  createPaymentMethod: (payload) => apiClient.post('/payment-methods', payload),
  listPaymentMethods: () => apiClient.get('/payment-methods/me'),
  createWithdrawalRequest: (payload) => apiClient.post('/withdrawal-requests', payload),
  listWithdrawalRequests: () => apiClient.get('/withdrawal-requests/me'),
  listAdminWithdrawalRequests: () => apiClient.get('/admin/withdrawal-requests'),
  processWithdrawal: (withdrawalId, payload) => apiClient.post(`/admin/withdrawal-requests/${withdrawalId}/process`, payload),
  listAdminRefunds: () => apiClient.get('/admin/refunds'),
  markRefundCompleted: (refundId, payload) =>
    apiClient.post(`/admin/refunds/${refundId}/mark-completed`, payload)
};

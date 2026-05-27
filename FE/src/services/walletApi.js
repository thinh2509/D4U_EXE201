import { apiClient } from './apiClient';

export const walletApi = {
  getMyWallet: () => apiClient.get('/wallets/me'),
  listTransactions: () => apiClient.get('/wallets/me/transactions'),
  createPaymentMethod: (payload) => apiClient.post('/payment-methods', payload),
  createWithdrawalRequest: (payload) => apiClient.post('/withdrawal-requests', payload),
  processWithdrawal: (withdrawalId, payload) => apiClient.post(`/admin/withdrawal-requests/${withdrawalId}/process`, payload)
};

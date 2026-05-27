import { apiClient } from './apiClient';

export const packageApi = {
  listPackages: (role) => apiClient.get('/feature-packages', { params: role ? { role } : undefined }),
  purchasePackage: (packageId) => apiClient.post('/feature-package-purchases', { packageId }),
  createPurchasePayment: (purchaseId) => apiClient.post(`/feature-package-purchases/${purchaseId}/payment`),
  listMyEntitlements: () => apiClient.get('/me/feature-entitlements')
};

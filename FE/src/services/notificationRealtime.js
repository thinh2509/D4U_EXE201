import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { apiBaseUrl } from './apiClient.js';

function getNotificationHubUrl() {
  if (apiBaseUrl.startsWith('http://') || apiBaseUrl.startsWith('https://')) {
    return apiBaseUrl.replace(/\/api\/v1$/i, '') + '/hubs/notifications';
  }

  return '/hubs/notifications';
}

export function createNotificationConnection() {
  return new HubConnectionBuilder()
    .withUrl(getNotificationHubUrl(), {
      accessTokenFactory: () => localStorage.getItem('accessToken') ?? ''
    })
    .withAutomaticReconnect()
    .configureLogging(import.meta.env.DEV ? LogLevel.Warning : LogLevel.Error)
    .build();
}

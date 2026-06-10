import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

function getNotificationHubUrl() {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

  if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
    return baseUrl.replace(/\/api\/v1$/i, '') + '/hubs/notifications';
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

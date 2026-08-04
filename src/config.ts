const API_URLS = {
  localhost: 'http://localhost:3001',
  production: 'https://TU-API-ORION.onrender.com',
} as const

export function getApiUrl(): string {
  const host = window.location.hostname
  if (host === 'localhost' || host === '127.0.0.1') {
    return API_URLS.localhost
  }
  return API_URLS.production
}

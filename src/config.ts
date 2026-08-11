/** Versión visible en portada (Welcome + Home). Subir en cada cambio visible/funcional del front principal. */
export const APP_VERSION = 'v1.3'

const API_URLS = {
  localhost: 'http://localhost:3001',
  production: 'https://orion-83ct.onrender.com',
} as const

function isLanHost(host: string): boolean {
  return (
    /^192\.168\.\d+\.\d+$/.test(host) ||
    /^10\.\d+\.\d+\.\d+$/.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(host)
  )
}

export function getApiUrl(): string {
  const host = window.location.hostname
  if (host === 'localhost' || host === '127.0.0.1') {
    return API_URLS.localhost
  }
  if (isLanHost(host)) {
    return `http://${host}:3001`
  }
  return API_URLS.production
}

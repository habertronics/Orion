/**
 * Código de acceso del tablero de mantenimiento.
 * Cámbialo antes de compartir el enlace. No lo publiques en la home de Orión.
 */
export const STATUS_ACCESS_PIN = "6666";

export const APP_VERSION = "v1.8";

/** Netlify / Render / Neon: cada 30 s. El clima se cachea ~30 min en el servidor. */
export const CHECK_INTERVAL_MS = 30_000;

/** Umbral de latencia (ms) para semáforo amarillo. */
export const SLOW_MS = {
  netlify: 2500,
  render: 4000,
  neon: 1500,
  climate: 3000,
  backups: 8000,
};

/** Si el último backup es más viejo que esto → amarillo; el doble → rojo. */
export const BACKUP_STALE_MS = 48 * 60 * 60 * 1000;

export const ENDPOINTS = {
  netlify: "https://habertronic-orion.netlify.app/",
  apiHealth: "https://orion-83ct.onrender.com/api/health",
  apiDeep: "https://orion-83ct.onrender.com/api/health/deep",
  apiBackups: "https://orion-83ct.onrender.com/api/admin/backups",
};

export const SESSION_KEY = "orion-status-unlocked";

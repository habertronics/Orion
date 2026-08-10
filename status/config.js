/**
 * Código de acceso del tablero de mantenimiento.
 * Cámbialo antes de compartir el enlace. No lo publiques en la home de Orión.
 */
export const STATUS_ACCESS_PIN = "6666";

export const APP_VERSION = "v1.5";

/** Netlify / Render / Neon: cada 30 s. El clima se cachea ~30 min en el servidor. */
export const CHECK_INTERVAL_MS = 30_000;

/** Umbral de latencia (ms) para semáforo amarillo. */
export const SLOW_MS = {
  netlify: 2500,
  render: 4000,
  neon: 1500,
  climate: 3000,
};

export const ENDPOINTS = {
  netlify: "https://habertronic-orion.netlify.app/",
  apiHealth: "https://orion-83ct.onrender.com/api/health",
  apiDeep: "https://orion-83ct.onrender.com/api/health/deep",
};

export const SESSION_KEY = "orion-status-unlocked";

export const APP_VERSION = "v0.2";

export const API_BASE = "https://orion-83ct.onrender.com";

export const SESSION_KEY = "orion-reps-session";
export const TOKEN_KEY = "orion-reps-token";
export const REMEMBER_KEY = "orion-reps-remember";

/** Origen público para el QR (en local se sustituye por window.location.origin). */
export const APP_ORIGIN =
  typeof window !== "undefined" ? window.location.origin : "https://habertronic-orion.netlify.app";

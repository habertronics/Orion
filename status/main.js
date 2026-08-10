import "./style.css";
import {
  APP_VERSION,
  CHECK_INTERVAL_MS,
  ENDPOINTS,
  SESSION_KEY,
  SLOW_MS,
  STATUS_ACCESS_PIN,
} from "./config.js";

const gatePanel = document.getElementById("gatePanel");
const boardPanel = document.getElementById("boardPanel");
const gateForm = document.getElementById("gateForm");
const pinInput = document.getElementById("pinInput");
const gateError = document.getElementById("gateError");
const refreshBtn = document.getElementById("refreshBtn");
const logoutBtn = document.getElementById("logoutBtn");
const lastCheck = document.getElementById("lastCheck");
const appVer = document.getElementById("appVer");
const shareLink = document.getElementById("shareLink");
const sharePin = document.getElementById("sharePin");
const copyLinkBtn = document.getElementById("copyLinkBtn");
const copyPinBtn = document.getElementById("copyPinBtn");
const shareFeedback = document.getElementById("shareFeedback");

let timerId = 0;
let checking = false;

if (appVer) appVer.textContent = APP_VERSION;

function statusPageUrl() {
  const url = new URL(window.location.href);
  url.hash = "";
  url.search = "";
  // Normaliza a .../status/ para compartir.
  if (!url.pathname.endsWith("/")) {
    if (url.pathname.endsWith("/index.html")) {
      url.pathname = url.pathname.replace(/index\.html$/, "");
    } else if (!url.pathname.endsWith("/status")) {
      // keep as-is
    } else {
      url.pathname = `${url.pathname}/`;
    }
  }
  return url.toString();
}

function fillShareFields() {
  if (shareLink) shareLink.value = statusPageUrl();
  if (sharePin) sharePin.value = STATUS_ACCESS_PIN;
}

function flashShare(message) {
  if (!shareFeedback) return;
  shareFeedback.hidden = false;
  shareFeedback.textContent = message;
  window.setTimeout(() => {
    shareFeedback.hidden = true;
  }, 2200);
}

async function copyText(value, okMessage) {
  try {
    await navigator.clipboard.writeText(value);
    flashShare(okMessage);
  } catch {
    // Fallback: selecciona el campo para copiar a mano.
    flashShare("No se pudo copiar solo: selecciona el texto y copia (Ctrl+C)");
  }
}

function setLamp(key, state, detailText) {
  const card = document.querySelector(`.card[data-key="${key}"]`);
  if (!card) return;
  const lamp = card.querySelector(".lamp");
  const detail = card.querySelector("[data-detail]");
  lamp.className = `lamp ${state}`;
  detail.textContent = detailText;
}

function levelFromMs(ms, slowLimit, ok) {
  if (!ok) return "bad";
  if (ms == null) return "unknown";
  if (ms >= slowLimit) return "slow";
  return "ok";
}

async function timedFetch(url, options = {}) {
  const started = performance.now();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), options.timeoutMs ?? 12_000);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: "no-store",
    });
    const ms = Math.round(performance.now() - started);
    return { res, ms, error: null };
  } catch (err) {
    const ms = Math.round(performance.now() - started);
    return { res: null, ms, error: err };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkNetlify() {
  const { res, ms, error } = await timedFetch(ENDPOINTS.netlify, {
    method: "GET",
    mode: "cors",
    timeoutMs: 10_000,
  });
  // Netlify puede no exponer CORS; un fallo de red real vs opaque.
  if (error && error.name === "AbortError") {
    setLamp("netlify", "bad", `Sin respuesta (${ms} ms)`);
    return;
  }
  if (res) {
    const state = levelFromMs(ms, SLOW_MS.netlify, res.ok);
    setLamp(
      "netlify",
      state,
      res.ok ? `OK · ${ms} ms · HTTP ${res.status}` : `HTTP ${res.status} · ${ms} ms`,
    );
    return;
  }
  // Reintento no-cors: si hay red, suele resolverse (opaque).
  const opaque = await timedFetch(ENDPOINTS.netlify, {
    method: "GET",
    mode: "no-cors",
    timeoutMs: 10_000,
  });
  if (opaque.error) {
    setLamp("netlify", "bad", `No carga · ${opaque.error.message || "error"}`);
    return;
  }
  const state = levelFromMs(opaque.ms, SLOW_MS.netlify, true);
  setLamp("netlify", state, `Alcanzable · ${opaque.ms} ms`);
}

async function checkApiStack() {
  const simple = await timedFetch(ENDPOINTS.apiHealth, { timeoutMs: 15_000 });
  if (!simple.res || !simple.res.ok) {
    const why = simple.error?.message || (simple.res ? `HTTP ${simple.res.status}` : "sin respuesta");
    setLamp("render", "bad", `API caída · ${why}`);
    setLamp("neon", "unknown", "Sin API no se puede comprobar Neon");
    setLamp("climate", "unknown", "Sin API no se puede comprobar Clima");
    return;
  }

  const renderState = levelFromMs(simple.ms, SLOW_MS.render, true);
  setLamp("render", renderState, `Health OK · ${simple.ms} ms`);

  const deep = await timedFetch(ENDPOINTS.apiDeep, { timeoutMs: 20_000 });
  if (!deep.res) {
    setLamp("neon", "bad", `Deep health sin respuesta · ${deep.error?.message || ""}`);
    setLamp("climate", "bad", "Deep health sin respuesta");
    return;
  }

  let payload = null;
  try {
    payload = await deep.res.json();
  } catch {
    setLamp("neon", "bad", `Deep health ilegible · HTTP ${deep.res.status}`);
    setLamp("climate", "bad", `Deep health ilegible · HTTP ${deep.res.status}`);
    return;
  }

  const neon = payload?.checks?.neon;
  const climate = payload?.checks?.climate;

  if (neon?.ok) {
    setLamp(
      "neon",
      levelFromMs(neon.ms ?? deep.ms, SLOW_MS.neon, true),
      `SELECT 1 OK · ${neon.ms ?? "—"} ms`,
    );
  } else {
    setLamp("neon", "bad", neon?.error || "Neon no responde");
  }

  if (climate?.ok) {
    const sample =
      climate.sampleC != null ? ` · muestra ${climate.sampleC}°C` : "";
    const cached = climate.cached ? " · caché" : "";
    const throttleNote = climate.rateLimited ? " · límite temporal Open‑Meteo" : "";
    const state = climate.rateLimited
      ? "slow"
      : levelFromMs(climate.ms ?? deep.ms, SLOW_MS.climate, true);
    setLamp(
      "climate",
      state,
      `Open‑Meteo OK · ${climate.ms ?? "—"} ms${sample}${cached}${throttleNote}`,
    );
  } else if (climate?.rateLimited || /429/.test(String(climate?.error || ""))) {
    setLamp(
      "climate",
      "slow",
      "Open‑Meteo pidió pausa (HTTP 429). No es caída de Orión; reintenta en unos minutos.",
    );
  } else {
    setLamp("climate", "bad", climate?.error || "Clima no responde");
  }

  // Si deep tarda mucho, avisar en Render aunque health simple esté ok.
  if (deep.ms >= SLOW_MS.render && renderState === "ok") {
    setLamp("render", "slow", `Health OK · deep ${deep.ms} ms (lento)`);
  }
}

async function runChecks() {
  if (checking) return;
  checking = true;
  refreshBtn.disabled = true;
  try {
    await Promise.all([checkNetlify(), checkApiStack()]);
    const now = new Date();
    lastCheck.textContent = `Última comprobación: ${now.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })} · auto cada ${CHECK_INTERVAL_MS / 1000}s`;
  } finally {
    checking = false;
    refreshBtn.disabled = false;
  }
}

function startBoard() {
  gatePanel.hidden = true;
  boardPanel.hidden = false;
  fillShareFields();
  void runChecks();
  clearInterval(timerId);
  timerId = window.setInterval(() => void runChecks(), CHECK_INTERVAL_MS);
}

function lockBoard() {
  sessionStorage.removeItem(SESSION_KEY);
  clearInterval(timerId);
  timerId = 0;
  boardPanel.hidden = true;
  gatePanel.hidden = false;
  pinInput.value = "";
  gateError.hidden = true;
}

gateForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const pin = String(pinInput.value || "").trim();
  if (pin === STATUS_ACCESS_PIN) {
    sessionStorage.setItem(SESSION_KEY, "1");
    gateError.hidden = true;
    startBoard();
  } else {
    gateError.hidden = false;
  }
});

copyLinkBtn?.addEventListener("click", () => {
  fillShareFields();
  void copyText(shareLink.value, "Enlace copiado. Ya puedes pegarlo en un mensaje.");
});

copyPinBtn?.addEventListener("click", () => {
  fillShareFields();
  void copyText(sharePin.value, "Contraseña copiada.");
});

refreshBtn.addEventListener("click", () => void runChecks());
logoutBtn.addEventListener("click", lockBoard);

if (sessionStorage.getItem(SESSION_KEY) === "1") {
  startBoard();
}

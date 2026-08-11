import "./style.css";
import QRCode from "qrcode";
import {
  API_BASE,
  APP_VERSION,
  REMEMBER_KEY,
  SESSION_KEY,
  TOKEN_KEY,
} from "./config.js";

const appVer = document.getElementById("appVer");
if (appVer) appVer.textContent = APP_VERSION;

const authPanel = document.getElementById("authPanel");
const homePanel = document.getElementById("homePanel");
const authError = document.getElementById("authError");
const authInfo = document.getElementById("authInfo");
const viewWelcome = document.getElementById("viewWelcome");
const loginForm = document.getElementById("loginForm");
const forgotForm = document.getElementById("forgotForm");
const registerForm = document.getElementById("registerForm");
const goLoginBtn = document.getElementById("goLoginBtn");
const goRegisterBtn = document.getElementById("goRegisterBtn");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const forgotBtn = document.getElementById("forgotBtn");
const forgotEmail = document.getElementById("forgotEmail");
const regFullName = document.getElementById("regFullName");
const regEmail = document.getElementById("regEmail");
const regPassword = document.getElementById("regPassword");
const logoutBtn = document.getElementById("logoutBtn");
const welcomeLine = document.getElementById("welcomeLine");
const qrPreceptorshipBtn = document.getElementById("qrPreceptorshipBtn");
const qrResearcherBtn = document.getElementById("qrResearcherBtn");
const qrCard = document.getElementById("qrCard");
const qrCardTitle = document.getElementById("qrCardTitle");
const qrCardHelp = document.getElementById("qrCardHelp");
const qrCanvas = document.getElementById("qrCanvas");
const qrStatus = document.getElementById("qrStatus");
const qrLinkHint = document.getElementById("qrLinkHint");
const refreshQrBtn = document.getElementById("refreshQrBtn");
const inviteList = document.getElementById("inviteList");
const refreshInvitesBtn = document.getElementById("refreshInvitesBtn");
const countPreceptorship = document.getElementById("countPreceptorship");
const countResearcher = document.getElementById("countResearcher");
const ledeText = document.getElementById("ledeText");

let activeInviteType = "researcher";
/** Historial de pantallas de auth: Regresar vuelve al paso anterior. */
let authStack = ["welcome"];

const ERRORS = {
  invalid_email: "Revisa el correo electrónico.",
  email_taken: "Ese correo ya está registrado.",
  invalid_credentials: "Correo o contraseña incorrectos.",
  missing_password: "Escribe una contraseña.",
  missing_full_name: "Escribe tu nombre completo.",
  rate_limited: "Demasiados intentos. Espera un momento.",
  server_error: "Error del servidor. Intenta de nuevo.",
  network_error: "Sin conexión con la API.",
  rep_required: "Sesión de representante requerida.",
};

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getRemembered() {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.email || !parsed?.password) return null;
    return { email: String(parsed.email), password: String(parsed.password) };
  } catch {
    return null;
  }
}

function setRemembered(email, password) {
  localStorage.setItem(
    REMEMBER_KEY,
    JSON.stringify({ email: normalizeEmail(email), password }),
  );
}

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    if (!raw || !getToken()) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setSession(user) {
  const payload = JSON.stringify({
    id: user.id,
    email: user.email,
    fullName: user.fullName || null,
    displayName: user.displayName || user.fullName || user.email,
  });
  sessionStorage.setItem(SESSION_KEY, payload);
  localStorage.setItem(SESSION_KEY, payload);
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
}

function showError(code) {
  authInfo.hidden = true;
  authError.hidden = false;
  authError.textContent = ERRORS[code] || code || "Error";
}

function showInfo(message) {
  authError.hidden = true;
  authInfo.hidden = false;
  authInfo.textContent = message;
}

function clearMessages() {
  authError.hidden = true;
  authError.textContent = "";
  authInfo.hidden = true;
  authInfo.textContent = "";
}

function showView(name, { push = true } = {}) {
  if (push) {
    const current = authStack[authStack.length - 1];
    if (current !== name) authStack.push(name);
  }
  viewWelcome.hidden = name !== "welcome";
  loginForm.hidden = name !== "login";
  forgotForm.hidden = name !== "forgot";
  registerForm.hidden = name !== "register";
  clearMessages();
}

function goBackAuth() {
  if (authStack.length > 1) authStack.pop();
  const prev = authStack[authStack.length - 1] || "welcome";
  showView(prev, { push: false });
}

async function api(path, { method = "GET", body, auth = false } = {}) {
  const headers = { Accept: "application/json" };
  if (body) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  } catch {
    return { res: null, data: { error: "network_error" } };
  }
}

function showAuth() {
  authPanel.hidden = false;
  homePanel.hidden = true;
  authStack = ["welcome"];
  showView("welcome", { push: false });
  ledeText.hidden = true;
}

function showHome(user) {
  authPanel.hidden = true;
  homePanel.hidden = false;
  ledeText.hidden = false;
  welcomeLine.textContent = `Hola, ${user.displayName || user.email}`;
  ledeText.textContent =
    "Elige una opción. El QR pide correo del médico + Aceptar.";
  void loadInvites();
}

function logout() {
  clearToken();
  clearSession();
  qrCard.hidden = true;
  showAuth();
}

function selectedInviteType() {
  return activeInviteType === "preceptorship" ? "preceptorship" : "researcher";
}

function statusLabel(status) {
  if (status === "registered" || status === "accepted") return "Aceptó";
  if (status === "declined") return "No aceptó";
  if (status === "expired") return "Expiró";
  if (status === "open") return "Pendiente";
  return status;
}

function typeLabel(type) {
  return type === "preceptorship" ? "Preceptorship" : "Investigador";
}

async function loadInvites() {
  inviteList.innerHTML = `<li class="invite-empty">Cargando…</li>`;
  const { res, data } = await api("/api/reps/invites", { auth: true });
  if (!res?.ok) {
    inviteList.innerHTML = `<li class="invite-empty">${ERRORS[data.error] || "No se pudo cargar"}</li>`;
    return;
  }
  if (countPreceptorship) {
    countPreceptorship.textContent = String(data.counts?.preceptorship ?? 0);
  }
  if (countResearcher) {
    countResearcher.textContent = String(data.counts?.researcher ?? 0);
  }
  const rows = data.invitations || [];
  if (!rows.length) {
    inviteList.innerHTML = `<li class="invite-empty">Aún no hay invitaciones.</li>`;
    return;
  }
  inviteList.innerHTML = rows
    .map((row) => {
      const who = row.inviteeName || row.inviteeEmail || "—";
      const email = row.inviteeEmail ? ` · ${row.inviteeEmail}` : "";
      const when = row.acceptedAt
        ? new Date(row.acceptedAt).toLocaleString("es-MX", {
            dateStyle: "short",
            timeStyle: "short",
          })
        : "—";
      return `<li class="invite-item">
        <strong>${escapeHtml(who)}</strong>
        <span>${escapeHtml(statusLabel(row.status))} · ${escapeHtml(typeLabel(row.inviteType))}${escapeHtml(email)}</span>
        <span class="invite-meta">Respuesta: ${escapeHtml(when)}</span>
      </li>`;
    })
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function createAndShowQr(inviteType = activeInviteType) {
  activeInviteType = inviteType === "preceptorship" ? "preceptorship" : "researcher";
  qrCard.hidden = false;
  qrCardTitle.textContent =
    activeInviteType === "preceptorship"
      ? "QR · Preceptorship"
      : "QR · Investigador";
  qrCardHelp.textContent =
    activeInviteType === "preceptorship"
      ? "El médico escanea y acepta una invitación de preceptorship (sin elegir tipo)."
      : "El médico escanea y acepta una invitación de investigador (sin elegir tipo).";
  qrStatus.textContent = "Generando…";
  qrLinkHint.hidden = true;
  const { res, data } = await api("/api/reps/invites", {
    method: "POST",
    auth: true,
    body: { inviteType: activeInviteType },
  });
  if (!res?.ok) {
    qrStatus.textContent = ERRORS[data.error] || "No se pudo crear el QR";
    return;
  }
  const path = data.acceptPath || `/reps/aceptar/?t=${data.token}`;
  const url = `${window.location.origin}${path}`;
  try {
    await QRCode.toCanvas(qrCanvas, url, {
      width: 240,
      margin: 2,
      color: { dark: "#142018", light: "#f4fff7" },
    });
    qrStatus.textContent = "Listo — pide al médico que escanee";
    qrLinkHint.hidden = false;
    qrLinkHint.textContent = url;
    void loadInvites();
  } catch {
    qrStatus.textContent = "Error al dibujar el QR";
  }
}

goLoginBtn.addEventListener("click", () => {
  const remembered = getRemembered();
  if (remembered) {
    loginEmail.value = remembered.email;
    loginPassword.value = remembered.password;
  }
  showView("login");
});

goRegisterBtn.addEventListener("click", () => showView("register"));

forgotBtn.addEventListener("click", () => {
  forgotEmail.value = normalizeEmail(loginEmail.value);
  showView("forgot");
});

document.querySelectorAll("[data-back]").forEach((btn) => {
  btn.addEventListener("click", (event) => {
    event.preventDefault();
    goBackAuth();
  });
});

document.getElementById("homeBackBtn")?.addEventListener("click", () => {
  logout();
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessages();
  const email = normalizeEmail(loginEmail.value);
  const password = loginPassword.value;
  const { res, data } = await api("/api/reps/auth/login", {
    method: "POST",
    body: { email, password },
  });
  if (!res?.ok) {
    showError(data.error || "invalid_credentials");
    return;
  }
  setToken(data.token);
  setSession(data.user);
  setRemembered(email, password);
  showHome(data.user);
});

forgotForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessages();
  const email = normalizeEmail(forgotEmail.value);
  if (!email) {
    showError("invalid_email");
    return;
  }
  const { res, data } = await api("/api/reps/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
  if (!res?.ok) {
    showError(data.error || "server_error");
    return;
  }
  let msg = "Enviamos la contraseña al correo registrado.";
  if (data.temporaryPassword) {
    msg += ` Contraseña temporal: ${data.temporaryPassword}`;
    loginPassword.value = data.temporaryPassword;
  }
  loginEmail.value = email;
  authStack = ["welcome", "login"];
  showView("login", { push: false });
  showInfo(msg);
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessages();
  const email = normalizeEmail(regEmail.value);
  const password = regPassword.value;
  const { res, data } = await api("/api/reps/auth/register", {
    method: "POST",
    body: {
      email,
      password,
      fullName: regFullName.value,
    },
  });
  if (!res?.ok) {
    showError(data.error || "server_error");
    return;
  }
  setToken(data.token);
  setSession(data.user);
  setRemembered(email, password);
  showHome(data.user);
});

logoutBtn.addEventListener("click", logout);
qrPreceptorshipBtn.addEventListener("click", () =>
  void createAndShowQr("preceptorship"),
);
qrResearcherBtn.addEventListener("click", () =>
  void createAndShowQr("researcher"),
);
refreshQrBtn.addEventListener("click", () =>
  void createAndShowQr(activeInviteType),
);
refreshInvitesBtn.addEventListener("click", () => void loadInvites());

const existing = getSession();
if (existing && getToken()) {
  // Siempre empezar en Entrar / Registrarme (no saltar al home).
  showAuth();
} else {
  showAuth();
}

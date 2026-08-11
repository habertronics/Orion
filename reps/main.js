import "./style.css";
import QRCode from "qrcode";
import { API_BASE, APP_VERSION, SESSION_KEY, TOKEN_KEY } from "./config.js";

const appVer = document.getElementById("appVer");
if (appVer) appVer.textContent = APP_VERSION;

const authPanel = document.getElementById("authPanel");
const homePanel = document.getElementById("homePanel");
const authError = document.getElementById("authError");
const authInfo = document.getElementById("authInfo");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const forgotBtn = document.getElementById("forgotBtn");
const regFullName = document.getElementById("regFullName");
const regEmail = document.getElementById("regEmail");
const logoutBtn = document.getElementById("logoutBtn");
const welcomeLine = document.getElementById("welcomeLine");
const qrInviteBtn = document.getElementById("qrInviteBtn");
const qrCard = document.getElementById("qrCard");
const qrCanvas = document.getElementById("qrCanvas");
const qrStatus = document.getElementById("qrStatus");
const qrLinkHint = document.getElementById("qrLinkHint");
const refreshQrBtn = document.getElementById("refreshQrBtn");
const inviteList = document.getElementById("inviteList");
const refreshInvitesBtn = document.getElementById("refreshInvitesBtn");
const ledeText = document.getElementById("ledeText");

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
  ledeText.textContent =
    "Entra con tu correo institucional o regístrate para invitar médicos con tu QR.";
}

function showHome(user) {
  authPanel.hidden = true;
  homePanel.hidden = false;
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
  const el = document.querySelector('input[name="inviteType"]:checked');
  return el?.value === "preceptorship" ? "preceptorship" : "researcher";
}

function statusLabel(status) {
  if (status === "registered") return "Ya investigador";
  if (status === "accepted") return "Aceptó (pendiente registro)";
  if (status === "open") return "QR abierto (sin aceptar)";
  if (status === "expired") return "Expirado";
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
  const rows = data.invitations || [];
  if (!rows.length) {
    inviteList.innerHTML = `<li class="invite-empty">Aún no hay invitaciones.</li>`;
    return;
  }
  inviteList.innerHTML = rows
    .map((row) => {
      const email = row.inviteeEmail || "— (aún sin correo)";
      const when = row.acceptedAt
        ? new Date(row.acceptedAt).toLocaleString("es-MX", {
            dateStyle: "short",
            timeStyle: "short",
          })
        : "—";
      return `<li class="invite-item">
        <strong>${escapeHtml(email)}</strong>
        <span>${escapeHtml(statusLabel(row.status))} · ${escapeHtml(typeLabel(row.inviteType))}</span>
        <span class="invite-meta">Aceptó: ${escapeHtml(when)}${row.medicoAcepto ? " · Médico aceptó: sí" : ""}</span>
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

async function createAndShowQr() {
  qrCard.hidden = false;
  qrStatus.textContent = "Generando…";
  qrLinkHint.hidden = true;
  const { res, data } = await api("/api/reps/invites", {
    method: "POST",
    auth: true,
    body: { inviteType: selectedInviteType() },
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

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const mode = tab.getAttribute("data-auth");
    loginForm.hidden = mode !== "login";
    registerForm.hidden = mode !== "register";
    clearMessages();
  });
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
  showHome(data.user);
});

forgotBtn.addEventListener("click", async () => {
  clearMessages();
  const email = normalizeEmail(loginEmail.value);
  if (!email) {
    showError("invalid_email");
    loginEmail.focus();
    return;
  }
  forgotBtn.disabled = true;
  const { res, data } = await api("/api/reps/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
  forgotBtn.disabled = false;
  if (!res?.ok) {
    showError(data.error || "server_error");
    return;
  }
  let msg =
    data.message ||
    "Si el correo está registrado, enviamos una nueva contraseña.";
  if (data.temporaryPassword) {
    msg += ` Contraseña temporal (mientras configuramos el correo): ${data.temporaryPassword}`;
    loginPassword.value = data.temporaryPassword;
  }
  showInfo(msg);
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessages();
  const email = normalizeEmail(regEmail.value);
  const { res, data } = await api("/api/reps/auth/register", {
    method: "POST",
    body: {
      email,
      fullName: regFullName.value,
    },
  });
  if (!res?.ok) {
    showError(data.error || "server_error");
    return;
  }
  setToken(data.token);
  setSession(data.user);
  if (data.temporaryPassword) {
    // Entra directo; deja constancia de la clave enviada/generada.
    sessionStorage.setItem(
      "orion-reps-last-temp-password",
      data.temporaryPassword,
    );
  }
  showHome(data.user);
});

logoutBtn.addEventListener("click", logout);
qrInviteBtn.addEventListener("click", () => void createAndShowQr());
refreshQrBtn.addEventListener("click", () => void createAndShowQr());
refreshInvitesBtn.addEventListener("click", () => void loadInvites());

document.querySelectorAll('input[name="inviteType"]').forEach((input) => {
  input.addEventListener("change", () => {
    if (!qrCard.hidden) void createAndShowQr();
  });
});

const existing = getSession();
if (existing && getToken()) {
  showHome(existing);
} else {
  showAuth();
}

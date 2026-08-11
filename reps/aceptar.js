import "./aceptar.css";
import { API_BASE } from "./config.js";

const params = new URLSearchParams(window.location.search);
const token = String(params.get("t") || "").trim();

const inviteTitle = document.getElementById("inviteTitle");
const inviteLede = document.getElementById("inviteLede");
const typeBadge = document.getElementById("typeBadge");
const acceptForm = document.getElementById("acceptForm");
const fromLine = document.getElementById("fromLine");
const doctorName = document.getElementById("doctorName");
const doctorEmail = document.getElementById("doctorEmail");
const acceptError = document.getElementById("acceptError");
const donePanel = document.getElementById("donePanel");
const doneText = document.getElementById("doneText");
const registerLink = document.getElementById("registerLink");
const fatalError = document.getElementById("fatalError");

const ERRORS = {
  invalid_email: "Escribe un correo válido.",
  missing_full_name: "Escribe tu nombre completo.",
  invalid_token: "Enlace incompleto.",
  invite_not_found: "Esta invitación no existe.",
  invite_expired: "Esta invitación ya expiró. Pide un QR nuevo.",
  already_accepted: "Esta invitación ya fue aceptada.",
  invite_unavailable: "Invitación no disponible.",
  rate_limited: "Demasiados intentos. Espera un momento.",
  network_error: "Sin conexión. Revisa tu red.",
  server_error: "Error del servidor.",
};

function typeLabel(type) {
  return type === "preceptorship" ? "Preceptorship" : "Investigador";
}

function showFatal(code) {
  fatalError.hidden = false;
  fatalError.textContent = ERRORS[code] || code || "Error";
  inviteLede.textContent = "No se puede continuar con esta invitación.";
}

async function loadInvite() {
  if (!token) {
    showFatal("invalid_token");
    return;
  }
  try {
    const res = await fetch(
      `${API_BASE}/api/reps/invites/public/${encodeURIComponent(token)}`,
      { headers: { Accept: "application/json" }, cache: "no-store" },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showFatal(data.error || "invite_not_found");
      return;
    }
    const label = typeLabel(data.inviteType);
    inviteTitle.textContent =
      data.inviteType === "preceptorship"
        ? "Invitación a preceptorship"
        : "Invitación a investigador";
    typeBadge.hidden = false;
    typeBadge.textContent = label;

    if (data.alreadyAccepted) {
      acceptForm.hidden = true;
      donePanel.hidden = false;
      doneText.textContent = `Ya aceptaste esta invitación de ${label}${
        data.inviteeEmail ? ` (${data.inviteeEmail})` : ""
      }. Te invita ${data.representativeName}.`;
      registerLink.href = data.inviteeEmail
        ? `/?inviteEmail=${encodeURIComponent(data.inviteeEmail)}`
        : "/";
      inviteLede.textContent = data.labName || "Laboratorio Sofía";
      return;
    }
    if (data.status === "expired") {
      showFatal("invite_expired");
      return;
    }
    inviteLede.textContent =
      data.inviteType === "preceptorship"
        ? "Te invitan a un preceptorship con el grupo Orión."
        : "Te invitan a formar parte de los investigadores Orión.";
    fromLine.textContent = `Te invita: ${data.representativeName} · ${data.labName}`;
    acceptForm.hidden = false;
  } catch {
    showFatal("network_error");
  }
}

acceptForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  acceptError.hidden = true;
  const email = String(doctorEmail.value || "").trim().toLowerCase();
  const fullName = String(doctorName.value || "").trim();
  const btn = acceptForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  try {
    const res = await fetch(`${API_BASE}/api/reps/invites/accept`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, email, fullName }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      acceptError.hidden = false;
      acceptError.textContent = ERRORS[data.error] || data.error || "Error";
      btn.disabled = false;
      return;
    }
    acceptForm.hidden = true;
    donePanel.hidden = false;
    const label = typeLabel(data.inviteType);
    doneText.textContent = data.alreadyRegistered
      ? `Aceptaste la invitación de ${label} de ${data.invitedBy}. Tu cuenta ya quedó vinculada.`
      : `Aceptaste la invitación de ${label} de ${data.invitedBy}. Usaremos ${data.inviteeEmail} para vincularte. Entra a Orión con ese correo para registrarte.`;
    registerLink.href = data.registerUrl || "/";
  } catch {
    acceptError.hidden = false;
    acceptError.textContent = ERRORS.network_error;
    btn.disabled = false;
  }
});

void loadInvite();

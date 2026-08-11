import "./aceptar.css";
import { API_BASE } from "./config.js";

const params = new URLSearchParams(window.location.search);
const token = String(params.get("t") || "").trim();

const inviteLede = document.getElementById("inviteLede");
const acceptForm = document.getElementById("acceptForm");
const fromLine = document.getElementById("fromLine");
const doctorEmail = document.getElementById("doctorEmail");
const acceptError = document.getElementById("acceptError");
const donePanel = document.getElementById("donePanel");
const doneText = document.getElementById("doneText");
const registerLink = document.getElementById("registerLink");
const fatalError = document.getElementById("fatalError");

const ERRORS = {
  invalid_email: "Escribe un correo válido.",
  invalid_token: "Enlace incompleto.",
  invite_not_found: "Esta invitación no existe.",
  invite_expired: "Esta invitación ya expiró. Pide un QR nuevo.",
  already_accepted: "Esta invitación ya fue aceptada.",
  invite_unavailable: "Invitación no disponible.",
  rate_limited: "Demasiados intentos. Espera un momento.",
  network_error: "Sin conexión. Revisa tu red.",
  server_error: "Error del servidor.",
};

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
    const res = await fetch(`${API_BASE}/api/reps/invites/public/${encodeURIComponent(token)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showFatal(data.error || "invite_not_found");
      return;
    }
    if (data.alreadyAccepted) {
      acceptForm.hidden = true;
      donePanel.hidden = false;
      doneText.textContent = `Ya aceptaste esta invitación${
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
      "Te invitamos a formar parte del grupo de investigadores Orión.";
    fromLine.textContent = `Te invita: ${data.representativeName} · ${data.labName}`;
    const type = data.inviteType === "preceptorship" ? "preceptorship" : "researcher";
    const radio = document.querySelector(`input[name="acceptType"][value="${type}"]`);
    if (radio) radio.checked = true;
    acceptForm.hidden = false;
  } catch {
    showFatal("network_error");
  }
}

acceptForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  acceptError.hidden = true;
  const email = String(doctorEmail.value || "").trim().toLowerCase();
  const inviteType =
    document.querySelector('input[name="acceptType"]:checked')?.value || "researcher";
  const btn = acceptForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  try {
    const res = await fetch(`${API_BASE}/api/reps/invites/accept`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ token, email, inviteType }),
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
    doneText.textContent = data.alreadyRegistered
      ? `Aceptaste la invitación de ${data.invitedBy}. Tu cuenta de investigador ya quedó vinculada (Médico aceptó · Invitado por).`
      : `Aceptaste la invitación de ${data.invitedBy}. Usaremos ${data.inviteeEmail} para vincularte. Revisa tu correo (o entra a Orión con ese mismo email para registrarte).`;
    registerLink.href = data.registerUrl || "/";
  } catch {
    acceptError.hidden = false;
    acceptError.textContent = ERRORS.network_error;
    btn.disabled = false;
  }
});

void loadInvite();

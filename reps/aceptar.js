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
const declineBtn = document.getElementById("declineBtn");
const acceptError = document.getElementById("acceptError");
const donePanel = document.getElementById("donePanel");
const doneTitle = document.getElementById("doneTitle");
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
  already_declined: "Esta invitación ya quedó como no aceptada.",
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

function setBusy(busy) {
  const submitBtn = acceptForm.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = busy;
  if (declineBtn) declineBtn.disabled = busy;
}

function showDone(message, { showRegister = false, registerUrl = "/app/", title = "Listo" } = {}) {
  acceptForm.hidden = true;
  donePanel.hidden = false;
  if (doneTitle) doneTitle.textContent = title;
  doneText.textContent = message;
  registerLink.hidden = !showRegister;
  registerLink.href = registerUrl || "/app/";
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
      showDone(
        `Ya aceptaste esta invitación de ${label}${
          data.inviteeEmail ? ` (${data.inviteeEmail})` : ""
        }. Te invita ${data.representativeName}.`,
        {
          showRegister: true,
          registerUrl: data.inviteeEmail
            ? `/app/?inviteEmail=${encodeURIComponent(data.inviteeEmail)}`
            : "/app/",
        },
      );
      inviteLede.textContent = data.labName || "Laboratorio Sofía";
      return;
    }
    if (data.alreadyDeclined) {
      showDone("Gracias por su respuesta.", {
        showRegister: false,
        title: "Respuesta registrada",
      });
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

async function postDecision(path) {
  acceptError.hidden = true;
  const email = String(doctorEmail.value || "").trim().toLowerCase();
  const fullName = String(doctorName.value || "").trim();
  if (!fullName) {
    acceptError.hidden = false;
    acceptError.textContent = ERRORS.missing_full_name;
    return;
  }
  if (!email || !email.includes("@")) {
    acceptError.hidden = false;
    acceptError.textContent = ERRORS.invalid_email;
    return;
  }
  setBusy(true);
  try {
    const res = await fetch(`${API_BASE}/api/reps/invites/${path}`, {
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
      setBusy(false);
      return;
    }
    const label = typeLabel(data.inviteType);
    if (path === "decline") {
      showDone("Gracias por su respuesta.", {
        showRegister: false,
        title: "Respuesta registrada",
      });
      return;
    }
    showDone(
      data.alreadyRegistered
        ? `Aceptaste la invitación de ${label} de ${data.invitedBy}. Tu cuenta ya quedó vinculada.`
        : `Aceptaste la invitación de ${label} de ${data.invitedBy}. Usaremos ${data.inviteeEmail} para vincularte. Entra a Orión con ese correo para registrarte.`,
      {
        showRegister: true,
        registerUrl: data.registerUrl || "/app/",
      },
    );
  } catch {
    acceptError.hidden = false;
    acceptError.textContent = ERRORS.network_error;
    setBusy(false);
  }
}

acceptForm.addEventListener("submit", (event) => {
  event.preventDefault();
  void postDecision("accept");
});

declineBtn?.addEventListener("click", () => {
  void postDecision("decline");
});

void loadInvite();

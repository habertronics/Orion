/**
 * Correos de representantes / invitaciones.
 * Hoy: log. Cuando haya SMTP/Resend, se conecta aquí.
 */
function buildInviteEmail({ inviteeEmail, repName, inviteType, registerUrl }) {
  const typeLabel =
    inviteType === 'preceptorship'
      ? 'preceptorship / formación'
      : 'investigador del protocolo Orión';

  const subject = 'Invitación — Cuerpo médico · Laboratorio Sofía';
  const text = [
    `Estimado(a) colega,`,
    ``,
    `El cuerpo médico de Laboratorio Sofía le invita a formar parte del grupo de investigadores Orión (${typeLabel}).`,
    ``,
    `Le invita: ${repName}`,
    ``,
    `Para registrarse o entrar a la aplicación Orión:`,
    registerUrl,
    ``,
    `Con esta invitación quedará vinculado a su representante.`,
    ``,
    `Atentamente,`,
    `Cuerpo médico · Laboratorio Sofía`,
  ].join('\n');

  return { to: inviteeEmail, subject, text };
}

function buildPasswordEmail({ to, fullName, password, reason }) {
  const subject =
    reason === 'reset'
      ? 'Orión Representantes — tu nueva contraseña'
      : 'Orión Representantes — tu contraseña de acceso';
  const greeting = fullName ? `Hola ${fullName},` : 'Hola,';
  const intro =
    reason === 'reset'
      ? 'Pediste recuperar el acceso. Esta es tu nueva contraseña:'
      : 'Tu cuenta de representante quedó creada. Esta es tu contraseña:';
  const text = [
    greeting,
    ``,
    intro,
    password,
    ``,
    `Entra en: https://habertronic-orion.netlify.app/reps/`,
    ``,
    `Atentamente,`,
    `Habertronic Orión`,
  ].join('\n');
  return { to, subject, text };
}

async function sendInviteEmail(payload) {
  const mail = buildInviteEmail(payload);
  console.log('[invite-email] queued', {
    to: mail.to,
    subject: mail.subject,
    inviteType: payload.inviteType,
  });
  return { queued: true, provider: 'log', ...mail };
}

async function sendPasswordEmail(payload) {
  const mail = buildPasswordEmail(payload);
  console.log('[rep-password-email] queued', {
    to: mail.to,
    subject: mail.subject,
    reason: payload.reason,
  });
  return { queued: true, provider: 'log', ...mail };
}

module.exports = {
  buildInviteEmail,
  sendInviteEmail,
  buildPasswordEmail,
  sendPasswordEmail,
};

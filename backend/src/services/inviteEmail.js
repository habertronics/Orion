/**
 * Envío de invitación formal (Laboratorio Sofía / cuerpo médico).
 * Hoy: deja registro en logs. Cuando haya SMTP/Resend, se conecta aquí.
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

async function sendInviteEmail(payload) {
  const mail = buildInviteEmail(payload);
  // Placeholder: sin proveedor de correo configurado aún.
  console.log('[invite-email] queued', {
    to: mail.to,
    subject: mail.subject,
    inviteType: payload.inviteType,
  });
  return { queued: true, provider: 'log', ...mail };
}

module.exports = { buildInviteEmail, sendInviteEmail };

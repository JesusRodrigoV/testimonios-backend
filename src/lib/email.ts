import config from "config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: config.emailHost,
  port: config.emailPort,
  secure: true,
  auth: {
    user: config.emailUser,
    pass: config.emailPassword,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  return transporter.sendMail({
    from: `"Testimonios App" <${config.emailUser}>`,
    to,
    subject,
    html,
  });
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
  const resetLink = `${config.frontendUrl}/reset-password?token=${token}`;

  return sendEmail(
    to,
    "Recuperación de Contraseña",
    `
    <h1>Recuperación de Contraseña</h1>
    <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
    <a href="${resetLink}">Restablecer Contraseña</a>
    <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
    <p>El enlace expirará en 1 hora.</p>
    `,
  );
};

export const send2FASetupEmail = async (
  to: string,
  secret: string,
  qrCodeUrl: string,
) => {
  return sendEmail(
    to,
    "Configuración de Autenticación de Dos Factores",
    `
    <h1>Configuración de 2FA</h1>
    <p>Escanea el siguiente código QR con tu aplicación de autenticación:</p>
    <img src="${qrCodeUrl}" alt="QR Code" />
    <p>O ingresa manualmente este código secreto en tu aplicación:</p>
    <code>${secret}</code>
    `,
  );
};

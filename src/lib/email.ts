import config from "config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: config.emailHost,
  port: config.emailPort,
  secure: config.emailPort === 465, 
  auth: {
    user: config.emailUser,
    pass: config.emailPassword,
  },
  tls: {
    rejectUnauthorized: true,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateLimit: 20,
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
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Configuración 2FA</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            h1 { color: #2c3e50; }
            .qr-code { margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
            .secret-code { 
                background: #e9ecef; 
                padding: 10px; 
                border-radius: 4px; 
                font-family: monospace;
                font-size: 16px;
                letter-spacing: 2px;
            }
            .instructions { margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Configuración de Autenticación de Dos Factores (2FA)</h1>
            
            <div class="instructions">
                <p><strong>Sigue estos pasos para configurar tu 2FA:</strong></p>
                <ol>
                    <li>Descarga una aplicación de autenticación como Google Authenticator o Authy en tu teléfono</li>
                    <li>Abre la aplicación y selecciona "Agregar cuenta" o "+"</li>
                    <li>Escanea el código QR que aparece abajo o ingresa el código manualmente</li>
                </ol>
            </div>

            <div class="qr-code">
                <p><strong>Código QR:</strong></p>
                <img src="${qrCodeUrl}" 
                     alt="Código QR para 2FA" 
                     style="display: block; width: 200px; height: 200px; margin: 20px auto; border: 1px solid #ddd; padding: 10px;"
                />
                <p style="color: #666; font-size: 12px; text-align: center;">
                    Si no puedes ver el código QR, asegúrate de permitir imágenes en tu cliente de correo
                </p>
            </div>

            <p><strong>Si no puedes escanear el código QR, ingresa este código manualmente en tu aplicación:</strong></p>
            <div class="secret-code">
                ${secret}
            </div>

            <p style="color: #dc3545; margin-top: 20px;">
                <strong>¡IMPORTANTE!</strong> Guarda este código en un lugar seguro. 
                Lo necesitarás si alguna vez pierdes acceso a tu aplicación de autenticación.
            </p>
        </div>
    </body>
    </html>
    `,
  );
};
export const send2FACodeEmail = async (email: string, code: string) => {
  try {
    await transporter.sendMail({
      from: '"Sistema Bicentenario" <no-reply@testimonios.bo>',
      to: email,
      subject: "Código de verificación 2FA",
      html: `Tu código temporal es: <strong>${code}</strong>`,
    });
  } catch (error) {
    throw new Error("Error enviando email: " + (error as Error).message);
  }
};

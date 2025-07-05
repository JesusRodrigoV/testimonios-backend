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
  try {
    return await transporter.sendMail({
      from: `"Sistema de Archivo de Testimonios del Bicentenario" <${config.emailUser}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    throw new Error(`Error sending email: ${(error as Error).message}`);
  }
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
  const resetLink = `${config.frontendUrl}/reset-password?token=${token}`;
  const html = `
  <!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperar contraseña - Sistema de Archivos del Bicentenario</title>
    <style>
      :root {
        --primary-color: #1a365d;
        --primary-light: #4a6fa9;
        --primary-dark: #102a4e;
        --text-primary: #333333;
        --text-secondary: #4a5568;
        --divider-color: #e2e8f0;
        --background: #f5f7fa;
        --card-background: #ffffff;
        --error-color: #e53e3e;
        --success-color: #40964e;
      }

      body {
        font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: var(--text-primary);
        margin: 0;
        padding: 0;
        background-color: var(--background);
      }

      .email-container {
        max-width: 640px;
        margin: 30px auto;
        padding: 0;
        background-color: var(--card-background);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }

      .email-header {
        background-color: var(--primary-color);
        padding: 25px 30px;
        text-align: center;
        color: white;
      }

      .logo {
        max-height: 60px;
        margin-bottom: 15px;
      }

      .email-title {
        font-size: 24px;
        font-weight: 600;
        margin: 0;
        color: white;
      }

      .email-subtitle {
        font-size: 16px;
        opacity: 0.9;
        margin-top: 8px;
        font-weight: 400;
      }

      .email-content {
        padding: 30px;
      }

      .intro-text {
        margin-bottom: 25px;
        font-size: 16px;
        color: var(--text-secondary);
        line-height: 1.7;
      }

      .action-section {
        margin: 30px 0;
        text-align: center;
      }

      .action-button {
        display: inline-block;
        padding: 14px 28px;
        background-color: var(--success-color);
        color: white;
        text-decoration: none;
        font-weight: 600;
        border-radius: 30px;
        font-size: 16px;
        transition: background-color 0.3s;
      }

      .action-button:hover {
        background-color: #3a6842;
      }

      .code-section {
        margin: 30px 0;
        text-align: center;
      }

      .code-alternative {
        font-size: 14px;
        color: var(--text-secondary);
        margin-top: 15px;
      }

      .manual-code {
        background: #edf2f7;
        padding: 15px;
        border-radius: 6px;
        font-family: 'Courier New', monospace;
        font-size: 18px;
        letter-spacing: 2px;
        text-align: center;
        word-break: break-all;
        color: var(--text-primary);
        border: 1px dashed var(--divider-color);
        margin-top: 15px;
      }

      .warning-message {
        margin: 35px 0 20px 0;
        padding: 18px;
        background-color: #fff5f5;
        border-left: 4px solid var(--error-color);
        border-radius: 0 4px 4px 0;
      }

      .warning-title {
        font-weight: 600;
        color: var(--error-color);
        margin-bottom: 8px;
        display: flex;
        align-items: center;
      }

      .warning-title svg {
        margin-right: 8px;
      }

      .warning-text {
        color: var(--text-secondary);
        font-size: 14px;
        line-height: 1.5;
      }

      .email-footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid var(--divider-color);
        text-align: center;
        color: var(--text-secondary);
        font-size: 13px;
      }

      .bold-text {
        font-weight: 600;
        color: var(--text-primary);
      }

      .expiration-notice {
        color: var(--text-secondary);
        font-size: 14px;
        text-align: center;
        margin-top: 20px;
        font-style: italic;
      }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <img src="../assets/images/logo-Sfondo.png" alt="Logo Sistema de Archivos del Bicentenario" class="logo">
            <h1 class="email-title">Recuperación de contraseña</h1>
            <div class="email-subtitle">Sistema de Archivos de Testimonios del Bicentenario</div>
        </div>
        
        <div class="email-content">
            <p class="intro-text">
                Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el 
                <span class="bold-text">Sistema de Archivos de Testimonios del Bicentenario</span>. 
                Para completar el proceso, por favor haz clic en el botón a continuación.
            </p>
            
            <div class="action-section">
                <a href="${resetLink}" class="action-button">Restablecer mi contraseña</a>
                <p class="expiration-notice">Este enlace expirará en 1 hora</p>
            </div>
            
            <div class="code-section">
                <p class="code-alternative">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                <div class="manual-code">${resetLink}</div>
            </div>
            
            <div class="warning-message">
                <div class="warning-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    Importante: Seguridad de tu cuenta
                </div>
                <p class="warning-text">
                    Si no solicitaste este cambio, por favor ignora este mensaje
                </p>
            </div>
            
            <div class="email-footer">
                <p>Sistema de Archivos de Testimonios del Bicentenario &copy; 2025</p>
                <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
            </div>
        </div>
    </div>
</body>
</html>
  `;

  return sendEmail(to, "Recuperación de Contraseña", html);
};

export const send2FASetupEmail = async (
  to: string,
  secret: string,
  qrCodeUrl: string
) => {
  const html = `
  <!DOCTYPE html>
  <html lang="es">
  <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Configuración de Seguridad - Sistema de Archivos del Bicentenario</title>
      <style>
        :root {
          --primary-color: #2e7d32;
          --primary-light: #81c784;
          --primary-dark: #1b5e20;
          --accent-color: #69f0ae;
          --text-primary: #212121;
          --text-secondary: #757575;
          --divider-color: #bdbdbd;
          --background: #f5f7fa;
          --card-background: #ffffff;
          --error-color: #c62828;
          --warning-color: #f9a825;
        }

        body {
          font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: var(--text-primary);
          margin: 0;
          padding: 0;
          background-color: var(--background);
        }

        .email-container {
          max-width: 640px;
          margin: 30px auto;
          padding: 0;
          background-color: var(--card-background);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .email-header {
          background-color: var(--primary-color);
          padding: 25px 30px;
          text-align: center;
          color: white;
        }

        .logo {
          max-height: 60px;
          margin-bottom: 15px;
        }

        .email-title {
          font-size: 24px;
          font-weight: 600;
          margin: 0;
          color: #ffffff;
        }

        .email-subtitle {
          font-size: 16px;
          opacity: 0.9;
          margin-top: 8px;
          font-weight: 400;
        }

        .email-content {
          padding: 30px;
        }

        .intro-text {
          margin-bottom: 25px;
          font-size: 16px;
          color: var(--text-secondary);
        }

        .section-title {
          color: var(--text-primary);
          font-size: 18px;
          font-weight: 600;
          margin: 25px 0 15px 0;
          border-bottom: 2px solid var(--divider-color);
          padding-bottom: 8px;
        }

        .instructions-section {
          margin: 20px 0;
        }

        .instructions-list {
          padding-left: 20px;
        }

        .instructions-list li {
          margin-bottom: 12px;
          padding-left: 8px;
        }

        .qr-section {
          margin: 30px 0;
          padding: 25px;
          background: #f8fafc;
          border-radius: 8px;
          text-align: center;
          border: 1px solid var(--divider-color);
        }

        .qr-title {
          font-weight: 600;
          margin-bottom: 15px;
          color: var(--text-primary);
          font-size: 17px;
        }

        .qr-image {
          display: block;
          width: 200px;
          height: 200px;
          margin: 20px auto;
          border: 1px solid var(--divider-color);
          padding: 15px;
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .qr-note {
          color: var(--text-secondary);
          font-size: 13px;
          text-align: center;
          margin-top: 15px;
          font-style: italic;
        }

        .secret-section {
          margin: 30px 0;
        }

        .secret-title {
          font-weight: 600;
          margin-bottom: 12px;
          color: var(--text-primary);
        }

        .secret-code {
          background: #edf2f7;
          padding: 15px;
          border-radius: 6px;
          font-family: 'Courier New', monospace;
          font-size: 18px;
          letter-spacing: 2px;
          text-align: center;
          word-break: break-all;
          color: var(--text-primary);
          border: 1px dashed var(--divider-color);
        }

        .warning-message {
          margin: 35px 0 20px 0;
          padding: 18px;
          background-color: #fff5f5;
          border-left: 4px solid var(--error-color);
          border-radius: 0 4px 4px 0;
        }

        .warning-title {
          font-weight: 600;
          color: var(--error-color);
          margin-bottom: 8px;
          display: flex;
          align-items: center;
        }

        .warning-title svg {
          margin-right: 8px;
        }

        .warning-text {
          color: var(--text-secondary);
          font-size: 14px;
          line-height: 1.5;
        }

        .apps-recommendation {
          margin: 25px 0;
          padding: 15px;
          background: #f0fff4;
          border-radius: 6px;
          border-left: 4px solid var(--primary-light);
        }

        .apps-title {
          font-weight: 600;
          color: var(--primary-dark);
          margin-bottom: 10px;
        }

        .apps-list {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-top: 15px;
        }

        .app-item {
          flex: 1;
          min-width: 120px;
          text-align: center;
        }

        .app-name {
          font-size: 14px;
          margin-top: 8px;
          color: var(--text-secondary);
        }

        .email-footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid var(--divider-color);
          text-align: center;
          color: var(--text-secondary);
          font-size: 13px;
        }

        .bold-text {
          font-weight: 600;
          color: var(--text-primary);
        }

        .highlight {
          background-color: #ebf8ff;
          padding: 2px 4px;
          border-radius: 3px;
          color: #3182ce;
        }
      </style>
  </head>
  <body>
      <div class="email-container">
          <div class="email-header">
              <img src="../assets/images/logo-Sfondo.png" alt="Logo Sistema de Archivos del Bicentenario" class="logo">
              <h1 class="email-title">Protege tu cuenta</h1>
              <div class="email-subtitle">Configuración de Autenticación en Dos Pasos (2FA)</div>
          </div>
          
          <div class="email-content">
              <p class="intro-text">
                  Hemos activado la autenticación en dos pasos para tu cuenta en el <span class="bold-text">Sistema de Archivos de Testimonios del Bicentenario</span>. 
                  Este sistema añade una capa adicional de seguridad para proteger tu información.
              </p>
              
              <h2 class="section-title">Configuración requerida</h2>
              
              <div class="instructions-section">
                  <p class="bold-text">Por favor sigue estos pasos para completar la configuración:</p>
                  <ol class="instructions-list">
                      <li>
                          <span class="bold-text">Descarga una aplicación de autenticación</span> como Google Authenticator, Authy o Microsoft Authenticator en tu dispositivo móvil
                      </li>
                      <li>Abre la aplicación y selecciona la opción para <span class="highlight">agregar una nueva cuenta</span></li>
                      <li>
                          Escanea el código QR que aparece a continuación o ingresa manualmente el código secreto proporcionado
                      </li>
                      <li>
                          Una vez configurado, la aplicación generará códigos de 6 dígitos que deberás ingresar al iniciar sesión
                      </li>
                  </ol>
              </div>
              
              <div class="qr-section">
                  <p class="qr-title">Escanea este código QR con tu aplicación:</p>
                  <img src="${qrCodeUrl}" alt="Código QR para configuración 2FA" class="qr-image">
                  <p class="qr-note">
                      Si no puedes ver la imagen del código QR, asegúrate de permitir la visualización de imágenes en tu cliente de correo
                  </p>
              </div>
              
              <div class="secret-section">
                  <p class="secret-title">
                      Si no puedes escanear el código QR, ingresa este código manualmente:
                  </p>
                  <div class="secret-code">${secret}</div>
              </div>
              
              <div class="warning-message">
                  <div class="warning-title">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      ¡IMPORTANTE!
                  </div>
                  <p class="warning-text">
                      Guarda este código en un lugar seguro. Será necesario para recuperar el acceso a tu cuenta si pierdes o cambias de dispositivo. 
                      Recomendamos guardarlo en un gestor de contraseñas o escribirlo en un lugar seguro.
                  </p>
              </div>
              
              <div class="email-footer">
                  <p>Sistema de Archivos de Testimonios del Bicentenario &copy; 2025</p>
                  <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
              </div>
          </div>
      </div>
  </body>
  </html>
  `;
  return sendEmail(to, "Configuración de Autenticación de Dos Factores", html);
};
export const send2FACodeEmail = async (email: string, code: string) => {
  const html = `
  <!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Código de Verificación - Sistema de Archivos del Bicentenario</title>
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <style>
      :root {
        --primary-color: #2e7d32;
        --primary-light: #81c784;
        --primary-dark: #1b5e20;
        --accent-color: #69f0ae;
        --text-primary: #212121;
        --text-secondary: #757575;
        --divider-color: #bdbdbd;
        --background: #f5f5f5;
        --card-background: #ffffff;
        --error-color: #c62828;
        --warning-color: #f9a825;
      }

      body {
        font-family: "Roboto", "Segoe UI", Arial, sans-serif;
        line-height: 1.6;
        color: var(--text-primary);
        margin: 0;
        padding: 0;
        background-color: var(--background);
      }

      .email-container {
        max-width: 600px;
        margin: 30px auto;
        padding: 0;
        background-color: var(--card-background);
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }

      .email-header {
        background-color: var(--primary-color);
        padding: 24px 30px;
        text-align: center;
        color: white;
      }

      .logo {
        max-height: 64px;
        margin-bottom: 16px;
      }

      .email-title {
        font-size: 24px;
        font-weight: 500;
        margin: 0;
        color: white;
        letter-spacing: 0.5px;
      }

      .email-subtitle {
        font-size: 16px;
        opacity: 0.9;
        margin-top: 8px;
        font-weight: 400;
      }

      .email-content {
        padding: 32px;
      }

      .code-section {
        margin: 32px 0;
        text-align: center;
      }

      .code-title {
        font-size: 18px;
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: 24px;
      }

      .code-container {
        display: inline-block;
        padding: 24px;
        background-color: #e8f5e9;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
      }

      .code-value {
        font-family: "Roboto Mono", monospace;
        font-size: 32px;
        font-weight: 600;
        letter-spacing: 4px;
        color: var(--primary-dark);
        padding: 12px 24px;
        background-color: white;
        border-radius: 4px;
        border: 1px solid var(--primary-light);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }

      .code-instructions {
        margin-top: 24px;
        font-size: 14px;
        color: var(--text-secondary);
        line-height: 1.7;
      }

      .security-section {
        margin: 40px 0 24px 0;
        padding: 20px;
        background-color: #fff8e1;
        border-radius: 8px;
        border-left: 4px solid var(--warning-color);
      }

      .security-title {
        display: flex;
        align-items: center;
        font-weight: 500;
        color: var(--warning-color);
        margin-bottom: 12px;
      }

      .security-title .material-icons {
        margin-right: 8px;
        font-size: 20px;
      }

      .security-text {
        font-size: 14px;
        color: var(--text-secondary);
        line-height: 1.7;
      }

      .email-footer {
        margin-top: 40px;
        padding-top: 24px;
        border-top: 1px solid var(--divider-color);
        text-align: center;
        color: var(--text-secondary);
        font-size: 13px;
      }

      .action-button {
        display: inline-block;
        margin-top: 24px;
        padding: 12px 24px;
        background-color: var(--primary-color);
        color: white;
        text-decoration: none;
        font-weight: 500;
        border-radius: 25px;
        font-size: 15px;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .action-button:hover {
        background-color: var(--primary-dark);
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
      }

      .bold-text {
        font-weight: 500;
        color: var(--text-primary);
      }

      .primary-text {
        color: var(--primary-color);
      }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <img src="../assets/images/logo-Sfondo.png" alt="Logo Sistema de Archivos del Bicentenario" class="logo">
            <h1 class="email-title">Código de Verificación</h1>
            <div class="email-subtitle">Sistema de Archivos de Testimonios del Bicentenario</div>
        </div>
        
        <div class="email-content">
            <p style="text-align: center; font-size: 16px; color: var(--text-secondary);">
                Hemos generado un código temporal para acceder a tu cuenta. Utilízalo para completar tu autenticación.
            </p>
            
            <div class="code-section">
                <div class="code-title">Tu código de verificación es:</div>
                <div class="code-container">
                    <div class="code-value">${code}</div>
                </div>
                <div class="code-instructions">
                    Este código es válido por <span class="bold-text">15 minutos</span>.<br>
                    No lo compartas con nadie. El equipo del Bicentenario nunca te pedirá esta información.
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="#" class="action-button">
                    <i class="material-icons" style="vertical-align: middle; font-size: 18px;">lock_open</i>
                    Acceder a mi cuenta
                </a>
            </div>
            
            <div class="security-section">
                <div class="security-title">
                    <i class="material-icons">security</i>
                    Importante: Seguridad de tu cuenta
                </div>
                <p class="security-text">
                    Si no solicitaste este código, por favor cambia tu contraseña inmediatamente. Proteger tu información es nuestra prioridad.
                </p>
            </div>
            
            <div class="email-footer">
                <p>Sistema de Archivos de Testimonios del Bicentenario &copy; 2025</p>
                <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
  return sendEmail(email, "Código de verificación 2FA", html);
};

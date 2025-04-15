import { Router } from "express";
import type { Request, Response } from "express";
import {
  authSchema,
  createUser,
  findUserByEmail,
  updateRefreshToken,
  validatePassword,
  userSchema,
  updateLastLogin,
  findUserByRefreshToken,
  Rol,
  generatePasswordResetToken,
  generate2FASecret,
  resetPassword,
  verify2FAToken, // Añadir esto si es necesario
} from "../models";
import { safeParse } from "valibot";
import { sign, verify } from "jsonwebtoken";
import type { AuthenticatedRequest } from "../middleware/authentication";
import config from "../../config";
import { authorizeRoles } from "@app/middleware/authorization";
import { send2FASetupEmail, sendPasswordResetEmail } from "@app/lib/email";
import prisma from "@app/lib/prisma";

export const authRouter = Router();

// routes/auth.ts
authRouter.post(
  "/register",
  async (req: Request, res: Response): Promise<void> => {
    const isAuthorized = await authorizeRoles(Rol.ADMIN);
    if (isAuthorized) {
      const result = safeParse(userSchema, req.body); // Cambiar a userSchema
      if (!result.success) {
        res.status(400).json({
          message: "Bad Request",
          errors: result.issues,
        });
        return;
      }

      try {
        const user = await createUser(result.output); // Pasar el objeto completo
        res.status(201).json(user);
      } catch (error) {
        res.status(500).json({
          message: "Error creating user",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  },
);

// routes/auth.ts
authRouter.post(
  "/login",
  async (req: Request, res: Response): Promise<void> => {
    const result = safeParse(authSchema, req.body);
    if (!result.success) {
      res.status(400).json({ message: "Bad Request", errors: result.issues });
      return;
    }

    const { email, password } = result.output;

    try {
      const user = await findUserByEmail(email);

      if (!user || !(await validatePassword(user, password))) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      // Actualizar último login
      await updateLastLogin(user.id_usuario);

      // Generar tokens
      const accessToken = sign(
        {
          id_usuario: user.id_usuario,
          id_rol: user.id_rol,
        },
        config.jwtSecret,
        { expiresIn: "15m" },
      );

      const refreshToken = sign(
        { id_usuario: user.id_usuario },
        config.jwtSecret,
        { expiresIn: "7d" },
      );

      // Actualizar refresh token en base de datos
      await updateRefreshToken(user.id_usuario, refreshToken);

      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user.id_usuario,
          email: user.email,
          role: user.id_rol,
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Login failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// Ruta para solicitar recuperación de contraseña
authRouter.post(
  "/forgot-password",
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    try {
      const user = await findUserByEmail(email);
      if (!user) {
        res.status(404).json({ message: "Usuario no encontrado" });
        return;
      }

      const token = await generatePasswordResetToken(user.id_usuario);
      await sendPasswordResetEmail(email, token);

      res.json({ message: "Se ha enviado un email con las instrucciones" });
    } catch (error) {
      res.status(500).json({
        message: "Error al procesar la solicitud",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// Ruta para restablecer contraseña
authRouter.post(
  "/reset-password",
  async (req: Request, res: Response): Promise<void> => {
    const { token, newPassword } = req.body;

    try {
      const success = await resetPassword(token, newPassword);
      if (!success) {
        res.status(400).json({ message: "Token inválido o expirado" });
        return;
      }

      res.json({ message: "Contraseña actualizada correctamente" });
    } catch (error) {
      res.status(500).json({
        message: "Error al restablecer la contraseña",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// Ruta para configurar 2FA
authRouter.post(
  "/setup-2fa",
  authorizeRoles(Rol.ADMIN, Rol.CURATOR),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id_usuario;
      if (!userId) {
        res.status(401).json({ message: "No autorizado" });
        return;
      }

      const { secret, qrCode } = await generate2FASecret(userId);
      const user = await findUserByEmail(req.user?.email || "");

      if (user) {
        await send2FASetupEmail(user.email, secret, qrCode);
      }

      res.json({
        message: "2FA configurado correctamente",
        secret,
        qrCode,
      });
    } catch (error) {
      res.status(500).json({
        message: "Error al configurar 2FA",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// Ruta para verificar código 2FA
authRouter.post(
  "/verify-2fa",
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { token } = req.body;
    const userId = req.user?.id_usuario;

    if (!userId) {
      res.status(401).json({ message: "No autorizado" });
      return;
    }

    try {
      const isValid = await verify2FAToken(userId, token);
      if (!isValid) {
        res.status(400).json({ message: "Código inválido" });
        return;
      }

      await prisma.usuarios.update({
        where: { id_usuario: userId },
        data: { two_factor_enabled: true },
      });

      res.json({ message: "2FA verificado correctamente" });
    } catch (error) {
      res.status(500).json({
        message: "Error al verificar 2FA",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);
authRouter.post(
  "/logout",
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id_usuario;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      await updateRefreshToken(userId, null);
      res.json({ message: "Successfully logged out" });
    } catch (error) {
      res.status(500).json({
        message: "Logout failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// Nueva ruta para refrescar token
authRouter.post(
  "/refresh",
  async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(401).json({ message: "Token requerido" });
      return;
    }

    try {
      // Verificar token
      const decoded = verify(refreshToken, config.jwtSecret) as { id: number };
      const user = await findUserByRefreshToken(refreshToken);

      if (!user || user.id_usuario !== decoded.id) {
        res.status(403).json({ message: "Token inválido" });
        return;
      }

      // Generar nuevo access token
      const newAccessToken = sign(
        {
          id: user.id_usuario,
          email: user.email,
          role: user.id_rol,
        },
        config.jwtSecret,
        { expiresIn: "15m" },
      );

      res.json({ accessToken: newAccessToken });
    } catch (error) {
      res.status(403).json({
        message: "Token inválido o expirado",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  },
);

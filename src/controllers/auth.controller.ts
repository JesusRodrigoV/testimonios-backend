import type { Request, Response } from "express";
import {
  authSchema,
  createUser,
  findUserByEmail,
  validatePassword,
  userSchema,
  updateLastLogin,
  findUserByRefreshToken,
  Rol,
  generatePasswordResetToken,
  generate2FASecret,
  resetPassword,
  verify2FAToken,
  regenerateQRCode,
  passwordSchema,
  createRefreshToken,
  revokeRefreshToken,
} from "../models";
import { safeParse } from "valibot";
import { sign, verify } from "jsonwebtoken";
import config from "config";
import { send2FASetupEmail, sendPasswordResetEmail } from "@app/lib/email";
import prisma from "@app/lib/prisma";

export const authProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id_usuario;

    if (!userId) {
      res.status(401).json({ message: "No autorizado" });
      return;
    }

    const user = await prisma.usuarios.findUnique({
      where: { id_usuario: userId },
      select: {
        id_usuario: true,
        email: true,
        nombre: true,
        biografia: true,
        id_rol: true,
        two_factor_enabled: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }

    res.json({
      id_usuario: user.id_usuario,
      email: user.email,
      nombre: user.nombre,
      biografia: user.biografia,
      role: user.id_rol,
      two_factor_enabled: user.two_factor_enabled,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener perfil",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const authRegister = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = safeParse(userSchema, req.body);
  if (!result.success) {
    res.status(400).json({
      message: "Bad Request",
      errors: result.issues,
    });
    return;
  }

  try {
    const user = await createUser({
      ...result.output,
      id_rol: Rol.VISITOR,
    });

    const { password, ...userResponse } = user;
    res.status(201).json(userResponse);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      res.status(400).json({
        message: "El email ya está registrado",
      });
      return;
    }
    res.status(500).json({
      message: "Error al crear el usuario",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

export const adminPostUsers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = safeParse(userSchema, req.body);
  if (!result.success) {
    res.status(400).json({
      message: "Bad Request",
      errors: result.issues,
    });
    return;
  }

  try {
    const user = await createUser(result.output);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      res.status(400).json({
        message: "El email ya está registrado",
      });
      return;
    }
    res.status(500).json({
      message: "Error creating user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const adminGetUsers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const users = await prisma.usuarios.findMany({
      select: {
        id_usuario: true,
        email: true,
        nombre: true,
        biografia: true,
        id_rol: true,
        last_login: true,
        two_factor_enabled: true,
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching users",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const adminPutUsers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userIdParam = req.params.id;
  if (!userIdParam) {
    res.status(400).json({ message: "ID de usuario requerido" });
    return;
  }
  const userId = parseInt(userIdParam);
  if (isNaN(userId)) {
    res.status(400).json({ message: "ID de usuario inválido" });
    return;
  }
  const { email, nombre, biografia, id_rol, profile_image } = req.body;

  try {
    const updatedUser = await prisma.usuarios.update({
      where: { id_usuario: userId },
      data: {
        email,
        nombre,
        biografia,
        id_rol,
        profile_image,
      },
      select: {
        id_usuario: true,
        email: true,
        nombre: true,
        biografia: true,
        id_rol: true,
        last_login: true,
        two_factor_enabled: true,
      },
    });
    res.json(updatedUser);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Record to update not found")
    ) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }
    res.status(500).json({
      message: "Error updating user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const adminDeleteUsers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userIdParam = req.params.id;
  if (!userIdParam) {
    res.status(400).json({ message: "ID de usuario requerido" });
    return;
  }
  const userId = parseInt(userIdParam);
  if (isNaN(userId)) {
    res.status(400).json({ message: "ID de usuario inválido" });
    return;
  }

  try {
    if (req.user?.id_usuario === userId) {
      res.status(400).json({ message: "No puedes eliminar tu propia cuenta" });
      return;
    }

    await prisma.logs.deleteMany({
      where: { id_usuario: userId }
    });

    await prisma.colecciones.deleteMany({
      where: { id_usuario: userId }
    });

    await prisma.usuarios.delete({
      where: { id_usuario: userId },
    });
    res.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Record to delete not found")
    ) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }
    res.status(500).json({
      message: "Error deleting user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getUserInfo = async (req: Request, res: Response): Promise<void> => {
  const userIdParam = req.params.id;
  if (!userIdParam) {
    throw new Error("ID de usuario requerido");
  }

  const userId = parseInt(userIdParam);

  if (isNaN(userId)) {
    throw new Error("ID de usuario inválido");
  }

  try {
    const user = await prisma.usuarios.findUnique({
      where: { id_usuario: userId },
      select: {
        id_usuario: true,
        email: true,
        nombre: true,
        biografia: true,
        profile_image: true,
        rol: {
          select: {
            nombre: true
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Error buscando información del usuario",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }

}

export const login = async (req: Request, res: Response): Promise<void> => {
  const result = safeParse(authSchema, req.body);

  if (!result.success) {
    res.status(400).json({ message: "Bad Request", errors: result.issues });
    return;
  }

  const { email, password } = result.output;

  try {
    const user = await findUserByEmail(email);

    if (!user || !(await validatePassword(user, password))) {
      res.status(401).json({ message: "Credenciales inválidas" });
      return;
    }

    if (
      [Rol.ADMIN, Rol.CURATOR].includes(user.id_rol) &&
      !user.two_factor_enabled
    ) {
      if (!user.two_factor_secret) {
        const { secret, qrCode } = await generate2FASecret(user.id_usuario);
        await send2FASetupEmail(user.email, secret, qrCode);

        res.status(202).json({
          message: "Requiere configuración 2FA",
          requiresSetup: true,
          setupData: { secret, qrCode },
          tempToken: sign(
            { id_usuario: user.id_usuario, setupMode: true },
            config.jwtSecret,
            { expiresIn: "15m" },
          ),
        });
      } else {
        const qrCode = await regenerateQRCode(
          user.two_factor_secret,
          user.email,
        );
        res.status(202).json({
          message: "Requiere configuración 2FA",
          requiresSetup: true,
          setupData: { secret: user.two_factor_secret, qrCode },
          tempToken: sign(
            { id_usuario: user.id_usuario, setupMode: true },
            config.jwtSecret,
            { expiresIn: "15m" },
          ),
        });
      }
      return;
    }

    if (
      [Rol.ADMIN, Rol.CURATOR].includes(user.id_rol) &&
      user.two_factor_enabled
    ) {
      res.status(202).json({
        message: "Requiere verificación 2FA",
        requires2FA: true,
        tempToken: sign(
          { id_usuario: user.id_usuario, pending2FA: true },
          config.jwtSecret,
          { expiresIn: "5m" },
        ),
      });
      return;
    }

    await updateLastLogin(user.id_usuario);

    const accessToken = sign(
      {
        id_usuario: user.id_usuario,
        id_rol: user.id_rol,
      },
      config.jwtSecret,
      { expiresIn: "1h" },
    );

    const { token: refresh_tokens } = await createRefreshToken(
      user.id_usuario,
    );

    res.cookie("refreshToken", refresh_tokens, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      user: {
        id_usuario: user.id_usuario,
        email: user.email,
        role: user.id_rol,
        nombre: user.nombre,
        biografia: user.biografia,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error en el inicio de sesión",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

export const forgot_password = async (
  req: Request,
  res: Response,
): Promise<void> => {
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
};

export const reset_password = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    res
      .status(400)
      .json({ message: "Token y nueva contraseña son requeridos" });
    return;
  }

  const passwordValidation = safeParse(passwordSchema, newPassword);
  if (!passwordValidation.success) {
    res.status(400).json({
      message: "La contraseña no cumple con los requisitos",
      errors: passwordValidation.issues,
    });
    return;
  }

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
};

export const setup2FA = async (req: Request, res: Response): Promise<void> => {
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
};

export const verify2FA = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body;
  const userId = req.user?.id_usuario;

  if (!userId) {
    res.status(401).json({ message: "No autorizado" });
    return;
  }

  try {
    const { isValid, user } = await verify2FAToken(userId, token);

    if (!isValid || !user) {
      res.status(400).json({ message: "Código 2FA inválido" });
      return;
    }

    const accessToken = sign(
      {
        id_usuario: user.id_usuario,
        id_rol: user.id_rol,
      },
      config.jwtSecret,
      { expiresIn: "1h" },
    );

    const { token: refreshToken } = await createRefreshToken(
      user.id_usuario,
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "2FA verificado correctamente",
      accessToken,
      user: {
        id_usuario: user.id_usuario,
        email: user.email,
        role: user.id_rol,
        nombre: user.nombre,
        biografia: user.biografia,
        two_factor_enabled: true,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al verificar 2FA",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id_usuario;
    const refreshToken = req.cookies?.refreshToken;

    if (!userId) {
      res.status(401).json({ message: "No autorizado" });
      return;
    }

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.json({ message: "Successfully logged out" });
  } catch (error) {
    res.status(500).json({
      message: "Logout failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ message: "Refresh token requerido" });
    return;
  }

  try {
    const decoded = verify(refreshToken, config.jwtSecret) as {
      id_usuario: number;
    };
    const user = await findUserByRefreshToken(refreshToken);

    if (!user || user.id_usuario !== decoded.id_usuario) {
      await revokeRefreshToken(refreshToken);
      res.status(403).json({ message: "Refresh token inválido" });
      return;
    }

    if (
      [Rol.ADMIN, Rol.CURATOR].includes(user.id_rol) &&
      !user.two_factor_enabled
    ) {
      res.status(403).json({
        message: "2FA requerido pero no configurado",
        requires2FA: true,
      });
      return;
    }

    const newAccessToken = sign(
      {
        id_usuario: user.id_usuario,
        id_rol: user.id_rol,
      },
      config.jwtSecret,
      { expiresIn: "1h" },
    );

    await revokeRefreshToken(refreshToken);
    const deviceInfo = req.headers["user-agent"] || "unknown";
    const { token: newRefreshToken } = await createRefreshToken(
      user.id_usuario,
    );

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    if (errorMessage.includes("jwt expired")) {
      await revokeRefreshToken(refreshToken);
      res.status(403).json({ message: "Refresh token expirado" });
    } else {
      res.status(403).json({
        message: "Error al refrescar token",
        error: errorMessage,
      });
    }
  }
};

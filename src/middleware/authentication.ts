import { verify } from "jsonwebtoken";
import prisma from "../lib/prisma";
import config from "config";
import type { NextFunction, Request, Response } from "express";
import type { JwtPayload as JWT } from "jsonwebtoken";

export interface CustomJwtPayload extends JWT {
  id_usuario: number;
  id_rol: number;
  pending2FA?: boolean;
  setupMode?: boolean;
}

export const allow2FAVerification = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    console.log("allow2FAVerification: No token provided");
    res.status(401).json({ message: "Token de autenticación requerido" });
    return;
  }

  try {
    const decoded = verify(token, config.jwtSecret) as CustomJwtPayload;

    if (!decoded.pending2FA && !decoded.setupMode) {
      console.log("allow2FAVerification: Invalid token for 2FA verification", decoded);
      res.status(403).json({ message: "Token inválido para verificación 2FA" });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("allow2FAVerification: Token verification failed", error);
    res.status(403).json({ message: "Token inválido o expirado" });
  }
};

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    console.log("authenticateToken: No token provided for", req.path);
    res.status(401).json({ message: "Token de autenticación requerido" });
    return;
  }

  try {
    const decoded = verify(token, config.jwtSecret) as CustomJwtPayload;
    console.log("authenticateToken: Token decoded", { id_usuario: decoded.id_usuario, id_rol: decoded.id_rol, path: req.path });

    if (decoded.setupMode) {
      if (!req.path.includes("/verify-2fa")) {
        console.log("authenticateToken: User in setupMode, redirect to verify-2fa");
        res.status(403).json({ message: "Debe completar la configuración 2FA" });
        return;
      }
      req.user = decoded;
      next();
      return;
    }

    if (decoded.pending2FA) {
      if (!req.path.includes("/verify-2fa")) {
        console.log("authenticateToken: User pending 2FA, redirect to verify-2fa");
        res.status(403).json({ message: "Debe completar la verificación 2FA" });
        return;
      }
      req.user = decoded;
      next();
      return;
    }

    // Verificar que el usuario existe
    const user = await prisma.usuarios.findUnique({
      where: { id_usuario: decoded.id_usuario },
      select: { id_usuario: true, id_rol: true },
    });

    if (!user) {
      console.log("authenticateToken: User not found", { id_usuario: decoded.id_usuario });
      res.status(403).json({ message: "Usuario no encontrado" });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("authenticateToken: Token verification failed for", req.path, error);
    res.status(403).json({ message: "Token inválido o expirado" });
  }
};

export const authenticateRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    console.log("authenticateRefreshToken: No refresh token provided");
    res.status(401).json({ message: "Refresh token requerido" });
    return;
  }

  try {
    const decoded = verify(refreshToken, config.jwtSecret) as CustomJwtPayload;
    const refreshTokenRecord = await prisma.refresh_tokens.findFirst({
      where: {
        token: refreshToken,
        id_usuario: decoded.id_usuario,
        expiresAt: { gt: new Date() },
      },
    });

    if (!refreshTokenRecord) {
      console.log("authenticateRefreshToken: Invalid or expired refresh token", { id_usuario: decoded.id_usuario });
      res.status(403).json({ message: "Token inválido o expirado" });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("authenticateRefreshToken: Token verification failed", error);
    res.status(403).json({ message: "Token inválido o expirado" });
  }
};
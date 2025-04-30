import { verify } from "jsonwebtoken";
import prisma from "../lib/prisma";
import config from "config";
import type { NextFunction, Request, Response } from "express";

import type { JwtPayload as JWT } from "jsonwebtoken";

export interface CustomJwtPayload extends JWT {
  id_usuario: number;
  id_rol: number;
}

export const allow2FAVerification = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Token de autenticación requerido" });
    return;
  }

  try {
    const decoded = verify(token, config.jwtSecret) as CustomJwtPayload;

    if (!decoded.pending2FA && !decoded.setupMode) {
      res.status(403).json({ message: "Token inválido para verificación 2FA" });
      return;
    }

    req.user = decoded;
    next();
  } catch (_error) {
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
    res.status(401).json({ message: "Token de autenticación requerido" });
    return;
  }

  try {
    const decoded = verify(token, config.jwtSecret) as CustomJwtPayload;

    // Si es un token temporal de configuración, permitir solo endpoints específicos
    if (decoded.setupMode) {
      if (!req.path.includes("/verify-2fa")) {
        res
          .status(403)
          .json({ message: "Debe completar la configuración 2FA" });
        return;
      }
      req.user = decoded;
      next();
      return;
    }

    // Si es un token temporal pendiente de 2FA
    if (decoded.pending2FA) {
      if (!req.path.includes("/login")) {
        res.status(403).json({ message: "Debe completar la verificación 2FA" });
        return;
      }
      req.user = decoded;
      next();
      return;
    }

    // Para tokens normales, verificar revocación
    const user = await prisma.usuarios.findUnique({
      where: { id_usuario: decoded.id_usuario },
      select: { refresh_token: true, two_factor_enabled: true },
    });

    if (!user) {
      res.status(403).json({ message: "Usuario no encontrado" });
      return;
    }

    req.user = decoded;
    next();
  } catch (_error) {
    res.status(403).json({ message: "Token inválido o expirado" });
  }
};

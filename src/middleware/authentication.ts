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
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    console.error("No token provided in allow2FAVerification");
    res.status(401).json({ message: "Token de autenticación requerido" });
    return;
  }

  try {
    const decoded = verify(token, config.jwtSecret) as CustomJwtPayload;
    console.log("Decoded token in allow2FAVerification:", decoded);
    console.log("Token received:", token);
    if (!decoded.pending2FA && !decoded.setupMode) {
      console.error(
        "Token rejected: Missing pending2FA or setupMode",
        decoded
      );
      res.status(403).json({ message: "Token inválido para verificación 2FA" });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("Error verifying token in allow2FAVerification:", error);
    res.status(403).json({ message: "Token inválido o expirado" });
    return;
  }
};

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Token de autenticación requerido" });
    return;
  }

  try {
    const decoded = verify(token, config.jwtSecret) as CustomJwtPayload;

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

    if (decoded.pending2FA) {
      if (!req.path.includes("/verify-2fa")) {
        res.status(403).json({ message: "Debe completar la verificación 2FA" });
        return;
      }
      req.user = decoded;
      next();
      return;
    }

    const user = await prisma.usuarios.findUnique({
      where: { id_usuario: decoded.id_usuario },
      select: { id_usuario: true, id_rol: true },
    });

    if (!user) {
      res.status(403).json({ message: "Usuario no encontrado" });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: "Token inválido o expirado" });
  }
};

export const authenticateRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
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
      res.status(403).json({ message: "Token inválido o expirado" });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: "Token inválido o expirado" });
  }
};

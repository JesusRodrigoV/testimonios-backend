import { IncomingMessage, ServerResponse } from "http";
import { verify } from "jsonwebtoken";
import { isTokenRevoked } from "../models";
import config from "../../config";
import prisma from "src/lib/prisma";

export interface JwtPayload {
  id_usuario: number;
  id_rol: number;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends IncomingMessage {
  user?: JwtPayload;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: ServerResponse,
): Promise<boolean> => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    sendError(res, 401, "Authentication token required");
    return false;
  }

  try {
    const decoded = verify(token, config.jwtSecret) as JwtPayload;

    // Verificar si el token de refresco está vigente en la base de datos
    const user = await prisma.usuarios.findUnique({
      where: { id_usuario: decoded.id_usuario },
      select: { refresh_token: true },
    });

    if (!user) {
      sendError(res, 403, "User not found");
      return false;
    }

    req.user = decoded;
    return true;
  } catch (error) {
    sendError(res, 403, "Invalid or expired token", error);
    return false;
  }
};

function sendError(
  res: ServerResponse,
  code: number,
  message: string,
  error?: unknown,
) {
  res.statusCode = code;
  res.end(
    JSON.stringify({
      message,
      error: error instanceof Error ? error.message : undefined,
    }),
  );
}

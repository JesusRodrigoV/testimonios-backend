import type { ServerResponse } from "http";
import type { AuthenticatedRequest } from "./authentication";
import type { User } from "../models/user";
import { Rol } from "../models/user";
import prisma from "../lib/prisma";

export const authorizeRoles = (...allowedRoles: Rol[]) => {
  return async (
    req: AuthenticatedRequest,
    res: ServerResponse,
  ): Promise<boolean> => {
    try {
      // El token decodificado debería tener el id_usuario
      const userId = (req.user as any)?.id_usuario;

      if (!userId) {
        res.statusCode = 403;
        res.end(
          JSON.stringify({
            message: "Token inválido: falta id de usuario",
          }),
        );
        return false;
      }

      // Buscamos el rol actual del usuario en la BD
      const user = await prisma.usuarios.findUnique({
        where: { id_usuario: userId },
        include: { rol: true },
      });

      if (!user) {
        res.statusCode = 403;
        res.end(
          JSON.stringify({
            message: "Usuario no encontrado",
          }),
        );
        return false;
      }

      if (!allowedRoles.includes(user.id_rol)) {
        res.statusCode = 403;
        res.end(
          JSON.stringify({
            message: "No tienes los permisos necesarios para esta acción",
            requiredRoles: allowedRoles.map((id) => Rol[id]),
            yourRole: Rol[user.id_rol],
          }),
        );
        return false;
      }

      // Añadimos el usuario completo al request para uso posterior
      req.user = user;

      return true;
    } catch (error) {
      res.statusCode = 500;
      res.end(
        JSON.stringify({
          message: "Error al verificar permisos",
          error: error instanceof Error ? error.message : "Error desconocido",
        }),
      );
      return false;
    }
  };
};

// Helper para verificar permisos específicos sobre un testimonio
export const authorizeTestimonioAccess = async (
  userId: number,
  testimonioId: number,
  requiredPermission: "READ" | "WRITE" | "DELETE",
): Promise<boolean> => {
  // Primero verificamos si el usuario es ADMIN o CURATOR
  const user = await prisma.usuarios.findUnique({
    where: { id_usuario: userId },
    select: { id_rol: true },
  });

  if (!user) return false;

  // Admins y Curadores tienen acceso total
  if ([Rol.ADMIN, Rol.CURATOR].includes(user.id_rol)) {
    return true;
  }

  // Verificamos permisos específicos en la tabla de permisos
  const permiso = await prisma.permisos.findFirst({
    where: {
      id_testimonio: testimonioId,
      id_rol: user.id_rol,
      permiso: requiredPermission,
    },
  });

  return !!permiso;
};

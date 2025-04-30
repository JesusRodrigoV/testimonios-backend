import type { Request, Response, NextFunction } from "express";
import prisma from "@app/lib/prisma";
import NodeCache from "node-cache";

const roleCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export const Rol = {
  ADMIN: 1,
  CURADOR: 2,
  INVESTIGADOR: 3,
  VISITANTE: 4,
} as const;

export type RoleKeys = keyof typeof Rol;

export const authorizeRoles = (...allowedRoles: number[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (!req.user?.id_usuario || !req.user?.id_rol) {
      res.status(401).json({ message: "No autenticado" });
      return;
    }

    const cacheKey = `role_${req.user.id_usuario}`;
    let userRole: number | undefined;

    userRole = roleCache.get<number>(cacheKey);

    if (userRole === undefined) {
      const user = await prisma.usuarios.findUnique({
        where: { id_usuario: req.user.id_usuario },
        select: { id_rol: true },
      });

      if (!user) {
        res.status(403).json({ message: "Acceso no autorizado" });
        return;
      }

      userRole = user.id_rol;
      roleCache.set(cacheKey, userRole);
    }

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({ message: "Acceso no autorizado" });
      return;
    }

    next();
  };
};

/*
export const authorizeTestimonioAccess = (
  permission: "READ" | "WRITE" | "DELETE",
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const testimonioId = parseInt(req.params.id);
    const userId = req.user?.id_usuario;

    if (!userId) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const acceso = await prisma.permisos.findFirst({
      where: {
        id_testimonio: testimonioId,
        id_rol: req.user.id_rol,
        permiso: permission,
      },
    });

    if (!acceso) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para esta acción" });
    }

    next();
  };
};
*/

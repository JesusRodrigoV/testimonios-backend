import type { NextFunction, Request, Response } from "express";
import prisma from "../lib/prisma";

export const logActivity = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = Date.now();

  res.on("finish", async () => {
    try {
      await prisma.logs.create({
        data: {
          accion: `${req.method} ${req.originalUrl}`,
          detalle: JSON.stringify({
            status: res.statusCode,
            params: req.params,
            query: req.query,
            body: req.body,
            duration: Date.now() - start,
          }),
          id_usuario: req.user?.id_usuario || null,
          fecha: new Date(),
        },
      });
    } catch (error) {
      console.error("Error registrando log:", error);
    }
  });

  next();
};

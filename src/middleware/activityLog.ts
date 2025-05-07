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
      console.log("Registrando log para:", req.method, req.originalUrl);
      console.log("Usuario:", req.user ? req.user : "No autenticado");

      const logData: {
        accion: string;
        detalle: string;
        fecha: Date;
        id_usuario?: number;
      } = {
        accion: `${req.method} ${req.originalUrl}`,
        detalle: JSON.stringify({
          status: res.statusCode,
          params: req.params,
          query: req.query,
          body: req.body,
          duration: Date.now() - start,
        }),
        fecha: new Date(
          new Date().toLocaleString("en-US", { timeZone: "America/La_Paz" }),
        ),
      };

      if (req.user?.id_usuario) {
        logData.id_usuario = req.user.id_usuario;
      }

      await prisma.logs.create({
        data: logData,
      });

      console.log("Log registrado exitosamente");
    } catch (error) {
      console.error("Error registrando log:", error);
    }
  });

  next();
};
import { eventoService } from "@app/services/evento";
import type { Request, Response } from "express";

export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const events = await eventoService.getAllEvents();
    res.json(events);
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error ? error.message : "Error al obtener eventos",
    });
  }
};
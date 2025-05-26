import { etiquetaService } from "@app/services/etiqueta";
import type { Request, Response } from "express";

export const getAllTags = async (req: Request, res: Response) => {
  try {
    const tags = await etiquetaService.getAllTags();
    res.json(tags);
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error ? error.message : "Error al obtener etiquetas",
    });
  }
};
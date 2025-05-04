import type { Request, Response } from "express";
import { testimonyService } from "@app/services/media";
import { parse, ValiError } from "valibot";
import { inputTestimonySchema } from "@app/models/testimony";

export const createTestimony = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id_usuario) {
      return res.status(401).json({ error: "Autenticación requerida" });
    }

    const validatedData = parse(inputTestimonySchema, req.body);

    const testimony = await testimonyService.createTestimony(
      validatedData,
      req.user.id_usuario,
    );
    res.status(201).json(testimony);
  } catch (error) {
    if (error instanceof ValiError) {
      const errorMessage = error.issues
        .map((issue) => issue.message)
        .join("; ");
      return res.status(400).json({ error: errorMessage });
    }
    res.status(400).json({
      error:
        error instanceof Error ? error.message : "Error al crear testimonio",
    });
  }
};

export const getTestimony = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id) throw new Error("ID de testimonio requerido");
    const testimony = await testimonyService.getTestimony(parseInt(id));
    res.json(testimony);
  } catch (error) {
    res.status(404).json({
      error:
        error instanceof Error ? error.message : "Testimonio no encontrado",
    });
  }
};

export const searchTestimonies = async (req: Request, res: Response) => {
  try {
    const params: {
      keyword?: string;
      dateFrom?: string;
      dateTo?: string;
      authorId?: number;
      category?: string;
      tag?: string;
      eventId?: number;
      page?: number;
      limit?: number;
      highlighted?: boolean;
    } = {
      keyword: req.query.keyword as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      authorId: req.query.authorId
        ? parseInt(req.query.authorId as string)
        : undefined,
      category: req.query.category as string,
      tag: req.query.tag as string,
      eventId: req.query.eventId
        ? parseInt(req.query.eventId as string)
        : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      highlighted: req.query.highlighted === "true" ? true : undefined,
    };

    const result = await testimonyService.searchTestimonies(params);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Error en la búsqueda",
    });
  }
};

export const validateTestimony = async (req: Request, res: Response) => {
  try {
    const { testimonyId, approve } = req.body;
    if (!testimonyId || typeof approve !== "boolean")
      throw new Error("Datos de validación inválidos");
    const result = await testimonyService.validateTestimony(
      testimonyId,
      req.user!.id_usuario,
      approve,
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error ? error.message : "Error al validar testimonio",
    });
  }
};

export const getTestimonyVersions = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id) throw new Error("ID de testimonio requerido");
    const versions = await testimonyService.getTestimonyVersions(parseInt(id));
    res.json(versions);
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error ? error.message : "Error al obtener versiones",
    });
  }
};

export const getTestimonyMap = async (req: Request, res: Response) => {
  try {
    const mapData = await testimonyService.getTestimonyMap();
    res.json(mapData);
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : "Error al obtener datos del mapa",
    });
  }
};

export const deleteTestimony = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id) throw new Error("ID de testimonio requerido");
    await testimonyService.deleteTestimony(parseInt(id), req.user!.id_usuario);
    res.json({ message: "Testimonio eliminado" });
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error ? error.message : "Error al eliminar testimonio",
    });
  }
};

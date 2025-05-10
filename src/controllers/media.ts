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
    const testimony = await testimonyService.getTestimony(
      parseInt(id),
      req.user?.id_usuario || 0,
      req.user?.id_rol || 4,
    );
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
      page?: number; // numero de pagina
      limit?: number; // numero de testimonios por pagina
      highlighted?: boolean;
      status?: string;
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
      status: req.query.status as string,
    };

    const result = await testimonyService.searchTestimonies(
      params,
      req.user?.id_usuario || 0,
      req.user?.id_rol || 4,
    );
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
      req.user!.id_rol,
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
    await testimonyService.deleteTestimony(
      parseInt(id),
      req.user!.id_usuario,
      req.user!.id_rol,
    );
    res.json({ message: "Testimonio eliminado" });
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error ? error.message : "Error al eliminar testimonio",
    });
  }
};

// Nuevos endpoints para categorías, etiquetas, eventos, medios y estados
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await testimonyService.getAllCategories();
    res.json(categories);
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error ? error.message : "Error al obtener categorías",
    });
  }
};





export const getAllMediaTypes = async (req: Request, res: Response) => {
  try {
    const mediaTypes = await testimonyService.getAllMediaTypes();
    res.json(mediaTypes);
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : "Error al obtener tipos de medios",
    });
  }
};

export const getAllStatuses = async (req: Request, res: Response) => {
  try {
    const statuses = await testimonyService.getAllStatuses();
    res.json(statuses);
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error ? error.message : "Error al obtener estados",
    });
  }
};

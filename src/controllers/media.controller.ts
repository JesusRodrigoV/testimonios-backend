import type { Request, Response } from "express";
import { testimonyService } from "@app/services/media";
import { parse, partial, ValiError } from "valibot";
import { inputTestimonySchema } from "@app/models/testimony";

export class TestimonyController {
  static async create(req: Request, res: Response) {
    try {
      if (!req.user?.id_usuario) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const validatedData = parse(inputTestimonySchema, req.body);
      const testimony = await testimonyService.createTestimony(
        validatedData,
        req.user.id_usuario
      );
      res.status(201).json(testimony);
    } catch (error) {
      console.error("Error en create:", error);
      if (error instanceof ValiError) {
        const errorMessage = error.issues
          .map((issue) => issue.message)
          .join("; ");
        return res.status(400).json({
          error: "Datos de entrada inválidos",
          details: errorMessage,
        });
      }
      res.status(500).json({
        error: "Error al crear el testimonio",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      if (!req.params.id) {
        return res.status(400).json({ error: "ID de testimonio requerido" });
      }
      const id = parseInt(req.params.id);
      const testimony = await testimonyService.getTestimony(
        id,
        req.user?.id_usuario || 0,
        req.user?.id_rol || 4
      );
      if (!testimony) {
        return res.status(404).json({ error: "Testimonio no encontrado" });
      }
      res.json(testimony);
    } catch (error) {
      console.error("Error en getById:", error);
      res.status(500).json({
        error: "Error al obtener el testimonio",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async getCount(req: Request, res: Response) {
    try {
      const count = await testimonyService.getTestimonyCount();
      res.json(count);
    } catch (error) {
      console.error("Error en getCount:", error);
      res.status(500).json({
        error: "Error al obtener el conteo de testimonios",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async getByUserId(req: Request, res: Response) {
    try {
      if (!req.user?.id_usuario) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }
      const testimonies = await testimonyService.getTestimonyByUserId(
        req.user.id_usuario
      );
      res.json(testimonies);
    } catch (error) {
      console.error("Error en getByUserId:", error);
      res.status(500).json({
        error: "Error al obtener los testimonios del usuario",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async getCountByUserId(req: Request, res: Response) {
    try {
      if (!req.user?.id_usuario) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const count = await testimonyService.getTestimonyCountByUserId(
        req.user.id_usuario
      );
console.log("Count by user ID:", count);
      res.json(count);
    } catch (error) {
      console.error("Error en getCountByUserId:", error);
      res.status(500).json({
        error: "Error al obtener los testimonios del usuario",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async search(req: Request, res: Response) {
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
        limit: req.query.limit
          ? parseInt(req.query.limit as string)
          : undefined,
        highlighted: req.query.highlighted === "true" ? true : undefined,
        status: req.query.status as string,
      };

      const result = await testimonyService.searchTestimonies(
        params,
        req.user?.id_usuario || 0,
        req.user?.id_rol || 4
      );
      res.json(result);
    } catch (error) {
      console.error("Error en search:", error);
      res.status(500).json({
        error: "Error al buscar testimonios",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async validate(req: Request, res: Response) {
    try {
      if (!req.user?.id_usuario) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }
      const { testimonyId, approve } = req.body;
      if (!testimonyId || typeof approve !== "boolean") {
        return res.status(400).json({ error: "Datos de validación inválidos" });
      }
      const result = await testimonyService.validateTestimony(
        testimonyId,
        req.user.id_usuario,
        req.user.id_rol,
        approve
      );
      res.json(result);
    } catch (error) {
      console.error("Error en validate:", error);
      res.status(500).json({
        error: "Error al validar el testimonio",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async getVersions(req: Request, res: Response) {
    try {
      if (!req.params.id) {
        return res.status(400).json({ error: "ID de testimonio requerido" });
      }
      const id = parseInt(req.params.id);
      const versions = await testimonyService.getTestimonyVersions(id);
      res.json(versions);
    } catch (error) {
      console.error("Error en getVersions:", error);
      res.status(500).json({
        error: "Error al obtener las versiones del testimonio",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async getMapData(req: Request, res: Response) {
    try {
      const mapData = await testimonyService.getTestimonyMap();
      res.json(mapData);
    } catch (error) {
      console.error("Error en getMapData:", error);
      res.status(500).json({
        error: "Error al obtener datos del mapa",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      if (!req.user?.id_usuario) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }
      if (!req.params.id) {
        return res.status(400).json({ error: "ID de testimonio requerido" });
      }

      const id = parseInt(req.params.id);
      const partialSchema = partial(inputTestimonySchema);
      const validatedData = parse(partialSchema, req.body);
      const testimony = await testimonyService.updateTestimony(
        id,
        validatedData,
        req.user.id_usuario,
        req.user.id_rol
      );
      res.json(testimony);
    } catch (error) {
      console.error("Error en update:", error);
      if (error instanceof ValiError) {
        const errorMessage = error.issues
          .map((issue) => issue.message)
          .join("; ");
        return res.status(400).json({
          error: "Datos de entrada inválidos",
          details: errorMessage,
        });
      }
      res.status(500).json({
        error: "Error al actualizar el testimonio",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      if (!req.user?.id_usuario) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }
      if (!req.params.id) {
        return res.status(400).json({ error: "ID de testimonio requerido" });
      }
      const id = parseInt(req.params.id);
      await testimonyService.deleteTestimony(
        id,
        req.user.id_usuario,
        req.user.id_rol
      );
      res.status(204).send();
    } catch (error) {
      console.error("Error en delete:", error);
      res.status(500).json({
        error: "Error al eliminar el testimonio",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async getAllCategories(req: Request, res: Response) {
    try {
      const categories = await testimonyService.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error en getAllCategories:", error);
      res.status(500).json({
        error: "Error al obtener las categorías",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async getAllMediaTypes(req: Request, res: Response) {
    try {
      const mediaTypes = await testimonyService.getAllMediaTypes();
      res.json(mediaTypes);
    } catch (error) {
      console.error("Error en getAllMediaTypes:", error);
      res.status(500).json({
        error: "Error al obtener los tipos de medios",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async getAllStatuses(req: Request, res: Response) {
    try {
      const statuses = await testimonyService.getAllStatuses();
      res.json(statuses);
    } catch (error) {
      console.error("Error en getAllStatuses:", error);
      res.status(500).json({
        error: "Error al obtener los estados",
        details: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
}

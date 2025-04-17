import type { Request, Response } from "express";
import { generateOptimizedUrl, uploadMedia } from "../lib/cloudinary";
import prisma from "../lib/prisma";

export const createTestimonio = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const {
    titulo,
    descripcion,
    contenido_texto,
    url_medio,
    latitud,
    longitud,
    duracion,
    id_medio,
    categorias,
    etiquetas,
    eventos_historicos,
  } = req.body;

  try {
    const testimonio = await prisma.testimonios.create({
      data: {
        titulo,
        descripcion,
        contenido_texto,
        url_medio,
        latitud,
        longitud,
        duracion,
        id_medio,
        id_estado: 1,
        fecha_validacion: new Date(),
        subido_por: req.user!.id_usuario,
        verificado_por: req.user!.id_usuario,

        testimonios_categorias: {
          create: categorias.map((id_categoria: number) => ({
            id_categoria,
          })),
        },

        testimonios_etiquetas: {
          create: etiquetas.map((id_etiquetas: number) => ({
            id_etiquetas,
          })),
        },

        testimonios_eventos: {
          create: eventos_historicos.map((id_evento: number) => ({
            id_evento,
          })),
        },
      },
      include: {
        testimonios_categorias: {
          include: {
            categorias: true,
          },
        },
        testimonios_etiquetas: {
          include: {
            etiquetas: true,
          },
        },
        testimonios_eventos: {
          include: {
            eventos_historicos: true,
          },
        },
        medio: true,
        estado: true,
      },
    });

    await prisma.historial_testimonios.create({
      data: {
        version: 1,
        cambios: {
          tipo: "CREACION",
          detalles: "Versión inicial del testimonio",
        },
        id_testimonio: testimonio.id_testimonio,
        editor_id_usuario: req.user!.id_usuario,
      },
    });

    res.json(testimonio);
  } catch (error: unknown) {
    console.error("Error al crear testimonio:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error guardando testimonio";
    res.status(500).json({ error: errorMessage });
  }
};

export const getTestimonioOptions = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const [categorias, etiquetas, eventos, medios, estados] = await Promise.all(
      [
        prisma.categorias.findMany(),
        prisma.etiquetas.findMany(),
        prisma.eventos_historicos.findMany(),
        prisma.medio.findMany(),
        prisma.estado.findMany(),
      ],
    );

    res.json({
      categorias,
      etiquetas,
      eventos_historicos: eventos,
      medios,
      estados,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error obteniendo opciones";
    res.status(500).json({ error: errorMessage });
  }
};

export const validarTestimonio = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id_testimonio } = req.params;
  const { id_estado, notas } = req.body;

  if (!id_testimonio) {
    res.status(400).json({ error: "ID de testimonio es requerido" });
    return;
  }

  const testimonioId = parseInt(id_testimonio);
  if (isNaN(testimonioId)) {
    res
      .status(400)
      .json({ error: "ID de testimonio debe ser un número válido" });
    return;
  }

  try {
    const testimonio = await prisma.testimonios.update({
      where: { id_testimonio: testimonioId },
      data: {
        id_estado,
        fecha_validacion: new Date(),
        verificado_por: req.user!.id_usuario,
      },
    });

    await prisma.historial_testimonios.create({
      data: {
        version: 1,
        cambios: {
          tipo: "VALIDACION",
          estado: id_estado,
          notas,
          validador: req.user!.id_usuario,
        },
        id_testimonio: testimonioId,
        editor_id_usuario: req.user!.id_usuario,
      },
    });

    res.json(testimonio);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error validando testimonio";
    res.status(500).json({ error: errorMessage });
  }
};

export const uploadFromUrl = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { url } = req.body;

  try {
    const result = await uploadMedia(url, {
      folder: "testimonios",
      public_id: `testimonio_${Date.now()}`,
    });

    res.json({
      success: true,
      data: {
        url: result.url,
        optimizedUrl: generateOptimizedUrl(result.public_id),
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

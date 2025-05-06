import { deleteMedia } from "@app/lib/cloudinary";
import {
  type TestimonyInput,
  inputTestimonySchema,
} from "@app/models/testimony";
import { PrismaClient, Prisma } from "@generated/prisma";
import { parse } from "valibot";

const prisma = new PrismaClient();

export const testimonyService = {
  createTestimony: async (data: TestimonyInput, userId: number) => {
    const validatedData = parse(inputTestimonySchema, data);

    const mediaTypeId = validatedData.format === "video" ? 1 : 2;

    const testimony = await prisma.testimonios.create({
      data: {
        titulo: validatedData.title,
        descripcion: validatedData.description,
        contenido_texto: validatedData.content || "Sin información",
        url_medio: validatedData.url,
        duracion: validatedData.duration ?? 0,
        latitud: validatedData.latitude
          ? new Prisma.Decimal(validatedData.latitude)
          : null,
        longitud: validatedData.longitude
          ? new Prisma.Decimal(validatedData.longitude)
          : null,
        id_estado: 1,
        id_medio: mediaTypeId,
        subido_por: userId,
        verificado_por: userId,
        fecha_validacion: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        estado: true,
        medio: true,
      },
    });

    if (validatedData.tags?.length) {
      for (const tagName of validatedData.tags) {
        let tag = await prisma.etiquetas.findFirst({
          where: { nombre: tagName },
        });
        if (!tag) {
          tag = await prisma.etiquetas.create({ data: { nombre: tagName } });
        }
        await prisma.testimonios_etiquetas.create({
          data: {
            id_etiquetas: tag.id_etiquetas,
            id_testimonio: testimony.id_testimonio,
          },
        });
      }
    }

    if (validatedData.categories?.length) {
      for (const categoryName of validatedData.categories) {
        let category = await prisma.categorias.findFirst({
          where: { nombre: categoryName },
        });
        if (!category) {
          category = await prisma.categorias.create({
            data: { nombre: categoryName, descripcion: "" },
          });
        }
        await prisma.testimonios_categorias.create({
          data: {
            id_categoria: category.id_categoria,
            id_testimonio: testimony.id_testimonio,
          },
        });
      }
    }

    if (validatedData.eventId) {
      await prisma.testimonios_eventos.create({
        data: {
          id_testimonio: testimony.id_testimonio,
          id_evento: validatedData.eventId,
        },
      });
    }

    await prisma.historial_testimonios.create({
      data: {
        version: 1,
        cambios: {
          tipo: "CREACION",
          detalles: "Versión inicial del testimonio",
        },
        id_testimonio: testimony.id_testimonio,
        editor_id_usuario: userId,
      },
    });

    return {
      id: testimony.id_testimonio,
      title: testimony.titulo,
      description: testimony.descripcion,
      content: testimony.contenido_texto,
      url: testimony.url_medio,
      duration: testimony.duracion,
      latitude: testimony.latitud ? Number(testimony.latitud) : null,
      longitude: testimony.longitud ? Number(testimony.longitud) : null,
      createdAt: testimony.created_at,
      status: testimony.estado.nombre,
      mediaType: testimony.medio.nombre,
    };
  },

  getTestimony: async (id: number) => {
    const testimony = await prisma.testimonios.findUnique({
      where: { id_testimonio: id },
      select: {
        id_testimonio: true,
        titulo: true,
        descripcion: true,
        contenido_texto: true,
        url_medio: true,
        duracion: true,
        latitud: true,
        longitud: true,
        created_at: true,
        updated_at: true,
        estado: { select: { nombre: true } },
        medio: { select: { nombre: true } },
        testimonios_categorias: {
          include: { categorias: { select: { nombre: true } } },
        },
        testimonios_etiquetas: {
          include: { etiquetas: { select: { nombre: true } } },
        },
        testimonios_eventos: {
          include: { eventos_historicos: { select: { nombre: true } } },
        },
        usuarios_testimonios_subido_porTousuarios: { select: { nombre: true } },
      },
    });

    if (!testimony) {
      throw new Error("Testimonio no encontrado");
    }

    return {
      id: testimony.id_testimonio,
      title: testimony.titulo,
      description: testimony.descripcion,
      content: testimony.contenido_texto,
      url: testimony.url_medio,
      duration: testimony.duracion,
      latitude: testimony.latitud ? Number(testimony.latitud) : null,
      longitude: testimony.longitud ? Number(testimony.longitud) : null,
      createdAt: testimony.created_at,
      updatedAt: testimony.updated_at,
      status: testimony.estado.nombre,
      mediaType: testimony.medio.nombre,
      author: testimony.usuarios_testimonios_subido_porTousuarios.nombre,
      categories: testimony.testimonios_categorias.map(
        (tc) => tc.categorias.nombre,
      ),
      tags: testimony.testimonios_etiquetas.map((te) => te.etiquetas.nombre),
      event: testimony.testimonios_eventos[0]?.eventos_historicos?.nombre,
    };
  },

  searchTestimonies: async (params: {
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
  }) => {
    const where: Prisma.testimoniosWhereInput = { id_estado: 2 }; // Solo aprobados

    if (params.keyword) {
      where.OR = [
        { titulo: { contains: params.keyword, mode: "insensitive" } },
        { descripcion: { contains: params.keyword, mode: "insensitive" } },
        { contenido_texto: { contains: params.keyword, mode: "insensitive" } },
      ];
    }

    if (params.dateFrom || params.dateTo) {
      where.created_at = {};
      if (params.dateFrom) where.created_at.gte = new Date(params.dateFrom);
      if (params.dateTo) where.created_at.lte = new Date(params.dateTo);
    }

    if (params.authorId) {
      where.subido_por = params.authorId;
    }

    if (params.category) {
      where.testimonios_categorias = {
        some: {
          categorias: {
            nombre: { contains: params.category, mode: "insensitive" },
          },
        },
      };
    }

    if (params.tag) {
      where.testimonios_etiquetas = {
        some: {
          etiquetas: { nombre: { contains: params.tag, mode: "insensitive" } },
        },
      };
    }

    if (params.eventId) {
      where.testimonios_eventos = { some: { id_evento: params.eventId } };
    }

    const page = params.page ?? 1;
    const limit = params.highlighted ? 3 : (params.limit ?? 5); // 3 para destacados, 5 por defecto
    const skip = (page - 1) * limit;

    const select = {
      id_testimonio: true,
      titulo: true,
      descripcion: true,
      contenido_texto: true,
      url_medio: true,
      duracion: true,
      latitud: true,
      longitud: true,
      created_at: true,
      estado: { select: { nombre: true } },
      medio: { select: { nombre: true } },
      testimonios_categorias: {
        include: { categorias: { select: { nombre: true } } },
      },
      testimonios_etiquetas: {
        include: { etiquetas: { select: { nombre: true } } },
      },
      testimonios_eventos: {
        include: { eventos_historicos: { select: { nombre: true } } },
      },
      usuarios_testimonios_subido_porTousuarios: { select: { nombre: true } },
    };

    const [testimonies, total] = await Promise.all([
      prisma.testimonios.findMany({
        where,
        skip,
        take: limit,
        orderBy: params.highlighted
          ? [
              { calificaciones: { _count: "desc" } }, // Priorizar por número de calificaciones
              { created_at: "desc" },
            ]
          : { created_at: "desc" },
        select,
      }),
      prisma.testimonios.count({ where }),
    ]);

    return {
      data: testimonies.map((t) => ({
        id: t.id_testimonio,
        title: t.titulo,
        description: t.descripcion,
        content: t.contenido_texto,
        url: t.url_medio,
        duration: t.duracion,
        latitude: t.latitud ? Number(t.latitud) : null,
        longitude: t.longitud ? Number(t.longitud) : null,
        createdAt: t.created_at,
        status: t.estado.nombre,
        mediaType: t.medio.nombre,
        author: t.usuarios_testimonios_subido_porTousuarios.nombre,
        categories: t.testimonios_categorias.map((tc) => tc.categorias.nombre),
        tags: t.testimonios_etiquetas.map((te) => te.etiquetas.nombre),
        event: t.testimonios_eventos[0]?.eventos_historicos?.nombre,
      })),
      total,
      page,
      limit,
    };
  },

  validateTestimony: async (
    testimonyId: number,
    curatorId: number,
    approve: boolean,
  ) => {
    const testimony = await prisma.testimonios.update({
      where: { id_testimonio: testimonyId },
      data: {
        id_estado: approve ? 2 : 3,
        verificado_por: curatorId,
        fecha_validacion: new Date(),
        updated_at: new Date(),
      },
      include: { estado: true },
    });

    await prisma.historial_testimonios.create({
      data: {
        version:
          (await prisma.historial_testimonios.count({
            where: { id_testimonio: testimonyId },
          })) + 1,
        cambios: {
          tipo: approve ? "APROBACION" : "RECHAZO",
          detalles: `Testimonio ${approve ? "aprobado" : "rechazado"} por curador`,
        },
        id_testimonio: testimonyId,
        editor_id_usuario: curatorId,
      },
    });

    return {
      id: testimony.id_testimonio,
      status: testimony.estado.nombre,
    };
  },

  getTestimonyVersions: async (testimonyId: number) => {
    const history = await prisma.historial_testimonios.findMany({
      where: { id_testimonio: testimonyId },
      orderBy: { version: "asc" },
      include: { usuarios: { select: { nombre: true } } },
    });

    return history.map((h) => ({
      version: h.version,
      changes: h.cambios,
      editedAt: h.fecha_edicion,
      editor: h.usuarios.nombre,
    }));
  },

  getTestimonyMap: async () => {
    const testimonies = await prisma.testimonios.findMany({
      where: { latitud: { not: null }, longitud: { not: null }, id_estado: 2 },
      select: {
        id_testimonio: true,
        titulo: true,
        latitud: true,
        longitud: true,
      },
    });

    return testimonies.map((t) => ({
      id: t.id_testimonio,
      title: t.titulo,
      coordinates: [Number(t.latitud), Number(t.longitud)],
    }));
  },

  deleteTestimony: async (testimonyId: number, userId: number) => {
    const testimony = await prisma.testimonios.findUnique({
      where: { id_testimonio: testimonyId },
      select: { url_medio: true },
    });

    if (!testimony) {
      throw new Error("Testimonio no encontrado");
    }

    try {
      const publicId = testimony.url_medio
        .split("/")
        .slice(-1)[0]
        .split(".")[0];
      await deleteMedia(`legado_bolivia/testimonies/${publicId}`);

      await prisma.historial_testimonios.create({
        data: {
          version:
            (await prisma.historial_testimonios.count({
              where: { id_testimonio: testimonyId },
            })) + 1,
          cambios: { tipo: "ELIMINACION", detalles: "Testimonio eliminado" },
          id_testimonio: testimonyId,
          editor_id_usuario: userId,
        },
      });

      await prisma.testimonios.delete({
        where: { id_testimonio: testimonyId },
      });
    } catch (error) {
      throw new Error(
        `Error al eliminar testimonio: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
    }
  },
};

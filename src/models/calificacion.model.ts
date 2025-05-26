import prisma from "../lib/prisma";

export class CalificacionModel {
  static async findAll() {
    return prisma.calificaciones.findMany();
  }

  static async findById(id: number) {
    return prisma.calificaciones.findUnique({
      where: { id_calificacion: id }
    });
  }

  static async findExistingCalificacion(id_usuario: number, id_testimonio: number) {
    return prisma.calificaciones.findFirst({
      where: {
        id_usuario,
        id_testimonio
      }
    });
  }

  static async create(data: { puntuacion: number, fecha: Date, id_usuario: number, id_testimonio: number }) {
    const existingCalificacion = await this.findExistingCalificacion(data.id_usuario, data.id_testimonio);

    if (existingCalificacion) {
      throw new Error('El usuario ya ha calificado este testimonio');
    }

    return prisma.calificaciones.create({
      data
    });
  }

  static async update(id: number, data: { puntuacion?: number, fecha?: Date, id_usuario?: number, id_testimonio?: number }) {
    return prisma.calificaciones.update({
      where: { id_calificacion: id },
      data
    });
  }

  static async delete(id: number) {
    return prisma.calificaciones.delete({
      where: { id_calificacion: id }
    });
  }

  static async getTopRatedTestimonies(limit: number) {
    const ratings = await prisma.calificaciones.groupBy({
      by: ["id_testimonio"],
      _avg: { puntuacion: true },
      _count: { id_calificacion: true },
      having: { id_calificacion: { _count: { gte: 3 } } },
      orderBy: [{ _avg: { puntuacion: "desc" } }, { _count: { id_calificacion: "desc" } }],
      take: limit,
    });

    const ratedTestimonyIds = ratings.map((r) => r.id_testimonio);

    let testimonies = await prisma.testimonios.findMany({
      where: {
        id_testimonio: { in: ratedTestimonyIds },
        estado: { nombre: "Aprobado" },
      },
      include: {
        medio: true,
        estado: true,
        usuarios_testimonios_subido_porTousuarios: true,
        usuarios_testimonios_verificado_porTousuarios: true,
        testimonios_categorias: { include: { categorias: true } },
        testimonios_etiquetas: { include: { etiquetas: true } },
        testimonios_eventos: { include: { eventos_historicos: true } },
      },
    });

    const remainingLimit = limit - testimonies.length;
    if (remainingLimit > 0) {
      const additionalTestimonies = await prisma.testimonios.findMany({
        where: {
          id_testimonio: { notIn: ratedTestimonyIds },
          estado: { nombre: "Aprobado" },
        },
        include: {
          medio: true,
          estado: true,
          usuarios_testimonios_subido_porTousuarios: true,
          usuarios_testimonios_verificado_porTousuarios: true,
          testimonios_categorias: { include: { categorias: true } },
          testimonios_etiquetas: { include: { etiquetas: true } },
          testimonios_eventos: { include: { eventos_historicos: true } },
        },
        orderBy: { created_at: "desc" },
        take: remainingLimit,
      });

      testimonies = [...testimonies, ...additionalTestimonies];
    }

    const result = testimonies.map((testimony) => {
      const rating = ratings.find((r) => r.id_testimonio === testimony.id_testimonio);
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
        format: testimony.medio.nombre,
        author: testimony.usuarios_testimonios_subido_porTousuarios.nombre,
        categories: testimony.testimonios_categorias.map((tc) => tc.categorias.nombre),
        tags: testimony.testimonios_etiquetas.map((te) => te.etiquetas.nombre),
        event: testimony.testimonios_eventos[0]?.eventos_historicos?.nombre,
        averageRating: rating?._avg.puntuacion || 0,
        ratingCount: rating?._count.id_calificacion || 0,
      };
    });

    return result.slice(0, limit);
  }
}
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

    const testimonyIds = ratings.map((r) => r.id_testimonio);
    const testimonies = await prisma.testimonios.findMany({
      where: { id_testimonio: { in: testimonyIds }, estado: { nombre: "APROBADO" } },
      include: {
        medio: true,
        estado: true,
        usuarios_testimonios_subido_porTousuarios: true,
        usuarios_testimonios_verificado_porTousuarios: true,
      },
    });

    return ratings
      .map((rated) => {
        const testimony = testimonies.find((t) => t.id_testimonio === rated.id_testimonio);
        return (
          testimony && {
            ...testimony,
            averageRating: rated._avg.puntuacion || 0,
            ratingCount: rated._count.id_calificacion,
          }
        );
      })
      .filter(Boolean);
  }
}
import prisma from "src/lib/prisma";

export class ForoTemaModel {
  static async findAll() {
    return prisma.foro_temas.findMany();
  }

  static async findById(id: number) {
    return prisma.foro_temas.findUnique({
      where: { id_forotema: id }
    });
  }

  static async findByUserId(userId: number) {
    return prisma.foro_temas.findMany({
      where: { creado_por_id_usuario: userId },
      include: {
        foro_comentarios: true,
        usuarios: true,
        testimonios: true,
        eventos_historicos: true
      }
    });
  }

  static async create(data: { titulo: string; descripcion: string; fecha_creacion: Date; creado_por_id_usuario: number; id_evento: number, id_testimonio: number }) {
    return prisma.foro_temas.create({
      data
    });
  }

  static async update(id: number, data: { titulo?: string; descripcion?: string; fecha_creacion?: Date; creado_por_id_usuario?: number; id_evento?: number, id_testimonio?: number }) {
    return prisma.foro_temas.update({
      where: { id_forotema: id },
      data
    });
  }

  static async delete(id: number) {
    return prisma.foro_temas.delete({
      where: { id_forotema: id }
    });
  }
}
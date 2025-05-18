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
  }
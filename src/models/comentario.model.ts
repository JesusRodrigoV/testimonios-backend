import prisma from "src/lib/prisma";

export class ComentarioModel {
    static async findAll() {
      return prisma.comentarios.findMany();
    }
  
    static async findApproved() {
      return prisma.comentarios.findMany({
        where: { id_estado: 1 } // 1 = aprobado
      });
    }
  
    static async findById(id: number) {
      return prisma.comentarios.findUnique({
        where: { id_comentario: id }
      });
    }
  
    static async create(data: { 
      contenido: string; 
      id_estado: number; 
      fecha_creacion: Date; 
      creado_por_id_usuario: number; 
      id_testimonio: number 
    }) {
      return prisma.comentarios.create({
        data
      });
    }
  
    static async update(id: number, data: { 
      contenido?: string;
      id_estado?: number;
    }) {
      return prisma.comentarios.update({
        where: { id_comentario: id },
        data
      });
    }
  
    static async delete(id: number) {
      return prisma.comentarios.delete({
        where: { id_comentario: id }
      });
    }
}
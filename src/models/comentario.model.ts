import prisma from "src/lib/prisma";
import { NotificacionModel } from "./notificacion.model";

export class ComentarioModel {
    static async findAll() {
      return prisma.comentarios.findMany();
    }
  
    static async findApproved() {
      return prisma.comentarios.findMany({
        where: { id_estado: 2 }, // 2 = aprobado
        include: {
          usuarios: {
            select: {
              nombre: true,
              profile_image: true
            }
          }
        }
      });
    }

    static async findPending() {
      return prisma.comentarios.findMany({
        where: { id_estado: 1 }, // 1 = pendiente
        include: {
          usuarios: {
            select: {
              nombre: true,
              profile_image: true
            }
          }
        }
      });
    }

    static async findByTestimonioId(id_testimonio: number) {
      return prisma.comentarios.findMany({
        where: { 
          id_testimonio,
          id_estado: 2 // solo comentarios aprobados
        },
        include: {
          usuarios: {
            select: {
              nombre: true,
              profile_image: true
            }
          }
        },
        orderBy: {
          fecha_creacion: 'desc'
        }
      });
    }
  
    static async findById(id: number) {
      return prisma.comentarios.findUnique({
        where: { id_comentario: id },
        include: {
          usuarios: {
            select: {
              nombre: true,
              profile_image: true
            }
          }
        }
      });
    }
  
    static async create(data: { 
      contenido: string; 
      id_estado: number; 
      fecha_creacion: Date; 
      creado_por_id_usuario: number; 
      id_testimonio: number 
    }) {
      const comentario = await prisma.comentarios.create({
        data,
        include: {
          usuarios: {
            select: {
              nombre: true,
              profile_image: true
            }
          },
          testimonios: {
            select: {
              titulo: true
            }
          }
        }
      });

      await NotificacionModel.notificarNuevoComentario(
        comentario.id_testimonio,
        comentario.creado_por_id_usuario,
        comentario.testimonios.titulo
      );

      return comentario;
    }
  
    static async update(id: number, data: { 
      contenido?: string;
      id_estado?: number;
    }) {
      const comentario = await prisma.comentarios.update({
        where: { id_comentario: id },
        data,
        include: {
          usuarios: {
            select: {
              nombre: true,
              profile_image: true
            }
          },
          testimonios: {
            select: {
              titulo: true
            }
          }
        }
      });

      // Si se cambió el estado, notificar al usuario
      if (data.id_estado) {
        await NotificacionModel.notificarCambioEstadoComentario(
          comentario.id_testimonio,
          comentario.creado_por_id_usuario,
          data.id_estado,
          comentario.testimonios.titulo
        );
      }

      return comentario;
    }
  
    static async delete(id: number) {
      return prisma.comentarios.delete({
        where: { id_comentario: id }
      });
    }
}
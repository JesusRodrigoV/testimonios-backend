import prisma from "src/lib/prisma";
import { buildCommentTree, sortCommentsByDate } from "../utils/commentTree";

export class ForoComentarioModel {
  static async findAll() {
    return prisma.foro_comentarios.findMany({
      include: {
        usuarios: {
          select: {
            id_usuario: true,
            nombre: true,
            email: true,
            profile_image: true,
            rol: {
              select: {
                nombre: true
              }
            }
          }
        }
      }
    });
  }

  static async findById(id: number) {
    return prisma.foro_comentarios.findUnique({
      where: { id_forocoment: id },
      include: {
        usuarios: {
          select: {
            id_usuario: true,
            nombre: true,
            email: true,
            profile_image: true,
            rol: {
              select: {
                nombre: true
              }
            }
          }
        }
      }
    });
  }

  static async findByTemaId(temaId: number) {
    const comentarios = await prisma.foro_comentarios.findMany({
      where: { id_forotema: temaId },
      include: {
        usuarios: {
          select: {
            id_usuario: true,
            nombre: true,
            email: true,
            profile_image: true,
            rol: {
              select: {
                nombre: true
              }
            }
          }
        }
      }
    });

    // Construir el árbol de comentarios y ordenarlos
    const commentTree = buildCommentTree(comentarios);
    return sortCommentsByDate(commentTree);
  }

  static async create(data: {
    contenido: string;
    fecha_creacion: Date;
    creado_por_id_usuario: number;
    id_forotema: number;
    parent_id?: number;
  }) {
    return prisma.foro_comentarios.create({
      data,
      include: {
        usuarios: {
          select: {
            id_usuario: true,
            nombre: true,
            email: true,
            profile_image: true,
            rol: {
              select: {
                nombre: true
              }
            }
          }
        }
      }
    });
  }

  static async update(id: number, data: {
    contenido?: string;
  }) {
    return prisma.foro_comentarios.update({
      where: { id_forocoment: id },
      data,
      include: {
        usuarios: {
          select: {
            id_usuario: true,
            nombre: true,
            email: true,
            profile_image: true,
            rol: {
              select: {
                nombre: true
              }
            }
          }
        }
      }
    });
  }

  static async delete(id: number) {
    // Primero eliminamos todos los comentarios hijos
    await prisma.foro_comentarios.deleteMany({
      where: { parent_id: id }
    });

    // Luego eliminamos el comentario padre
    return prisma.foro_comentarios.delete({
      where: { id_forocoment: id }
    });
  }
}

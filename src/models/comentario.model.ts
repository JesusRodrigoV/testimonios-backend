import prisma from "src/lib/prisma";

export class ComentarioModel {
  static async findAll() {
    return prisma.comentarios.findMany({
      include: {
        usuarios: {
          select: {
            nombre: true,
            profile_image: true,
            rol: { select: { id_rol: true, nombre: true } },
          },
        },
      },
    });
  }

  static async findApproved() {
    return prisma.comentarios.findMany({
      where: { id_estado: 2 },
      include: {
        usuarios: {
          select: {
            nombre: true,
            profile_image: true,
            rol: { select: { id_rol: true, nombre: true } },
          },
        },
        replies: {
          where: { id_estado: 2 },
          include: {
            usuarios: {
              select: {
                nombre: true,
                profile_image: true,
                rol: { select: { id_rol: true, nombre: true } },
              },
            },
          },
          orderBy: { fecha_creacion: 'asc' },
        },
        likes: { select: { id_usuario: true } },
      },
      orderBy: { fecha_creacion: 'desc' },
    });
  }

  static async findPending() {
    return prisma.comentarios.findMany({
      where: { id_estado: 1 }, // 1 = pendiente
      include: {
        usuarios: {
          select: {
            nombre: true,
            profile_image: true,
            rol: { select: { id_rol: true, nombre: true } },
          }
        }
      }
    });
  }

  static async findByTestimonioId(id_testimonio: number) {
    return prisma.comentarios.findMany({
      where: {
        id_testimonio,
        id_estado: 2,
        parent_id: null,
      },
      include: {
        usuarios: {
          select: {
            id_usuario: true,
            nombre: true,
            profile_image: true,
            rol: { select: { id_rol: true, nombre: true } },
          },
        },
        replies: {
          where: { id_estado: 2 },
          include: {
            usuarios: {
              select: {
                id_usuario: true,
                nombre: true,
                profile_image: true,
                rol: { select: { id_rol: true, nombre: true } },
              },
            },
            likes: { select: { id_usuario: true } },
          },
          orderBy: { fecha_creacion: 'asc' },
        },
        likes: { select: { id_usuario: true } },
      },
      orderBy: { fecha_creacion: 'desc' },
    });
  }

  static async findById(id: number) {
    return prisma.comentarios.findUnique({
      where: { id_comentario: id },
      include: {
        usuarios: {
          select: {
            nombre: true,
            profile_image: true,
            rol: { select: { id_rol: true, nombre: true } },
          },
        },
        replies: {
          where: { id_estado: 2 },
          include: {
            usuarios: {
              select: {
                nombre: true,
                profile_image: true,
                rol: { select: { id_rol: true, nombre: true } },
              },
            },
            likes: { select: { id_usuario: true } },
          },
        },
        likes: { select: { id_usuario: true } },
      },
    });
  }

  static async create(data: {
    contenido: string;
    id_estado: number;
    fecha_creacion: Date;
    creado_por_id_usuario: number;
    id_testimonio: number;
    parent_id?: number;
  }) {
    return prisma.comentarios.create({
      data,
      include: {
        usuarios: {
          select: {
            nombre: true,
            profile_image: true,
            rol: { select: { id_rol: true, nombre: true } },
          }
        },
        likes: { select: { id_usuario: true } },
      }
    });
  }

  static async update(id: number, data: {
    contenido?: string;
    id_estado?: number;
  }) {
    return prisma.comentarios.update({
      where: { id_comentario: id },
      data,
      include: {
        usuarios: {
          select: {
            nombre: true,
            profile_image: true,
            rol: { select: { id_rol: true, nombre: true } },
          },
        },
        likes: { select: { id_usuario: true } },
      },
    });
  }

  static async delete(id: number) {
    return prisma.comentarios.delete({
      where: { id_comentario: id }
    });
  }

  static async likeComment(id_comentario: number, id_usuario: number) {
    return prisma.likes_comentarios.create({
      data: {
        id_comentario,
        id_usuario,
      },
    });
  }

  static async unlikeComment(id_comentario: number, id_usuario: number) {
    return prisma.likes_comentarios.delete({
      where: {
        id_comentario_id_usuario: {
          id_comentario,
          id_usuario,
        },
      },
    });
  }
}
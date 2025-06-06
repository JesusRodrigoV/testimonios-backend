import prisma from "src/lib/prisma";

export class NotificacionModel {
  static async findAll() {
    return prisma.notificaciones.findMany({
      include: {
        testimonios: {
          select: {
            titulo: true
          }
        },
        estado: {
          select: {
            nombre: true
          }
        }
      }
    });
  }

  static async findByUsuario(id_usuario: number) {
    return prisma.notificaciones.findMany({
      where: { id_usuario },
      include: {
        testimonios: {
          select: {
            titulo: true
          }
        },
        estado: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: {
        fecha_creacion: 'desc'
      }
    });
  }

  static async findUnreadByUsuario(id_usuario: number) {
    return prisma.notificaciones.findMany({
      where: { 
        id_usuario,
        leido: false 
      },
      include: {
        testimonios: {
          select: {
            titulo: true
          }
        },
        estado: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: {
        fecha_creacion: 'desc'
      }
    });
  }

  static async findById(id: number) {
    return prisma.notificaciones.findUnique({
      where: { id_notificacion: id },
      include: {
        testimonios: {
          select: {
            titulo: true
          }
        },
        estado: {
          select: {
            nombre: true
          }
        }
      }
    });
  }

  static async create(data: {
    mensaje: string;
    id_testimonio: number;
    id_estado: number;
    id_usuario: number;
  }) {
    return prisma.notificaciones.create({
      data: {
        ...data,
        fecha_creacion: new Date(),
        leido: false
      },
      include: {
        testimonios: {
          select: {
            titulo: true
          }
        },
        estado: {
          select: {
            nombre: true
          }
        }
      }
    });
  }

  static async notificarNuevoTestimonio(id_testimonio: number, id_usuario: number) {
    const usuarios = await prisma.usuarios.findMany({
      where: {
        id_rol: {
          in: [1, 2]
        }
      }
    });

    const notificaciones = await Promise.all(
      usuarios.map(usuario =>
        this.create({
          mensaje: "Se ha subido un nuevo testimonio para revisión",
          id_testimonio,
          id_estado: 1,
          id_usuario: usuario.id_usuario
        })
      )
    );

    return notificaciones;
  }

  static async notificarCambioEstadoTestimonio(
    id_testimonio: number,
    id_usuario: number,
    id_estado: number,
    titulo_testimonio: string
  ) {

    var mensaje = "";
    switch (id_estado) {
      case 1:
        mensaje = `Tu testimonio "${titulo_testimonio}" ha sido enviado para revisión`
        break;
      case 2:
        mensaje = `Tu testimonio "${titulo_testimonio}" ha sido aprobado`
        break;
      case 3:
        mensaje = `Tu testimonio "${titulo_testimonio}" ha sido rechazado`;
        break;
    }


    return this.create({
      mensaje,
      id_testimonio,
      id_estado,
      id_usuario
    });
  }

  static async notificarNuevoComentario(id_testimonio: number, id_usuario: number) {
    const usuarios = await prisma.usuarios.findMany({
      where: {
        id_rol: 1
      }
    });

    const notificaciones = await Promise.all(
      usuarios.map(usuario =>
        this.create({
          mensaje: "Se ha creado un nuevo comentario pendiente de aprobación",
          id_testimonio,
          id_estado: 1,
          id_usuario: usuario.id_usuario
        })
      )
    );

    return notificaciones;
  }

  static async notificarCambioEstadoComentario(
    id_testimonio: number,
    id_usuario: number,
    id_estado: number
  ) {
    let mensaje = "";
    switch (id_estado) {
      case 2:
        mensaje = "Tu comentario ha sido aprobado";
        break;
      case 3:
        mensaje = "Tu comentario ha sido rechazado";
        break;
    }

    return this.create({
      mensaje,
      id_testimonio,
      id_estado,
      id_usuario
    });
  }

  static async marcarComoLeido(id: number) {
    return prisma.notificaciones.update({
      where: { id_notificacion: id },
      data: { leido: true },
      include: {
        testimonios: {
          select: {
            titulo: true
          }
        },
        estado: {
          select: {
            nombre: true
          }
        }
      }
    });
  }

  static async delete(id: number) {
    return prisma.notificaciones.delete({
      where: { id_notificacion: id }
    });
  }

  static async cambiarEstado(id: number, id_estado: number) {
    return prisma.notificaciones.update({
      where: { id_notificacion: id },
      data: { id_estado },
      include: {
        testimonios: {
          select: {
            titulo: true
          }
        },
        estado: {
          select: {
            nombre: true
          }
        }
      }
    });
  }
}
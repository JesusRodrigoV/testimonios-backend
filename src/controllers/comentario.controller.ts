import type { Request, Response } from 'express';
import { ComentarioModel } from '../models/comentario.model';
import { Rol } from '@app/middleware/authorization';

export class ComentarioController {
  static async getAll(req: Request, res: Response) {
    try {
      // Si es administrador, ve todos los comentarios
      if (req.user?.id_rol === Rol.ADMIN) {
        const comentarios = await ComentarioModel.findAll();
        return res.json(comentarios);
      }
      
      // Si no es administrador, solo ve los comentarios aprobados (id_estado: 2)
      const comentarios = await ComentarioModel.findApproved();
      res.json(comentarios);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener los comentarios' });
    }
  }

  static async getPendingComments(req: Request, res: Response) {
    try {
      // Solo el administrador puede ver los comentarios pendientes
      if (req.user?.id_rol !== Rol.ADMIN) {
        return res.status(403).json({ error: 'No tiene permiso para ver comentarios pendientes' });
      }

      const comentarios = await ComentarioModel.findPending();
      res.json(comentarios);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener los comentarios pendientes' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      if (!req.params.id) {
        return res.status(400).json({ error: 'ID no proporcionado' });
      }
      const id = parseInt(req.params.id);
      const comentario = await ComentarioModel.findById(id);
      
      if (!comentario) {
        return res.status(404).json({ error: 'Comentario no encontrado' });
      }

      // Si no es administrador y el comentario no está aprobado (id_estado: 2), no puede verlo
      if (req.user?.id_rol !== Rol.ADMIN && comentario.id_estado !== 2) {
        return res.status(403).json({ error: 'No tiene permiso para ver este comentario' });
      }

      res.json(comentario);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener el comentario' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { contenido, id_testimonio } = req.body;
      
      // Por defecto, los comentarios nuevos tienen estado pendiente (id_estado: 1)
      const comentario = await ComentarioModel.create({ 
        contenido, 
        id_estado: 1, // Estado pendiente
        fecha_creacion: new Date(),
        creado_por_id_usuario: req.user!.id_usuario,
        id_testimonio 
      });
      
      res.status(201).json(comentario);
    } catch (error) {
      res.status(500).json({ error: 'Error al crear el comentario' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      if (!req.params.id) {
        return res.status(400).json({ error: 'ID no proporcionado' });
      }

      const id = parseInt(req.params.id);
      const comentario = await ComentarioModel.findById(id);

      if (!comentario) {
        return res.status(404).json({ error: 'Comentario no encontrado' });
      }

      if (req.user?.id_rol === Rol.ADMIN) {
        const { contenido, id_estado } = req.body;
        const comentarioActualizado = await ComentarioModel.update(id, { contenido, id_estado });
        return res.json(comentarioActualizado);
      }

      // Si no es administrador, solo puede actualizar el contenido de sus propios comentarios
      if (comentario.creado_por_id_usuario !== req.user!.id_usuario) {
        return res.status(403).json({ error: 'No tiene permiso para modificar este comentario' });
      }

      const { contenido } = req.body;
      const comentarioActualizado = await ComentarioModel.update(id, { contenido });
      res.json(comentarioActualizado);
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar el comentario' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      if (!req.params.id) {
        return res.status(400).json({ error: 'ID no proporcionado' });
      }

      const id = parseInt(req.params.id);
      const comentario = await ComentarioModel.findById(id);

      if (!comentario) {
        return res.status(404).json({ error: 'Comentario no encontrado' });
      }

      // Solo el administrador o el creador del comentario pueden eliminarlo
      if (req.user?.id_rol !== Rol.ADMIN && comentario.creado_por_id_usuario !== req.user!.id_usuario) {
        return res.status(403).json({ error: 'No tiene permiso para eliminar este comentario' });
      }

      await ComentarioModel.delete(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar el comentario' });
    }
  }

  static async validateComment(req: Request, res: Response) {
    try {
      const { commentId, approve } = req.body;
      
      if (!commentId || typeof approve !== "boolean") {
        return res.status(400).json({ error: "Datos de validación inválidos" });
      }

      // Solo administradores y curadores pueden validar comentarios
      if (req.user?.id_rol !== Rol.ADMIN && req.user?.id_rol !== Rol.CURADOR) {
        return res.status(403).json({ error: "No tiene permiso para validar comentarios" });
      }

      const comentario = await ComentarioModel.findById(parseInt(commentId));
      
      if (!comentario) {
        return res.status(404).json({ error: "Comentario no encontrado" });
      }

      // Actualizar el estado del comentario (2 = aprobado, 3 = rechazado)
      const id_estado = approve ? 2 : 3;
      const comentarioActualizado = await ComentarioModel.update(parseInt(commentId), { id_estado });
      
      res.json(comentarioActualizado);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Error al validar el comentario" 
      });
    }
  }
}

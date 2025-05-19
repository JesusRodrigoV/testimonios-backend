import type { Request, Response } from 'express';
import { ComentarioModel } from '../models/comentario.model';
import { Rol } from '@app/middleware/authorization';

export class ComentarioController {
  static async getAll(req: Request, res: Response) {
    try {
      if (req.user?.id_rol === Rol.ADMIN) { // solo los admins ven todos los comentarios
        const comentarios = await ComentarioModel.findAll();
        return res.json(comentarios);
      }

      const comentarios = await ComentarioModel.findApproved(); // si no es admin, solo ve los comentarios aprobados
      res.json(comentarios);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener los comentarios' });
    }
  }

  static async getPendingComments(req: Request, res: Response) {
    try {
      if (req.user?.id_rol !== Rol.ADMIN) { // solo el admin puede ver los comentarios pendientes
        return res.status(403).json({ error: 'No tiene permiso para ver comentarios pendientes' });
      }

      const comentarios = await ComentarioModel.findPending();
      res.json(comentarios);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener los comentarios pendientes' });
    }
  }

  static async getByTestimonioId(req: Request, res: Response) {
    try {
      const { id_testimonio } = req.params;

      if (!id_testimonio) {
        return res.status(400).json({ error: 'ID de testimonio requerido' });
      }

      const comentarios = await ComentarioModel.findByTestimonioId(parseInt(id_testimonio));
      res.json(comentarios);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener los comentarios del testimonio' });
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

      if (req.user?.id_rol !== Rol.ADMIN && comentario.id_estado !== 2) { // comentarios no aprobados no se ven
        return res.status(403).json({ error: 'No tiene permiso para ver este comentario' });
      }

      res.json(comentario);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener el comentario' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { contenido, id_testimonio, parent_id } = req.body;

      if (!contenido || !id_testimonio) {
        return res.status(400).json({ error: 'Contenido e ID de testimonio son requeridos' });
      }

      const comentario = await ComentarioModel.create({ // los comentarios nuevos tienen estado pendiente
        contenido,
        id_estado: 1, // Estado pendiente
        fecha_creacion: new Date(),
        creado_por_id_usuario: req.user!.id_usuario,
        id_testimonio,
        parent_id: parent_id ? parseInt(parent_id) : undefined,
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

      if (comentario.creado_por_id_usuario !== req.user!.id_usuario) { // si no es admin, solo el creador del comentario puede modificarlo
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

      if (req.user?.id_rol !== Rol.ADMIN && comentario.creado_por_id_usuario !== req.user!.id_usuario) { // solo el admin o el creador del comentario pueden eliminarlo
        return res.status(403).json({ error: 'No tiene permiso para eliminar este comentario' });
      }

      await ComentarioModel.delete(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar el comentario' });
    }
  }

  static async likeComment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'ID no proporcionado' });
      }
      const id_comentario = parseInt(id);
      const comentario = await ComentarioModel.findById(id_comentario);
      if (!comentario || comentario.id_estado !== 2) {
        return res.status(404).json({ error: 'Comentario no encontrado o no aprobado' });
      }
      await ComentarioModel.likeComment(id_comentario, req.user!.id_usuario);
      res.status(201).json({ message: 'Comentario marcado como me gusta' });
    } catch (error) {
      res.status(500).json({ error: 'Error al dar me gusta al comentario' });
    }
  }

  static async unlikeComment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'ID no proporcionado' });
      }
      const id_comentario = parseInt(id);
      const comentario = await ComentarioModel.findById(id_comentario);
      if (!comentario || comentario.id_estado !== 2) {
        return res.status(404).json({ error: 'Comentario no encontrado o no aprobado' });
      }
      await ComentarioModel.unlikeComment(id_comentario, req.user!.id_usuario);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Error al quitar me gusta al comentario' });
    }
  }
}
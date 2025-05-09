import type { Request, Response } from 'express';
import { NotificacionModel } from '../models/notificacion.model';
import { Rol } from '@app/middleware/authorization';

export class NotificacionController {
  static async getAll(req: Request, res: Response) {
    try {
      // Los usuarios solo ven sus propias notificaciones
      const notificaciones = await NotificacionModel.findByUsuario(req.user!.id_usuario);
      res.json(notificaciones);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener las notificaciones' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      if (!req.params.id) {
        return res.status(400).json({ error: 'ID no proporcionado' });
      }
      const id = parseInt(req.params.id);
      const notificacion = await NotificacionModel.findById(id);
      
      if (!notificacion) {
        return res.status(404).json({ error: 'Notificación no encontrada' });
      }

      // Verificar que el usuario tenga permiso para ver la notificación
      if (notificacion.id_usuario !== req.user!.id_usuario) {
        return res.status(403).json({ error: 'No tiene permiso para ver esta notificación' });
      }

      res.json(notificacion);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener la notificación' });
    }
  }

  static async marcarComoLeido(req: Request, res: Response) {
    try {
      if (!req.params.id) {
        return res.status(400).json({ error: 'ID no proporcionado' });
      }

      const id = parseInt(req.params.id);
      const notificacion = await NotificacionModel.findById(id);

      if (!notificacion) {
        return res.status(404).json({ error: 'Notificación no encontrada' });
      }

      // Verificar que el usuario tenga permiso para marcar la notificación como leída
      if (notificacion.id_usuario !== req.user!.id_usuario) {
        return res.status(403).json({ error: 'No tiene permiso para marcar esta notificación como leída' });
      }

      const notificacionActualizada = await NotificacionModel.marcarComoLeido(id);
      res.json(notificacionActualizada);
    } catch (error) {
      res.status(500).json({ error: 'Error al marcar la notificación como leída' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      if (!req.params.id) {
        return res.status(400).json({ error: 'ID no proporcionado' });
      }

      const id = parseInt(req.params.id);
      const notificacion = await NotificacionModel.findById(id);

      if (!notificacion) {
        return res.status(404).json({ error: 'Notificación no encontrada' });
      }

      // Verificar que el usuario tenga permiso para eliminar la notificación
      if (notificacion.id_usuario !== req.user!.id_usuario) {
        return res.status(403).json({ error: 'No tiene permiso para eliminar esta notificación' });
      }

      await NotificacionModel.delete(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar la notificación' });
    }
  }

  static async cambiarEstado(req: Request, res: Response) {
    try {
      if (!req.params.id) {
        return res.status(400).json({ error: 'ID no proporcionado' });
      }

      const id = parseInt(req.params.id);
      const { id_estado } = req.body;

      if (!id_estado) {
        return res.status(400).json({ error: 'Estado no proporcionado' });
      }

      const notificacion = await NotificacionModel.findById(id);

      if (!notificacion) {
        return res.status(404).json({ error: 'Notificación no encontrada' });
      }

      // Verificar que el usuario tenga permiso para cambiar el estado
      if (notificacion.id_usuario !== req.user!.id_usuario) {
        return res.status(403).json({ error: 'No tiene permiso para cambiar el estado de esta notificación' });
      }

      const notificacionActualizada = await NotificacionModel.cambiarEstado(id, id_estado);
      res.json(notificacionActualizada);
    } catch (error) {
      res.status(500).json({ error: 'Error al cambiar el estado de la notificación' });
    }
  }
}

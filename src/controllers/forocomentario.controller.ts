import type { Request, Response } from 'express';
import { ForoComentarioModel } from '../models/forocomentario.model';
import type { CustomJwtPayload } from '../middleware/authentication';
import prisma from '../lib/prisma';

export class ForoComentarioController {
  static async getAll(req: Request, res: Response) {
    try {
      const comentarios = await ForoComentarioModel.findAll();
      res.json(comentarios);
    } catch (error) {
      console.error('Error al obtener comentarios del foro:', error);
      res.status(500).json({ error: 'Error al obtener los comentarios del foro' });
    }
  }

  static async getByTemaId(req: Request, res: Response) {
    try {
      if (!req.params.temaId) {
        return res.status(400).json({ error: 'ID del tema no proporcionado' });
      }

      const temaId = parseInt(req.params.temaId);
      
      // Verificar que el tema existe
      const tema = await prisma.foro_temas.findUnique({
        where: { id_forotema: temaId }
      });

      if (!tema) {
        return res.status(404).json({ error: 'Tema no encontrado' });
      }

      const comentarios = await ForoComentarioModel.findByTemaId(temaId);
      res.json(comentarios);
    } catch (error) {
      console.error('Error al obtener comentarios del tema:', error);
      res.status(500).json({ error: 'Error al obtener los comentarios del tema' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      if (!req.params.id) {
        return res.status(400).json({ error: 'ID no proporcionado' });
      }

      const id = parseInt(req.params.id);
      const comentario = await ForoComentarioModel.findById(id);

      if (!comentario) {
        return res.status(404).json({ error: 'Comentario no encontrado' });
      }

      res.json(comentario);
    } catch (error) {
      console.error('Error al obtener comentario del foro:', error);
      res.status(500).json({ error: 'Error al obtener el comentario del foro' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const user = req.user as CustomJwtPayload;
      const { contenido, id_forotema, parent_id } = req.body;

      if (!contenido || !id_forotema) {
        return res.status(400).json({ 
          error: 'Contenido y ID del tema son requeridos' 
        });
      }

      // Verificar que el tema existe
      const tema = await prisma.foro_temas.findUnique({
        where: { id_forotema }
      });

      if (!tema) {
        return res.status(404).json({ error: 'Tema no encontrado' });
      }

      // Si es una respuesta a otro comentario, verificar que el comentario padre existe
      if (parent_id) {
        const comentarioPadre = await ForoComentarioModel.findById(parent_id);
        if (!comentarioPadre) {
          return res.status(404).json({ error: 'Comentario padre no encontrado' });
        }
      }

      const fecha_creacion = new Date();
      const comentario = await ForoComentarioModel.create({
        contenido,
        fecha_creacion,
        creado_por_id_usuario: user.id_usuario,
        id_forotema,
        parent_id
      });

      res.status(201).json(comentario);
    } catch (error) {
      console.error('Error al crear comentario del foro:', error);
      res.status(500).json({ error: 'Error al crear el comentario en el foro' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const user = req.user as CustomJwtPayload;
      if (!req.params.id) {
        return res.status(400).json({ error: 'ID no proporcionado' });
      }

      const id = parseInt(req.params.id);
      const comentario = await ForoComentarioModel.findById(id);

      if (!comentario) {
        return res.status(404).json({ error: 'Comentario no encontrado' });
      }

      // Verificar si el usuario es el creador del comentario
      if (comentario.creado_por_id_usuario !== user.id_usuario) {
        return res.status(403).json({ 
          error: 'No tienes permiso para modificar este comentario. Solo el creador puede modificarlo.' 
        });
      }

      const { contenido } = req.body;
      if (!contenido) {
        return res.status(400).json({ error: 'El contenido es requerido' });
      }

      const updatedComentario = await ForoComentarioModel.update(id, { contenido });
      res.json(updatedComentario);
    } catch (error) {
      console.error('Error al actualizar comentario del foro:', error);
      res.status(500).json({ error: 'Error al actualizar el comentario del foro' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const user = req.user as CustomJwtPayload;
      if (!req.params.id) {
        return res.status(400).json({ error: 'ID no proporcionado' });
      }

      const id = parseInt(req.params.id);
      const comentario = await ForoComentarioModel.findById(id);

      if (!comentario) {
        return res.status(404).json({ error: 'Comentario no encontrado' });
      }

      // Verificar si el usuario es el creador del comentario
      if (comentario.creado_por_id_usuario !== user.id_usuario) {
        return res.status(403).json({ 
          error: 'No tienes permiso para eliminar este comentario. Solo el creador puede eliminarlo.' 
        });
      }

      await ForoComentarioModel.delete(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error al eliminar comentario del foro:', error);
      res.status(500).json({ error: 'Error al eliminar el comentario del foro' });
    }
  }
}

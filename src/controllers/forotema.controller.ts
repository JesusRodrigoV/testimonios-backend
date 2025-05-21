import type { Request, Response } from 'express';
import { ForoTemaModel } from '../models/forotema.model';
import type { CustomJwtPayload } from '../middleware/authentication';
import prisma from '../lib/prisma';

export class ForoTemaController {
  static async getAll(req: Request, res: Response) {
    try {
      const forotemas = await ForoTemaModel.findAll();
      res.json(forotemas);
    } catch (error) {
      console.error('Error al obtener temas del foro:', error);
      res.status(500).json({ error: 'Error al obtener los temas del foro' });
    }
  }

  static async getMyTopics(req: Request, res: Response) {
    try {
      const user = req.user as CustomJwtPayload;
      const forotemas = await ForoTemaModel.findByUserId(user.id_usuario);
      res.json(forotemas);
    } catch (error) {
      console.error('Error al obtener mis temas del foro:', error);
      res.status(500).json({ error: 'Error al obtener mis temas del foro' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      if (!req.params.id) {
        return res.status(400).json({ error: 'ID no proporcionado' });
      }
      const id = parseInt(req.params.id);
      const forotema = await ForoTemaModel.findById(id);
      if (!forotema) {
        return res.status(404).json({ error: 'Tema no encontrado' });
      }
      res.json(forotema);
    } catch (error) {
      console.error('Error al obtener tema del foro:', error);
      res.status(500).json({ error: 'Error al obtener el tema del foro' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const user = req.user as CustomJwtPayload;
      const { titulo, descripcion, id_evento, id_testimonio } = req.body;

      // Validaciones básicas
      if (!titulo || !descripcion) {
        return res.status(400).json({ error: 'Título y descripción son requeridos' });
      }

      // Validar que al menos uno de los dos (testimonio o evento) esté presente
      if (!id_testimonio && !id_evento) {
        return res.status(400).json({ 
          error: 'Debe proporcionar al menos un testimonio o un evento histórico' 
        });
      }

      // Validar que el testimonio exista si se proporciona
      if (id_testimonio) {
        const testimonio = await prisma.testimonios.findUnique({
          where: { id_testimonio }
        });
        if (!testimonio) {
          return res.status(400).json({ error: 'El testimonio especificado no existe' });
        }
      }

      // Validar que el evento exista si se proporciona
      if (id_evento) {
        const evento = await prisma.eventos_historicos.findUnique({
          where: { id_evento }
        });
        if (!evento) {
          return res.status(400).json({ error: 'El evento histórico especificado no existe' });
        }
      }

      const fecha_creacion = new Date();
      const forotema = await ForoTemaModel.create({ 
        titulo, 
        descripcion, 
        fecha_creacion, 
        creado_por_id_usuario: user.id_usuario, 
        id_evento, 
        id_testimonio 
      });
      res.status(201).json(forotema);
    } catch (error) {
      console.error('Error al crear tema del foro:', error);
      res.status(500).json({ error: 'Error al crear el tema en el foro' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const user = req.user as CustomJwtPayload;
      if (!req.params.id) {
        return res.status(400).json({ error: 'ID no proporcionado' });
      }

      const id = parseInt(req.params.id);
      const forotema = await ForoTemaModel.findById(id);

      if (!forotema) {
        return res.status(404).json({ error: 'Tema no encontrado' });
      }

      // Verificar si el usuario es el creador del tema
      if (forotema.creado_por_id_usuario !== user.id_usuario) {
        return res.status(403).json({ 
          error: 'No tienes permiso para modificar este tema. Solo el creador puede modificarlo.' 
        });
      }

      const { titulo, descripcion, id_evento, id_testimonio } = req.body;

      // Validar que al menos uno de los dos (testimonio o evento) esté presente
      if (!id_testimonio && !id_evento) {
        return res.status(400).json({ 
          error: 'Debe proporcionar al menos un testimonio o un evento histórico' 
        });
      }

      // Validar que el testimonio exista si se proporciona
      if (id_testimonio) {
        const testimonio = await prisma.testimonios.findUnique({
          where: { id_testimonio }
        });
        if (!testimonio) {
          return res.status(400).json({ error: 'El testimonio especificado no existe' });
        }
      }

      // Validar que el evento exista si se proporciona
      if (id_evento) {
        const evento = await prisma.eventos_historicos.findUnique({
          where: { id_evento }
        });
        if (!evento) {
          return res.status(400).json({ error: 'El evento histórico especificado no existe' });
        }
      }

      const updatedForotema = await ForoTemaModel.update(id, { 
        titulo, 
        descripcion, 
        id_evento, 
        id_testimonio 
      });
      res.json(updatedForotema);
    } catch (error) {
      console.error('Error al actualizar tema del foro:', error);
      res.status(500).json({ error: 'Error al actualizar el tema del foro' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const user = req.user as CustomJwtPayload;
      if (!req.params.id) {
        return res.status(400).json({ error: 'ID no proporcionado' });
      }

      const id = parseInt(req.params.id);
      const forotema = await ForoTemaModel.findById(id);

      if (!forotema) {
        return res.status(404).json({ error: 'Tema no encontrado' });
      }

      // Verificar si el usuario es el creador del tema
      if (forotema.creado_por_id_usuario !== user.id_usuario) {
        return res.status(403).json({ 
          error: 'No tienes permiso para eliminar este tema. Solo el creador puede eliminarlo.' 
        });
      }

      // Verificar si el tema tiene comentarios
      const comentarios = await prisma.foro_comentarios.findMany({
        where: { id_forotema: id }
      });

      if (comentarios.length > 0) {
        return res.status(400).json({ 
          error: 'No se puede eliminar el tema porque tiene comentarios asociados. Primero elimine los comentarios.' 
        });
      }

      await ForoTemaModel.delete(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error al eliminar tema del foro:', error);
      res.status(500).json({ error: 'Error al eliminar el tema del foro' });
    }
  }
}

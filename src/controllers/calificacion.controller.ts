import type { Request, Response } from 'express';
import { CalificacionModel } from '../models/calificacion.model';

export class CalificacionController {
    static async getAll(req: Request, res: Response) {
        try {
            const calificaciones = await CalificacionModel.findAll();
            res.json(calificaciones);
        } catch (error) {
            console.error('Error en getAll:', error);
            res.status(500).json({ 
                error: 'Error al obtener las calificaciones',
                details: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
  
    static async getById(req: Request, res: Response) {
        try {
            if (!req.params.id) {
                return res.status(400).json({ error: 'ID no proporcionado' });
            }
            const id = parseInt(req.params.id);
            const calificacion = await CalificacionModel.findById(id);
            if (!calificacion) {
                return res.status(404).json({ error: 'Calificación no encontrada' });
            }
            res.json(calificacion);
        } catch (error) {
            console.error('Error en getById:', error);
            res.status(500).json({ 
                error: 'Error al obtener la calificación',
                details: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
  
    static async create(req: Request, res: Response) {
        try {
            if (!req.user?.id_usuario) {
                return res.status(401).json({ error: 'Usuario no autenticado' });
            }

            const { puntuacion, fecha, id_testimonio } = req.body;
            
            if (!puntuacion || !fecha || !id_testimonio) {
                return res.status(400).json({ 
                    error: 'Faltan campos requeridos',
                    required: ['puntuacion', 'fecha', 'id_testimonio']
                });
            }

            if (puntuacion < 1 || puntuacion > 5) {
                return res.status(400).json({ 
                    error: 'La puntuación debe estar entre 1 y 5'
                });
            }

            const calificacion = await CalificacionModel.create({ 
                puntuacion, 
                fecha: new Date(fecha), 
                id_usuario: req.user.id_usuario, 
                id_testimonio 
            });
            res.status(201).json(calificacion);
        } catch (error) {
            console.error('Error en create:', error);
            if (error instanceof Error && error.message === 'El usuario ya ha calificado este testimonio') {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ 
                error: 'Error al crear la calificación',
                details: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
  
    static async update(req: Request, res: Response) {
        try {
            if (!req.user?.id_usuario) {
                return res.status(401).json({ error: 'Usuario no autenticado' });
            }

            if (!req.params.id) {
                return res.status(400).json({ error: 'ID no proporcionado' });
            }
            const id = parseInt(req.params.id);
            const { puntuacion, fecha, id_testimonio } = req.body;
            const calificacion = await CalificacionModel.update(id, { 
                puntuacion, 
                fecha: fecha ? new Date(fecha) : undefined, 
                id_usuario: req.user.id_usuario, 
                id_testimonio 
            });
            res.json(calificacion);
        } catch (error) {
            console.error('Error en update:', error);
            res.status(500).json({ 
                error: 'Error al actualizar la calificación',
                details: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
  
    static async delete(req: Request, res: Response) {
        try {
            if (!req.user?.id_usuario) {
                return res.status(401).json({ error: 'Usuario no autenticado' });
            }

            if (!req.params.id) {
                return res.status(400).json({ error: 'ID no proporcionado' });
            }
            const id = parseInt(req.params.id);
            await CalificacionModel.delete(id);
            res.status(204).send();
        } catch (error) {
            console.error('Error en delete:', error);
            res.status(500).json({ 
                error: 'Error al eliminar la calificación',
                details: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
}
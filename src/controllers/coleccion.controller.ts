import type { Request, Response } from 'express';
import { ColeccionModel } from '../models/coleccion.model';
import { Rol } from '@app/middleware/authorization';
import prisma from 'src/lib/prisma';

export class ColeccionController {
    static async getAll(req: Request, res: Response) {
        try {
            if (req.user?.id_rol === Rol.ADMIN) { // solo los admins ven todas las colecciones
                const colecciones = await ColeccionModel.findAll();
                return res.json(colecciones);
            } else { // los usuarios normales ven solo sus propias colecciones
                const colecciones = await ColeccionModel.findByUserId(req.user!.id_usuario);
                return res.json(colecciones);
            }
        } catch (error) {
            res.status(500).json({ error: 'Error al obtener las colecciones' });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            if (!req.params.id) {
                return res.status(400).json({ error: 'ID no proporcionado' });
            }
            const id = parseInt(req.params.id);
            const coleccion = await ColeccionModel.findById(id);
            
            if (!coleccion) {
                return res.status(404).json({ error: 'Coleccion no encontrada' });
            }

            if (req.user?.id_rol !== Rol.ADMIN && coleccion.id_usuario !== req.user!.id_usuario) { // si no es admin, solo el creador de la colección puede verla
                return res.status(403).json({ error: 'No tiene permiso para ver esta colección' });
            }

            res.json(coleccion);
        } catch (error) {
            res.status(500).json({ error: 'Error al obtener la coleccion' });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const { titulo, descripcion, fecha_creacion, id_usuario } = req.body;
            
            const coleccion = await ColeccionModel.create({ 
                titulo, 
                descripcion,
                fecha_creacion: new Date(),
                id_usuario: req.user!.id_usuario,
            });
            
            res.status(201).json(coleccion);
        } catch (error) {
            res.status(500).json({ error: 'Error al crear la coleccion' });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            if (!req.params.id) {
                return res.status(400).json({ error: 'ID no proporcionado' });
            }

            const id = parseInt(req.params.id);
            const coleccion = await ColeccionModel.findById(id);

            if (!coleccion) {
                return res.status(404).json({ error: 'Coleccion no encontrada' });
            }

            if (coleccion.id_usuario !== req.user!.id_usuario) { // si no es admin, solo el creador de la coleccion puede modificarla
                return res.status(403).json({ error: 'No tiene permiso para modificar esta coleccion' });
            }

            const { titulo, descripcion, fecha_creacion, id_usuario } = req.body;
            const coleccionActualizada = await ColeccionModel.update(id, { titulo, descripcion, fecha_creacion, id_usuario });
            res.json(coleccionActualizada);
        } catch (error) {
            res.status(500).json({ error: 'Error al actualizar la coleccion' });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            if (!req.params.id) {
                return res.status(400).json({ error: 'ID no proporcionado' });
            }

            const id = parseInt(req.params.id);
            const coleccion = await ColeccionModel.findById(id);

            if (!coleccion) {
                return res.status(404).json({ error: 'Coleccion no encontrada' });
            }

            if (req.user?.id_rol !== Rol.ADMIN && coleccion.id_usuario !== req.user!.id_usuario) { // solo el admin o el creador de la coleccion pueden eliminarlo
                return res.status(403).json({ error: 'No tiene permiso para eliminar esta coleccion' });
            }

            await ColeccionModel.delete(id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Error al eliminar la coleccion' });
        }
    }

    static async addTestimonio(req: Request, res: Response) {
        try {
            const { id_coleccion, id_testimonio } = req.body;

            // Verificar que la colección existe y pertenece al usuario
            const coleccion = await ColeccionModel.findById(id_coleccion);
            if (!coleccion) {
                return res.status(404).json({ error: 'Colección no encontrada' });
            }

            if (req.user?.id_rol !== Rol.ADMIN && coleccion.id_usuario !== req.user!.id_usuario) {
                return res.status(403).json({ error: 'No tiene permiso para modificar esta colección' });
            }

            // Agregar el testimonio a la colección
            const coleccionTestimonio = await prisma.colecciones_testimonios.create({
                data: {
                    id_coleccion,
                    id_testimonio,
                    fecha_agregado: new Date()
                }
            });

            res.status(201).json(coleccionTestimonio);
        } catch (error) {
            res.status(500).json({ error: 'Error al agregar el testimonio a la colección' });
        }
    }

    static async removeTestimonio(req: Request, res: Response) {
        try {
            const { id_coleccion, id_testimonio } = req.params;
            
            if (!id_coleccion || !id_testimonio) {
                return res.status(400).json({ error: 'IDs no proporcionados' });
            }

            const coleccion = await ColeccionModel.findById(parseInt(id_coleccion));
            if (!coleccion) {
                return res.status(404).json({ error: 'Colección no encontrada' });
            }

            if (req.user?.id_rol !== Rol.ADMIN && coleccion.id_usuario !== req.user!.id_usuario) {
                return res.status(403).json({ error: 'No tiene permiso para modificar esta colección' });
            }

            // Eliminar el testimonio de la colección
            await prisma.colecciones_testimonios.delete({
                where: {
                    id_coleccion_id_testimonio: {
                        id_coleccion: parseInt(id_coleccion),
                        id_testimonio: parseInt(id_testimonio)
                    }
                }
            });

            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Error al eliminar el testimonio de la colección' });
        }
    }

    static async getTestimonios(req: Request, res: Response) {
        try {
            const { id } = req.params;
            
            if (!id) {
                return res.status(400).json({ error: 'ID no proporcionado' });
            }

            const coleccion = await ColeccionModel.findById(parseInt(id));
            if (!coleccion) {
                return res.status(404).json({ error: 'Colección no encontrada' });
            }

            if (req.user?.id_rol !== Rol.ADMIN && coleccion.id_usuario !== req.user!.id_usuario) {
                return res.status(403).json({ error: 'No tiene permiso para ver esta colección' });
            }

            // Obtener los testimonios de la colección
            const testimonios = await prisma.colecciones_testimonios.findMany({
                where: {
                    id_coleccion: parseInt(id)
                },
                include: {
                    testimonios: true
                }
            });

            res.json(testimonios);
        } catch (error) {
            res.status(500).json({ error: 'Error al obtener los testimonios de la colección' });
        }
    }
}
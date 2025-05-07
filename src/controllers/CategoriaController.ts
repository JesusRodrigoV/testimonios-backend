import type { Request, Response } from 'express';
import { CategoriaModel } from '../models/CategoriaModel';

export class CategoriaController {
  static async getAll(req: Request, res: Response) {
    try {
      const categorias = await CategoriaModel.findAll();
      res.json(categorias);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener las categorías' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      if (!req.params.id) {
        return res.status(400).json({ error: 'ID no proporcionado' });
      }
      const id = parseInt(req.params.id);
      const categoria = await CategoriaModel.findById(id);
      if (!categoria) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }
      res.json(categoria);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener la categoría' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { nombre, descripcion } = req.body;
      const categoria = await CategoriaModel.create({ nombre, descripcion });
      res.status(201).json(categoria);
    } catch (error) {
      res.status(500).json({ error: 'Error al crear la categoría' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      if (!req.params.id) {
        return res.status(400).json({ error: 'ID no proporcionado' });
      }
      const id = parseInt(req.params.id);
      const { nombre, descripcion } = req.body;
      const categoria = await CategoriaModel.update(id, { nombre, descripcion });
      res.json(categoria);
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar la categoría' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      if (!req.params.id) {
        return res.status(400).json({ error: 'ID no proporcionado' });
      }
      const id = parseInt(req.params.id);
      await CategoriaModel.delete(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar la categoría' });
    }
  }
}

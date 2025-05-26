import express from 'express';
import type { RequestHandler } from 'express';
import { CategoriaController } from '../controllers/CategoriaController';

export const categoriaRouter = express.Router();

categoriaRouter.get('/', CategoriaController.getAll as RequestHandler);
categoriaRouter.get('/:id', CategoriaController.getById as RequestHandler);
categoriaRouter.post('/', CategoriaController.create as RequestHandler);
categoriaRouter.put('/:id', CategoriaController.update as RequestHandler);
categoriaRouter.delete('/:id', CategoriaController.delete as RequestHandler);
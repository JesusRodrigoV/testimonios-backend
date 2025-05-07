import express from 'express';
import type { RequestHandler } from 'express';
import { CategoriaController } from '../controllers/CategoriaController';

const router = express.Router();

router.get('/', CategoriaController.getAll as RequestHandler);
router.get('/:id', CategoriaController.getById as RequestHandler);
router.post('/', CategoriaController.create as RequestHandler);
router.put('/:id', CategoriaController.update as RequestHandler);
router.delete('/:id', CategoriaController.delete as RequestHandler);

export default router;

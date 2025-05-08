import express from 'express';
import type { RequestHandler } from 'express';
import { ComentarioController } from '../controllers/comentario.controller';
import { authenticateToken } from '@app/middleware/authentication';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', ComentarioController.getAll as RequestHandler);
router.get('/:id', ComentarioController.getById as RequestHandler);
router.post('/', ComentarioController.create as RequestHandler);
router.put('/:id', ComentarioController.update as RequestHandler);
router.delete('/:id', ComentarioController.delete as RequestHandler);

export default router;

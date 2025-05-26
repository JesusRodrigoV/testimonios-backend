import express from 'express';
import type { RequestHandler } from 'express';
import { ForoComentarioController } from '../controllers/forocomentario.controller';
import { authenticateToken } from '../middleware/authentication';
import { logActivity } from '@app/middleware/activityLog';

export const forocomentarioRouter = express.Router();

forocomentarioRouter.use(logActivity);
forocomentarioRouter.get('/', authenticateToken, ForoComentarioController.getAll as RequestHandler);
forocomentarioRouter.get('/tema/:temaId', authenticateToken, ForoComentarioController.getByTemaId as RequestHandler);
forocomentarioRouter.get('/:id', authenticateToken, ForoComentarioController.getById as RequestHandler);
forocomentarioRouter.post('/', authenticateToken, ForoComentarioController.create as RequestHandler);
forocomentarioRouter.put('/:id', authenticateToken, ForoComentarioController.update as RequestHandler);
forocomentarioRouter.delete('/:id', authenticateToken, ForoComentarioController.delete as RequestHandler);
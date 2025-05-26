import express from 'express';
import type { RequestHandler } from 'express';
import { ComentarioController } from '../controllers/comentario.controller';
import { authenticateToken } from '@app/middleware/authentication';

export const comentarioRouter = express.Router();

comentarioRouter.use(authenticateToken);

comentarioRouter.get('/', ComentarioController.getAll as RequestHandler);
comentarioRouter.get('/pending', ComentarioController.getPendingComments as RequestHandler);
comentarioRouter.get('/testimonio/:id_testimonio', ComentarioController.getByTestimonioId as RequestHandler);
comentarioRouter.get('/:id', ComentarioController.getById as RequestHandler);
comentarioRouter.post('/', ComentarioController.create as RequestHandler);
comentarioRouter.put('/:id', ComentarioController.update as RequestHandler);
comentarioRouter.delete('/:id', ComentarioController.delete as RequestHandler);
comentarioRouter.post('/:id/like', ComentarioController.likeComment as RequestHandler);
comentarioRouter.delete('/:id/like', ComentarioController.unlikeComment as RequestHandler);

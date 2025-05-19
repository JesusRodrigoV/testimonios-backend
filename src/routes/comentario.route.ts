import express from 'express';
import type { RequestHandler } from 'express';
import { ComentarioController } from '../controllers/comentario.controller';
import { authenticateToken } from '@app/middleware/authentication';

const router = express.Router();

router.use(authenticateToken); // autenticación requerida para todas las rutas

router.get('/', ComentarioController.getAll as RequestHandler);
router.get('/pending', ComentarioController.getPendingComments as RequestHandler);
router.get('/testimonio/:id_testimonio', ComentarioController.getByTestimonioId as RequestHandler);
router.get('/:id', ComentarioController.getById as RequestHandler);
router.post('/', ComentarioController.create as RequestHandler);
router.put('/:id', ComentarioController.update as RequestHandler);
router.delete('/:id', ComentarioController.delete as RequestHandler);
router.post('/:id/like', ComentarioController.likeComment as RequestHandler);
router.delete('/:id/like', ComentarioController.unlikeComment as RequestHandler);

export default router;

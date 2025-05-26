import express from 'express';
import type { RequestHandler } from 'express';
import { ColeccionController } from '../controllers/coleccion.controller';
import { authenticateToken } from '@app/middleware/authentication';

export const coleccionRouter = express.Router();

coleccionRouter.use(authenticateToken);

coleccionRouter.get('/', ColeccionController.getAll as RequestHandler);
coleccionRouter.get('/:id', ColeccionController.getById as RequestHandler);
coleccionRouter.post('/', ColeccionController.create as RequestHandler);
coleccionRouter.put('/:id', ColeccionController.update as RequestHandler);
coleccionRouter.delete('/:id', ColeccionController.delete as RequestHandler);

coleccionRouter.post('/testimonios', ColeccionController.addTestimonio as RequestHandler);
coleccionRouter.delete('/:id_coleccion/testimonios/:id_testimonio', ColeccionController.removeTestimonio as RequestHandler);
coleccionRouter.get('/:id/testimonios', ColeccionController.getTestimonios as RequestHandler);
coleccionRouter.get('/favorites/ids', ColeccionController.getFavoriteTestimonyIds as RequestHandler);
coleccionRouter.get('/favorite-count/:id', ColeccionController.getFavoriteCount as RequestHandler);
import express from 'express';
import type { RequestHandler } from 'express';
import { ColeccionController } from '../controllers/coleccion.controller';
import { authenticateToken } from '@app/middleware/authentication';

const router = express.Router();

router.use(authenticateToken); // autenticación requerida para todas las rutas

router.get('/', ColeccionController.getAll as RequestHandler);
router.get('/:id', ColeccionController.getById as RequestHandler);
router.post('/', ColeccionController.create as RequestHandler);
router.put('/:id', ColeccionController.update as RequestHandler);
router.delete('/:id', ColeccionController.delete as RequestHandler);

// rutas para manejar testimonios en colecciones
router.post('/testimonios', ColeccionController.addTestimonio as RequestHandler);
router.delete('/:id_coleccion/testimonios/:id_testimonio', ColeccionController.removeTestimonio as RequestHandler);
router.get('/:id/testimonios', ColeccionController.getTestimonios as RequestHandler);
router.get('/favorites/ids', ColeccionController.getFavoriteTestimonyIds as RequestHandler);
router.get('/favorite-count/:id', ColeccionController.getFavoriteCount as RequestHandler);

export default router;
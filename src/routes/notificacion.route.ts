import express from 'express';
import type { RequestHandler } from 'express';
import { NotificacionController } from '../controllers/notificacion.controller';
import { authenticateToken } from '@app/middleware/authentication';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', NotificacionController.getAll as RequestHandler);
router.get('/:id', NotificacionController.getById as RequestHandler);
router.put('/:id/leer', NotificacionController.marcarComoLeido as RequestHandler);
router.put('/:id/estado', NotificacionController.cambiarEstado as RequestHandler);
router.delete('/:id', NotificacionController.delete as RequestHandler);

export default router;

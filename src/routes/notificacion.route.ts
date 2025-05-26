import express from 'express';
import type { RequestHandler } from 'express';
import { NotificacionController } from '../controllers/notificacion.controller';
import { authenticateToken } from '@app/middleware/authentication';

export const notificacionRouter = express.Router();

notificacionRouter.use(authenticateToken);

notificacionRouter.get('/', NotificacionController.getAll as RequestHandler);
notificacionRouter.get('/unread', NotificacionController.getUnread as RequestHandler);
notificacionRouter.get('/:id', NotificacionController.getById as RequestHandler);
notificacionRouter.put('/:id/leer', NotificacionController.marcarComoLeido as RequestHandler);
notificacionRouter.put('/:id/estado', NotificacionController.cambiarEstado as RequestHandler);
notificacionRouter.delete('/:id', NotificacionController.delete as RequestHandler);
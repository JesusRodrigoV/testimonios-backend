import express from 'express';
import type { RequestHandler } from 'express';
import { CalificacionController } from '../controllers/calificacion.controller';
import { authenticateToken } from '@app/middleware/authentication';

export const calificacionRouter = express.Router();

calificacionRouter.get('/top-rated', CalificacionController.getTopRated as RequestHandler);
calificacionRouter.get('/', authenticateToken,  CalificacionController.getAll as RequestHandler);
calificacionRouter.get('/:id', authenticateToken, CalificacionController.getById as RequestHandler);
calificacionRouter.post('/', authenticateToken, CalificacionController.create as RequestHandler);
calificacionRouter.put('/:id',authenticateToken,  CalificacionController.update as RequestHandler);
calificacionRouter.delete('/:id',authenticateToken,  CalificacionController.delete as RequestHandler);


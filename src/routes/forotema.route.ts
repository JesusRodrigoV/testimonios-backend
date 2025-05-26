import express from 'express';
import type { RequestHandler } from 'express';
import { ForoTemaController } from '../controllers/forotema.controller';
import { authenticateToken } from '../middleware/authentication';
import { logActivity } from '@app/middleware/activityLog';

export const forotemaRouter = express.Router();

forotemaRouter.use(logActivity);
forotemaRouter.get('/', authenticateToken, ForoTemaController.getAll as RequestHandler);
forotemaRouter.get('/mytopics', authenticateToken, ForoTemaController.getMyTopics as RequestHandler);
forotemaRouter.get('/:id', authenticateToken, ForoTemaController.getById as RequestHandler);
forotemaRouter.post('/', authenticateToken, ForoTemaController.create as RequestHandler);
forotemaRouter.put('/:id', authenticateToken, ForoTemaController.update as RequestHandler);
forotemaRouter.delete('/:id', authenticateToken, ForoTemaController.delete as RequestHandler);

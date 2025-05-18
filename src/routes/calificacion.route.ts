import express from 'express';
import type { RequestHandler } from 'express';
import { CalificacionController } from '../controllers/calificacion.controller';
import { authenticateToken } from '@app/middleware/authentication';

const router = express.Router();

router.use(authenticateToken);

router.get('/', CalificacionController.getAll as RequestHandler);
router.get('/:id', CalificacionController.getById as RequestHandler);
router.post('/', CalificacionController.create as RequestHandler);
router.put('/:id', CalificacionController.update as RequestHandler);
router.delete('/:id', CalificacionController.delete as RequestHandler);

export default router;

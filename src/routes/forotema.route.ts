import express from 'express';
import type { RequestHandler } from 'express';
import { ForoTemaController } from '../controllers/forotema.controller';
import { authenticateToken } from '../middleware/authentication';

const router = express.Router();

router.get('/', authenticateToken, ForoTemaController.getAll as RequestHandler);
router.get('/mytopics', authenticateToken, ForoTemaController.getMyTopics as RequestHandler);
router.get('/:id', authenticateToken, ForoTemaController.getById as RequestHandler);
router.post('/', authenticateToken, ForoTemaController.create as RequestHandler);
router.put('/:id', authenticateToken, ForoTemaController.update as RequestHandler);
router.delete('/:id', authenticateToken, ForoTemaController.delete as RequestHandler);

export default router;

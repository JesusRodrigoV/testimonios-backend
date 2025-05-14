import { Router } from 'express';
import { TranscripcionController } from '../controllers/transcripcion.controller';
import { authenticateToken } from '@app/middleware/authentication';

const router = Router();
const transcripcionController = new TranscripcionController();

router.use(authenticateToken);

router.post(
  '/:testimonioId/transcribir',
  transcripcionController.transcribirArchivo
);

router.get(
  '/transcripciones/:id',
  transcripcionController.obtenerTranscripcion
);

router.get(
  '/:testimonioId/transcripciones',
  transcripcionController.obtenerTranscripcionesPorTestimonio
);

export default router;

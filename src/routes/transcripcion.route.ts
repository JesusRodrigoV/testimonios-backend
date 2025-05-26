import { Router } from 'express';
import { TranscripcionController } from '../controllers/transcripcion.controller';
import { authenticateToken } from '@app/middleware/authentication';
import { logActivity } from '@app/middleware/activityLog';

export const transcripcionRouter = Router();
const transcripcionController = new TranscripcionController();

transcripcionRouter.use(authenticateToken);

transcripcionRouter.use(logActivity);
transcripcionRouter.post(
  '/:testimonioId/transcribir',
  transcripcionController.transcribirArchivo
);
transcripcionRouter.get(
  '/transcripciones/:id',
  transcripcionController.obtenerTranscripcion
);
transcripcionRouter.get(
  '/:testimonioId/transcripciones',
  transcripcionController.obtenerTranscripcionesPorTestimonio
);

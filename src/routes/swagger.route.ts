import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec, swaggerUiOptions } from '../config/swagger';

export const swaggerRouter = Router();

swaggerRouter.use('/', swaggerUi.serve);
swaggerRouter.get('/', swaggerUi.setup(swaggerSpec, swaggerUiOptions)); 
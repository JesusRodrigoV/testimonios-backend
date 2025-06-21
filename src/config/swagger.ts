import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Testimonios',
      version: '1.0.0',
      description: 'Documentación de la API de Testimonios',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: ['./src/routes/*.ts'], // archivos que contienen las anotaciones
};

export const swaggerSpec = swaggerJsdoc(options);

export const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "API de Testimonios - Documentación",
  customfavIcon: "/favicon.ico",
  swaggerOptions: {
    persistAuthorization: true,
  },
}; 
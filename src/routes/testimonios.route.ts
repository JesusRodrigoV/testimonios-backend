import express from 'express';
import type { RequestHandler } from 'express';
import { TestimonyController } from "@app/controllers/media.controller";
import { authenticateToken } from "@app/middleware/authentication";
import { authorizeRoles } from "@app/middleware/authorization";
import { Rol } from "@app/models";
import { logActivity } from '@app/middleware/activityLog';

export const testimoniosRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Testimonios
 *   description: API para gestionar testimonios
 */

/**
 * @swagger
 * /testimonios:
 *   post:
 *     summary: Crear un nuevo testimonio
 *     tags: [Testimonios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Testimonio creado exitosamente
 *       401:
 *         description: No autorizado
 */
testimoniosRouter.post("/", authenticateToken, TestimonyController.create as RequestHandler);

/**
 * @swagger
 * /testimonios/validate:
 *   post:
 *     summary: Validar un testimonio
 *     tags: [Testimonios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Testimonio validado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 */
testimoniosRouter.post(
  "/validate",
  authenticateToken,
  authorizeRoles(Rol.ADMIN, Rol.CURATOR),
  TestimonyController.validate as RequestHandler,
);
testimoniosRouter.patch("/:id", authenticateToken, TestimonyController.update as RequestHandler);
testimoniosRouter.delete(
  "/:id",
  authenticateToken,
  authorizeRoles(Rol.ADMIN, Rol.CURATOR),
  TestimonyController.delete as RequestHandler,
);
testimoniosRouter.get("/count", TestimonyController.getCount as RequestHandler);
testimoniosRouter.get("/map/data", TestimonyController.getMapData as RequestHandler);
testimoniosRouter.get("/categories", TestimonyController.getAllCategories as RequestHandler);
testimoniosRouter.get("/media-types", authenticateToken, TestimonyController.getAllMediaTypes as RequestHandler);
testimoniosRouter.get("/statuses", authenticateToken, TestimonyController.getAllStatuses as RequestHandler);
testimoniosRouter.get("/my-uploads/count", authenticateToken, TestimonyController.getCountByUserId as RequestHandler);
testimoniosRouter.get("/my-uploads", authenticateToken, TestimonyController.getByUserId as RequestHandler);
testimoniosRouter.get("/", authenticateToken, TestimonyController.search as RequestHandler);
/**
 * @swagger
 * /testimonios/{id}:
 *   get:
 *     summary: Obtener un testimonio por ID
 *     tags: [Testimonios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Testimonio encontrado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Testimonio no encontrado
 */
testimoniosRouter.get("/:id", authenticateToken, TestimonyController.getById as RequestHandler);
testimoniosRouter.get("/:id/versions", authenticateToken, TestimonyController.getVersions as RequestHandler);

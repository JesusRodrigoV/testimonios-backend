import express from 'express';
import type { RequestHandler } from 'express';
import { TestimonyController } from "@app/controllers/media.controller";
import { authenticateToken } from "@app/middleware/authentication";
import { authorizeRoles } from "@app/middleware/authorization";
import { Rol } from "@app/models";
import { logActivity } from '@app/middleware/activityLog';

export const testimoniosRouter = express.Router();

testimoniosRouter.use(logActivity);
testimoniosRouter.post("/", authenticateToken, TestimonyController.create as RequestHandler);
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
testimoniosRouter.get("/my-uploads", authenticateToken, TestimonyController.getByUserId as RequestHandler);
testimoniosRouter.get("/", authenticateToken, TestimonyController.search as RequestHandler);
testimoniosRouter.get("/:id", authenticateToken, TestimonyController.getById as RequestHandler);
testimoniosRouter.get("/:id/versions", authenticateToken, TestimonyController.getVersions as RequestHandler);

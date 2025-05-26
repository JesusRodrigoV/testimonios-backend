import express from 'express';
import type { RequestHandler } from 'express';
import { TestimonyController } from "@app/controllers/media.controller";
import { authenticateToken } from "@app/middleware/authentication";
import { authorizeRoles } from "@app/middleware/authorization";
import { Rol } from "@app/models";

const router = express.Router();

router.post("/", authenticateToken, TestimonyController.create as RequestHandler);
router.post(
  "/validate",
  authenticateToken,
  authorizeRoles(Rol.ADMIN, Rol.CURATOR),
  TestimonyController.validate as RequestHandler,
);
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles(Rol.ADMIN, Rol.CURATOR),
  TestimonyController.delete as RequestHandler,
);
router.get("/count", TestimonyController.getCount as RequestHandler);
router.get("/map/data", TestimonyController.getMapData as RequestHandler);
router.get("/categories", TestimonyController.getAllCategories as RequestHandler);
router.get("/media-types", authenticateToken, TestimonyController.getAllMediaTypes as RequestHandler);
router.get("/statuses", authenticateToken, TestimonyController.getAllStatuses as RequestHandler);
router.get("/my-uploads", authenticateToken, TestimonyController.getByUserId as RequestHandler);
router.get("/", authenticateToken, TestimonyController.search as RequestHandler);
router.get("/:id", authenticateToken, TestimonyController.getById as RequestHandler);
router.get("/:id/versions", authenticateToken, TestimonyController.getVersions as RequestHandler);


export default router;

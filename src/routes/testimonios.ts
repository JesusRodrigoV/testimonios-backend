import express from "express";
import {
  createTestimony,
  getTestimony,
  searchTestimonies,
  validateTestimony,
  getTestimonyVersions,
  getTestimonyMap,
  deleteTestimony,
} from "@app/controllers/media";
import { authenticateToken } from "@app/middleware/authentication";
import { authorizeRoles } from "@app/middleware/authorization";
import { Rol } from "@app/models";

const router = express.Router();

router.post("/", authenticateToken, createTestimony);
router.post(
  "/validate",
  authenticateToken,
  authorizeRoles(Rol.ADMIN, Rol.CURATOR),
  validateTestimony,
);
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles(Rol.ADMIN, Rol.CURATOR),
  deleteTestimony,
);

router.get("/:id", getTestimony);
router.get("/", searchTestimonies);
router.get("/:id/versions", getTestimonyVersions);
router.get("/map/data", getTestimonyMap);

export default router;

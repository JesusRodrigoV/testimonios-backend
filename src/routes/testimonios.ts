import express from "express";
import {
  createTestimony,
  getTestimony,
  searchTestimonies,
  validateTestimony,
  getTestimonyVersions,
  getTestimonyMap,
  deleteTestimony,
  getAllCategories,
  getAllMediaTypes,
  getAllStatuses,
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
router.get("/:id", authenticateToken, getTestimony);
router.get("/", authenticateToken, searchTestimonies);
router.get("/:id/versions", authenticateToken, getTestimonyVersions);
router.get("/map/data", authenticateToken, getTestimonyMap);
router.get("/categories", getAllCategories);
router.get("/media-types", authenticateToken, getAllMediaTypes);
router.get("/statuses", authenticateToken, getAllStatuses);

export default router;

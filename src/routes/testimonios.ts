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
  getTestimonyCount,
  getTestimoniesByUserId,
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
router.get("/count", getTestimonyCount);
router.get("/:id", authenticateToken, getTestimony);
router.get("/", authenticateToken, searchTestimonies);
router.get("/:id/versions", authenticateToken, getTestimonyVersions);
router.get("/map/data", getTestimonyMap);
router.get("/categories", getAllCategories);
router.get("/media-types", authenticateToken, getAllMediaTypes);
router.get("/statuses", authenticateToken, getAllStatuses);
router.get("/my-uploads", authenticateToken, getTestimoniesByUserId);

export default router;

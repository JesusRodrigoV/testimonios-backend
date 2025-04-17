import express from "express";
import {
  uploadFromUrl,
  createTestimonio,
  getTestimonioOptions,
  validarTestimonio,
} from "../controllers/mediaController";
import { authenticateToken } from "@app/middleware/authentication";
import { authorizeRoles } from "@app/middleware/authorization";
import { Rol } from "@app/middleware/authorization";

const testimoniosRouter = express.Router();

testimoniosRouter.get("/opciones", authenticateToken, getTestimonioOptions);

testimoniosRouter.post(
  "/upload-from-url",
  authenticateToken,
  authorizeRoles(Rol.ADMIN, Rol.CURADOR, Rol.INVESTIGADOR),
  uploadFromUrl,
);

testimoniosRouter.post(
  "/testimonio",
  authenticateToken,
  authorizeRoles(Rol.ADMIN, Rol.CURADOR, Rol.INVESTIGADOR),
  createTestimonio,
);

testimoniosRouter.patch(
  "/testimonio/:id_testimonio/validar",
  authenticateToken,
  authorizeRoles(Rol.ADMIN, Rol.CURADOR),
  validarTestimonio,
);

export default testimoniosRouter;

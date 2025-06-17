import { Router } from "express";
import { Rol } from "@app/models";
import { authorizeRoles } from "@app/middleware/authorization";
import {
  allow2FAVerification,
  authenticateToken,
} from "@app/middleware/authentication";
import { logActivity } from "@app/middleware/activityLog";
import { AuthController } from "@app/controllers/auth.controller";

export const authRouter = Router();

authRouter.use(logActivity);
authRouter.get("/profile", authenticateToken, AuthController.authProfile);
authRouter.get("/user-info/:id", authenticateToken, AuthController.getUserInfo);
authRouter.post("/register", AuthController.authRegister);
authRouter.post(
  "/users",
  authenticateToken,
  authorizeRoles(Rol.ADMIN),
  AuthController.adminPostUsers
);
authRouter.get(
  "/users",
  authenticateToken,
  authorizeRoles(Rol.ADMIN),
  AuthController.adminGetUsers
);
authRouter.patch(
  "/users/:id",
  authenticateToken,
  authorizeRoles(Rol.ADMIN),
  AuthController.adminPatchUsers
);
authRouter.patch("/profile", authenticateToken, AuthController.updateProfile);
authRouter.delete(
  "/users/:id",
  authenticateToken,
  authorizeRoles(Rol.ADMIN),
  AuthController.adminDeleteUsers
);
authRouter.post("/login", AuthController.login);
authRouter.post("/forgot-password", AuthController.forgot_password);
authRouter.post("/reset-password", AuthController.reset_password);
authRouter.post("/setup-2fa", authenticateToken, AuthController.setup2FA);
authRouter.post("/verify-2fa", allow2FAVerification, AuthController.verify2FA);
authRouter.post("/logout", authenticateToken, AuthController.logout);
authRouter.post("/refresh", AuthController.refresh);

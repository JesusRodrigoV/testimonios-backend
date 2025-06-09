//routes/auth.ts
import { Router } from "express";
import { Rol } from "@app/models";
import { authorizeRoles } from "@app/middleware/authorization";
import {
  allow2FAVerification,
  authenticateToken,
} from "@app/middleware/authentication";
import { logActivity } from "@app/middleware/activityLog";
import {
  adminDeleteUsers,
  adminGetUsers,
  adminPostUsers,
  adminPutUsers,
  authProfile,
  authRegister,
  forgot_password,
  getUserInfo,
  login,
  logout,
  refresh,
  reset_password,
  setup2FA,
  updateProfile,
  verify2FA,
} from "@app/controllers/auth.controller";

export const authRouter = Router();

authRouter.use(logActivity);
authRouter.get("/profile", authenticateToken, authProfile);
authRouter.get("/user-info/:id", authenticateToken, getUserInfo);
authRouter.post("/register", authRegister);
authRouter.post(
  "/users",
  authenticateToken,
  authorizeRoles(Rol.ADMIN),
  adminPostUsers,
);
authRouter.get(
  "/users",
  authenticateToken,
  authorizeRoles(Rol.ADMIN),
  adminGetUsers,
);
authRouter.patch(
  "/users/:id",
  authenticateToken,
  authorizeRoles(Rol.ADMIN),
  adminPutUsers,
);
authRouter.patch(
  "/profile",
  authenticateToken,
  updateProfile,
);
authRouter.delete(
  "/users/:id",
  authenticateToken,
  authorizeRoles(Rol.ADMIN),
  adminDeleteUsers,
);
authRouter.post("/login", login);
authRouter.post("/forgot-password", forgot_password);
authRouter.post("/reset-password", reset_password);
authRouter.post(
  "/setup-2fa",
  authenticateToken,
  setup2FA,
);
authRouter.post("/verify-2fa", allow2FAVerification, verify2FA);
authRouter.post("/logout", authenticateToken, logout);
authRouter.post("/refresh", refresh);

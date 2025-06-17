import { expect, test, mock, spyOn, describe, beforeEach } from "bun:test";
import { AuthController } from "@app/controllers/auth.controller";
import type { Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";

// Mocks globales para speakeasy y qrcode
mock.module("speakeasy", () => ({
  generateSecret: mock(() => ({
    base32: "test_2fa_secret",
  })),
  otpauthURL: mock(() => "otpauth://totp/TestimoniosApp:test@example.com"),
}));
mock.module("qrcode", () => ({
  toDataURL: mock(() => Promise.resolve("data:image/png;base64,test_qrcode")),
}));

interface UserPayload extends JwtPayload {
  id_usuario: number;
  id_rol: number;
  email?: string;
}

interface MockResponse extends Response {
  _body?: any;
  _cookies?: Record<string, { value: string; options?: any }>;
}

const mockPrisma = await import("@app/lib/prisma");
const mockJwt = await import("jsonwebtoken");
const mockEmail = await import("@app/lib/email");
const mockBcrypt = await import("bcryptjs");

describe("Controlador de Autenticación", () => {
  let req: Partial<Request>;
  let res: MockResponse;
  let jsonSpy: ReturnType<typeof spyOn>;
  let statusSpy: ReturnType<typeof spyOn>;
  let cookieSpy: ReturnType<typeof spyOn>;
  let clearCookieSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    req = {};
    res = {
      status: mock((code: number) => {
        res.statusCode = code;
        return res;
      }),
      json: mock((data: any) => {
        res._body = data;
        return res;
      }),
      cookie: mock((name: string, value: string, options: any) => {
        res._cookies = res._cookies || {};
        res._cookies[name] = { value, options };
        return res;
      }),
      clearCookie: mock((name: string, options?: any) => {
        res._cookies = res._cookies || {};
        delete res._cookies[name];
        return res;
      }),
      statusCode: 200,
      _body: undefined,
      _cookies: {},
    } as unknown as MockResponse;

    jsonSpy = spyOn(res, "json");
    statusSpy = spyOn(res, "status");
    cookieSpy = spyOn(res, "cookie");
    clearCookieSpy = spyOn(res, "clearCookie");

    // Resetear mocks globales
    (mockPrisma.default.usuarios.findUnique as any).mockReset();
    (mockPrisma.default.usuarios.findFirst as any).mockReset();
    (mockPrisma.default.usuarios.create as any).mockReset();
    (mockPrisma.default.usuarios.update as any).mockReset();
    (mockPrisma.default.usuarios.delete as any).mockReset();
    (mockPrisma.default.refresh_tokens.create as any).mockReset();
    (mockPrisma.default.refresh_tokens.findFirst as any).mockReset();
    (mockPrisma.default.refresh_tokens.deleteMany as any).mockReset();
    (mockPrisma.default.colecciones.create as any).mockReset();
    (mockPrisma.default.colecciones.deleteMany as any).mockReset();
    (mockPrisma.default.logs.deleteMany as any).mockReset();
    (mockPrisma.default.$transaction as any).mockReset();
    (mockBcrypt.compare as any).mockReset();
    (mockBcrypt.hash as any).mockReset();
    (mockJwt.sign as any).mockReset();
    (mockJwt.verify as any).mockReset();
    (mockEmail.send2FASetupEmail as any).mockReset();
  });

  describe("authProfile", () => {
    test("debe devolver el perfil del usuario cuando está autorizado", async () => {
      req.user = { id_usuario: 1, id_rol: 4 } as UserPayload;
      const mockUser = {
        id_usuario: 1,
        email: "test@example.com",
        nombre: "Usuario de Prueba",
        biografia: "Bio",
        id_rol: 4,
        two_factor_enabled: false,
        profile_image: null,
      };
      (mockPrisma.default.usuarios.findUnique as any).mockResolvedValue(mockUser);

      await AuthController.authProfile(req as Request, res);

      expect(res.statusCode).toBe(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        id_usuario: 1,
        email: "test@example.com",
        nombre: "Usuario de Prueba",
        biografia: "Bio",
        role: 4,
        two_factor_enabled: false,
        profile_image: null,
      });
      expect(mockPrisma.default.usuarios.findUnique).toHaveBeenCalledWith({
        where: { id_usuario: 1 },
        select: {
          id_usuario: true,
          email: true,
          nombre: true,
          biografia: true,
          id_rol: true,
          two_factor_enabled: true,
          profile_image: true,
        },
      });
    });

    test("debe devolver 401 si no está autorizado", async () => {
      req.user = undefined;

      await AuthController.authProfile(req as Request, res);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({ message: "No autorizado" });
    });

    test("debe devolver 404 si el usuario no se encuentra", async () => {
      req.user = { id_usuario: 1, id_rol: 4 } as UserPayload;
      (mockPrisma.default.usuarios.findUnique as any).mockResolvedValue(null);

      await AuthController.authProfile(req as Request, res);

      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({
        message: "Usuario no encontrado",
      });
    });
  });

  describe("authRegister", () => {
    test("debe registrar un nuevo usuario exitosamente", async () => {
      req.body = {
        email: "newuser@example.com",
        password: "Password123!",
        nombre: "Nuevo Usuario",
        biografia: "",
      };
      const mockUser = {
        id_usuario: 2,
        email: "newuser@example.com",
        nombre: "Nuevo Usuario",
        biografia: "",
        id_rol: 4,
        password: "hashed_password",
        two_factor_secret: "",
        last_login: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        two_factor_enabled: false,
        rol: { nombre: "visitante" },
      };
      (mockBcrypt.hash as any).mockResolvedValue("hashed_password");
      (mockPrisma.default.$transaction as any).mockImplementation(
        async (fn: (tx: any) => Promise<any>) => {
          const tx = {
            usuarios: {
              create: mock(() => Promise.resolve(mockUser)),
            },
            colecciones: {
              create: mock(() => Promise.resolve({})),
            },
          };
          return await fn(tx);
        }
      );

      await AuthController.authRegister(req as Request, res);

      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(jsonSpy).toHaveBeenCalledWith({
        id_usuario: 2,
        email: "newuser@example.com",
        nombre: "Nuevo Usuario",
        biografia: "",
        id_rol: 4,
        two_factor_secret: "",
        last_login: expect.any(Date),
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
        two_factor_enabled: false,
        rol: { nombre: "visitante" },
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith("Password123!", 10);
    });

    test("debe devolver 400 si la validación falla", async () => {
      req.body = { email: "invalid", password: "short" };

      await AuthController.authRegister(req as Request, res);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        message: "Bad Request",
        errors: expect.any(Array),
      });
    });

    test("debe devolver 400 si el email ya está registrado", async () => {
      req.body = {
        email: "existing@example.com",
        password: "Password123!",
        nombre: "Usuario Existente",
        biografia: "",
      };
      (mockBcrypt.hash as any).mockResolvedValue("hashed_password");
      (mockPrisma.default.$transaction as any).mockImplementation(async () => {
        throw new Error("Unique constraint failed on the fields: (`email`)");
      });

      await AuthController.authRegister(req as Request, res);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        message: "El email ya está registrado",
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith("Password123!", 10);
    });
  });

  describe("login", () => {
    beforeEach(() => {
      // Mockear createRefreshToken para evitar crypto
      mock.module("@app/models/user", () => ({
        createRefreshToken: mock(() =>
          Promise.resolve({
            token: "mock_refresh_token",
            expiresAt: new Date(),
          })
        ),
      }));
    });

    test("debe iniciar sesión exitosamente sin 2FA", async () => {
      req.body = {
        email: "user@example.com",
        password: "Password123!",
      };
      const mockUser = {
        id_usuario: 1,
        email: "user@example.com",
        password: "hashed_password",
        id_rol: 4,
        nombre: null,
        biografia: null,
        two_factor_enabled: false,
        two_factor_secret: null,
        profile_image: null,
        rol: { nombre: "visitante" },
      };
      (mockPrisma.default.usuarios.findFirst as any).mockResolvedValue(mockUser);
      (mockBcrypt.compare as any).mockResolvedValue(true);
      (mockJwt.sign as any).mockReturnValue("access_token");
      (mockPrisma.default.refresh_tokens.create as any).mockResolvedValue({
        token: "mock_refresh_token",
      });
      (mockPrisma.default.usuarios.update as any).mockResolvedValue(mockUser);

      await AuthController.login(req as Request, res);

      expect(res.statusCode).toBe(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        accessToken: "access_token",
        user: {
          id_usuario: 1,
          email: "user@example.com",
          role: 4,
          nombre: null,
          biografia: null,
          profile_image: null,
        },
      });
      expect(cookieSpy).toHaveBeenCalledWith(
        "refreshToken",
        "mock_refresh_token",
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: "strict",
          maxAge: 30 * 24 * 60 * 60 * 1000,
        })
      );
      expect(mockPrisma.default.usuarios.update).toHaveBeenCalledWith({
        where: { id_usuario: 1 },
        data: { last_login: expect.any(Date) },
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        "Password123!",
        "hashed_password"
      );
    });

    test("debe devolver 401 para credenciales inválidas", async () => {
      req.body = {
        email: "user@example.com",
        password: "WrongPassword",
      };
      (mockPrisma.default.usuarios.findFirst as any).mockResolvedValue(null);

      await AuthController.login(req as Request, res);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        message: "Credenciales inválidas",
      });
    });
  });

  describe("logout", () => {
    test("debe cerrar sesión exitosamente", async () => {
      req.user = { id_usuario: 1, id_rol: 4 } as UserPayload;
      req.cookies = { refreshToken: "mock_refresh_token" };
      (mockPrisma.default.refresh_tokens.deleteMany as any).mockResolvedValue({
        count: 1,
      });

      await AuthController.logout(req as Request, res);

      expect(res.statusCode).toBe(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        message: "Successfully logged out",
      });
      expect(clearCookieSpy).toHaveBeenCalledWith("refreshToken", {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
      });
      expect(mockPrisma.default.refresh_tokens.deleteMany).toHaveBeenCalledWith({
        where: { token: "mock_refresh_token" },
      });
    });

    test("debe devolver 401 si no está autorizado", async () => {
      req.user = undefined;
      req.cookies = { refreshToken: "mock_refresh_token" };

      await AuthController.logout(req as Request, res);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({ message: "No autorizado" });
      expect(clearCookieSpy).not.toHaveBeenCalled();
    });
  });

  describe("updateProfile", () => {
    test("debe actualizar el perfil exitosamente", async () => {
      req.user = { id_usuario: 1, id_rol: 4 } as UserPayload;
      req.body = {
        nombre: "Nuevo Nombre",
        biografia: "Nueva Bio",
        profile_image: "new_image.jpg",
      };
      const mockUser = {
        id_usuario: 1,
        email: "user@example.com",
        nombre: "Nuevo Nombre",
        biografia: "Nueva Bio",
        id_rol: 4,
        profile_image: "new_image.jpg",
        two_factor_enabled: false,
      };
      (mockPrisma.default.usuarios.update as any).mockResolvedValue(mockUser);

      await AuthController.updateProfile(req as Request, res);

      expect(jsonSpy).toHaveBeenCalledWith(mockUser);
      expect(mockPrisma.default.usuarios.update).toHaveBeenCalledWith({
        where: { id_usuario: 1 },
        data: {
          nombre: "Nuevo Nombre",
          biografia: "Nueva Bio",
          profile_image: "new_image.jpg",
        },
        select: {
          id_usuario: true,
          email: true,
          nombre: true,
          biografia: true,
          id_rol: true,
          profile_image: true,
          two_factor_enabled: true,
        },
      });
    });

    test("debe devolver 401 si no está autorizado", async () => {
      req.user = undefined;
      req.body = { nombre: "Nuevo Nombre" };

      await AuthController.updateProfile(req as Request, res);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({ message: "No autorizado" });
    });
  });

  describe("adminGetUsers", () => {
    test("debe devolver la lista de usuarios", async () => {
      const mockUsers = [
        {
          id_usuario: 1,
          email: "user1@example.com",
          nombre: "Usuario 1",
          biografia: "Bio 1",
          id_rol: 4,
          last_login: new Date(),
          two_factor_enabled: false,
          profile_image: null,
        },
      ];
      (mockPrisma.default.usuarios.findMany as any).mockResolvedValue(mockUsers);

      await AuthController.adminGetUsers(req as Request, res);

      expect(jsonSpy).toHaveBeenCalledWith(mockUsers);
      expect(mockPrisma.default.usuarios.findMany).toHaveBeenCalledWith({
        select: {
          id_usuario: true,
          email: true,
          nombre: true,
          biografia: true,
          id_rol: true,
          last_login: true,
          two_factor_enabled: true,
          profile_image: true,
        },
      });
    });
  });

  describe("adminPostUsers", () => {
    test("debe crear un usuario exitosamente", async () => {
      req.body = {
        email: "newuser@example.com",
        password: "Password123!",
        nombre: "Nuevo Usuario",
        biografia: "",
      };
      const mockUser = {
        id_usuario: 2,
        email: "newuser@example.com",
        nombre: "Nuevo Usuario",
        biografia: "",
        id_rol: 4,
      };
      (mockBcrypt.hash as any).mockResolvedValue("hashed_password");
      (mockPrisma.default.$transaction as any).mockImplementation(
        async (fn: (tx: any) => Promise<any>) => {
          const tx = {
            usuarios: {
              create: mock(() => Promise.resolve(mockUser)),
            },
            colecciones: {
              create: mock(() => Promise.resolve({})),
            },
          };
          return await fn(tx);
        }
      );

      await AuthController.adminPostUsers(req as Request, res);

      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(jsonSpy).toHaveBeenCalledWith(mockUser);
    });

    test("debe devolver 400 si el email ya está registrado", async () => {
      req.body = {
        email: "existing@example.com",
        password: "Password123!",
        nombre: "Usuario Existente",
        biografia: "",
      };
      (mockBcrypt.hash as any).mockResolvedValue("hashed_password");
      (mockPrisma.default.$transaction as any).mockImplementation(async () => {
        throw new Error("Unique constraint failed on the fields: (`email`)");
      });

      await AuthController.adminPostUsers(req as Request, res);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        message: "El email ya está registrado",
      });
    });
  });

  describe("adminPatchUsers", () => {
    test("debe actualizar un usuario exitosamente", async () => {
      req.params = { id: "1" };
      req.body = {
        id_usuario: 1,
        nombre: "Updated Name",
        biografia: "Updated Bio",
        id_rol: 3,
      };
      const mockUser = {
        id_usuario: 1,
        email: "user@example.com",
        nombre: "Updated Name",
        biografia: "Updated Bio",
        id_rol: 3,
        profile_image: null,
        two_factor_enabled: false,
      };
      (mockPrisma.default.usuarios.update as any).mockResolvedValue(mockUser);

      await AuthController.adminPatchUsers(req as Request, res);
      await Bun.sleep(0); // Asegurar resolución de promesas

      expect(jsonSpy).toHaveBeenCalledWith(mockUser);
      expect(mockPrisma.default.usuarios.update).toHaveBeenCalledWith({
        where: { id_usuario: 1 },
        data: {
          nombre: "Updated Name",
          biografia: "Updated Bio",
          id_rol: 3,
        },
        select: {
          id_usuario: true,
          email: true,
          nombre: true,
          biografia: true,
          id_rol: true,
          profile_image: true,
          two_factor_enabled: true,
        },
      });
    });

    test("debe devolver 400 si el ID es inválido", async () => {
      req.params = { id: "invalid" };

      await AuthController.adminPatchUsers(req as Request, res);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        message: "ID de usuario inválido",
      });
    });
  });

  describe("adminDeleteUsers", () => {
    test("debe eliminar un usuario exitosamente", async () => {
      req.params = { id: "2" };
      req.user = { id_usuario: 1, id_rol: 1 } as UserPayload;
      (mockPrisma.default.logs.deleteMany as any).mockResolvedValue({
        count: 0,
      });
      (mockPrisma.default.colecciones.deleteMany as any).mockResolvedValue({
        count: 0,
      });
      (mockPrisma.default.usuarios.delete as any).mockResolvedValue({});

      await AuthController.adminDeleteUsers(req as Request, res);

      expect(jsonSpy).toHaveBeenCalledWith({
        message: "Usuario eliminado correctamente",
      });
      expect(mockPrisma.default.usuarios.delete).toHaveBeenCalledWith({
        where: { id_usuario: 2 },
      });
    });

    test("debe devolver 400 si intenta eliminar su propia cuenta", async () => {
      req.params = { id: "1" };
      req.user = { id_usuario: 1, id_rol: 1 } as UserPayload;

      await AuthController.adminDeleteUsers(req as Request, res);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        message: "No puedes eliminar tu propia cuenta",
      });
    });
  });

  describe("setup2FA", () => {
    beforeEach(() => {
      (mockJwt.verify as any).mockReturnValue({
        id_usuario: 1,
        id_rol: 4,
        email: "test@example.com",
      });
      (mockPrisma.default.usuarios.findUnique as any).mockResolvedValue({
        email: "test@example.com",
      });
    });
/*
    test("debe configurar 2FA exitosamente", async () => {
      req.user = {
        id_usuario: 1,
        id_rol: 4,
        email: "test@example.com",
      } as UserPayload;
      const mockUser = {
        id_usuario: 1,
        email: "test@example.com",
        nombre: "Test User",
        biografia: null,
        id_rol: 4,
        two_factor_enabled: false,
        two_factor_secret: null,
        profile_image: null,
        rol: { nombre: "VISITOR" },
      };
      (mockPrisma.default.usuarios.findFirst as any).mockResolvedValue(mockUser);
      (mockPrisma.default.usuarios.update as any).mockResolvedValue(mockUser);
      (mockJwt.sign as any).mockReturnValue("temp_token");

      await AuthController.setup2FA(req as Request, res);
      await Bun.sleep(0); // Asegurar resolución de promesas

      expect(jsonSpy).toHaveBeenCalledWith({
        message: "2FA configurado correctamente",
        secret: "test_2fa_secret",
        qrCode: "data:image/png;base64,test_qrcode",
        tempToken: "temp_token",
      });
      expect(mockEmail.send2FASetupEmail).toHaveBeenCalledWith(
        "test@example.com",
        "test_2fa_secret",
        "data:image/png;base64,test_qrcode"
      );
      expect(mockPrisma.default.usuarios.update).toHaveBeenCalledWith({
        where: { id_usuario: 1 },
        data: { two_factor_secret: "test_2fa_secret" },
      });
    });
*/
    test("debe devolver 401 si no está autorizado", async () => {
      req.user = undefined;

      await AuthController.setup2FA(req as Request, res);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({ message: "No autorizado" });
    });
  });
});
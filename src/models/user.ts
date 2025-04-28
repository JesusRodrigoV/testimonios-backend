//model/user.ts
import { compare, hash } from "bcryptjs";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";
import {
  email,
  maxLength,
  minLength,
  nullable,
  object,
  pipe,
  regex,
  string,
  type InferInput,
} from "valibot";
import type { rol, usuarios } from "../../generated/prisma";
import prisma from "src/lib/prisma";
import { send2FACodeEmail } from "@app/lib/email";

const emailSchema = pipe(
  string(),
  email(),
  maxLength(50, "El email no debe tener mas de 50 caracteres"),
);
export const passwordSchema = pipe(
  string(),
  minLength(6, "Contraseña de al menos 6 caracteres"),
  maxLength(255, "La contraseña no puede tener mas de 255 caracteres"),
);
const nombreSchema = pipe(
  string(),
  minLength(3, "El nombre no puede tener menos de 3 caracteres"),
  maxLength(20, "El nombre no puede tener mas de 20 caracteres"),
  regex(
    /^[a-zA-Z0-9_]+$/,
    "El nombre solo puede contener letras, numeros, y guiones bajos",
  ),
);
const biografiaSchema = pipe(nullable(string(), "Sin informacion"));

export const userSchema = object({
  nombre: nombreSchema,
  email: emailSchema,
  password: passwordSchema,
  biografia: biografiaSchema,
});

export const authSchema = object({
  email: emailSchema,
  password: passwordSchema,
});

export const twoFactorSchema = object({
  email: emailSchema,
  password: passwordSchema,
  twoFactorToken: string(),
});

export enum Rol {
  "ADMIN" = 1,
  "CURATOR" = 2,
  "RESEARCHER" = 3,
  "VISITOR" = 4,
}

export type UserInput = InferInput<typeof userSchema>;

export type User = usuarios & {
  rol?: rol;
};

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const createUser = async ({
  email,
  password,
  nombre,
  biografia = "",
  id_rol = Rol.VISITOR,
}: UserInput & { id_rol?: number }): Promise<User> => {
  const hashedPassword = await hash(password, 10);

  return prisma.usuarios.create({
    data: {
      email,
      password: hashedPassword,
      nombre,
      biografia: biografia || "",
      id_rol,
      two_factor_secret: "",
      last_login: new Date(),
      two_factor_enabled: false,
    },
    include: {
      rol: true,
    },
  });
};

export const updateUser = async (
  id: number,
  data: Partial<Omit<UserInput, "password">> & {
    password?: string;
    id_rol?: number;
  },
): Promise<User> => {
  const updateData: any = { ...data };

  if (data.password) {
    updateData.password = await hash(data.password, 10);
  }

  return prisma.usuarios.update({
    where: { id_usuario: id },
    data: updateData,
    include: {
      rol: true,
    },
  });
};

export const deleteUser = async (id: number): Promise<void> => {
  await prisma.usuarios.delete({
    where: { id_usuario: id },
  });
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.usuarios.findFirst({
    where: { email },
    include: {
      rol: true,
    },
  });
};

export const generate2FASecret = async (
  userId: number,
): Promise<{ secret: string; qrCode: string }> => {
  const user = await prisma.usuarios.findUnique({
    where: { id_usuario: userId },
    select: { email: true },
  });

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  const secret = speakeasy.generateSecret({ length: 20 });

  const otpauthUrl = speakeasy.otpauthURL({
    secret: secret.base32,
    label: user.email,
    issuer: "TestimoniosApp",
    encoding: "base32",
  });

  const qrCode = await QRCode.toDataURL(otpauthUrl, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 400,
    scale: 4,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });

  await prisma.usuarios.update({
    where: { id_usuario: userId },
    data: {
      two_factor_secret: secret.base32,
    },
  });

  return {
    secret: secret.base32,
    qrCode,
  };
};

export const verify2FAToken = async (
  userId: number,
  token: string,
): Promise<{ isValid: boolean; user: User | null }> => {
  console.log("Verificando token 2FA:", { userId, token });

  const user = await prisma.usuarios.findUnique({
    where: { id_usuario: userId },
    include: {
      rol: true,
    },
  });

  if (!user?.two_factor_secret) {
    console.log("No se encontró secret 2FA para el usuario");
    return { isValid: false, user: null };
  }

  console.log("Secret encontrado:", user.two_factor_secret);

  const currentToken = speakeasy.totp({
    secret: user.two_factor_secret,
    encoding: "base32",
  });

  console.log("Token actual generado:", currentToken);
  console.log("Token recibido:", token);

  const isValid = speakeasy.totp.verify({
    secret: user.two_factor_secret,
    encoding: "base32",
    token,
    window: 1,
  });

  console.log("¿Es válido el token?:", isValid);

  if (isValid) {
    // Si el token es válido, actualizar el estado de 2FA y último login
    await prisma.usuarios.update({
      where: { id_usuario: userId },
      data: {
        two_factor_enabled: true,
        last_login: new Date(),
      },
    });
  }

  return { isValid, user: isValid ? user : null };
};

export const regenerateQRCode = async (
  secret: string,
  email: string,
): Promise<string> => {
  const otpauthUrl = speakeasy.otpauthURL({
    secret: secret,
    label: email,
    issuer: "TestimoniosApp",
    encoding: "base32",
  });

  const qrCode = await QRCode.toDataURL(otpauthUrl, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 400,
    scale: 4,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });

  return qrCode;
};

export const generatePasswordResetToken = async (userId: number) => {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 3600000); // 1 hora

  console.log("Generating reset token:", {
    userId,
    token,
    expires,
  });

  try {
    const updatedUser = await prisma.usuarios.update({
      where: { id_usuario: userId },
      data: {
        password_reset_token: token,
        password_reset_expires: expires,
      },
    });

    console.log("Token stored in database:", {
      userId: updatedUser.id_usuario,
      storedToken: updatedUser.password_reset_token,
      storedExpires: updatedUser.password_reset_expires,
    });

    return token;
  } catch (error) {
    console.error("Error storing reset token:", error);
    throw error;
  }
};

export const resetPassword = async (
  token: string,
  newPassword: string,
): Promise<boolean> => {
  console.log("Attempting password reset with token:", token);

  // Primero buscar sin la restricción de fecha para ver si el token existe
  const userWithoutExpiry = await prisma.usuarios.findFirst({
    where: {
      password_reset_token: token,
    },
  });

  console.log(
    "Found user without expiry check:",
    userWithoutExpiry
      ? {
          id: userWithoutExpiry.id_usuario,
          token: userWithoutExpiry.password_reset_token,
          expires: userWithoutExpiry.password_reset_expires,
        }
      : "No user found",
  );

  const now = new Date();
  console.log("Current time:", now.toISOString());

  const user = await prisma.usuarios.findFirst({
    where: {
      password_reset_token: token,
      password_reset_expires: {
        gt: now,
      },
    },
  });

  console.log(
    "Found user with expiry check:",
    user
      ? {
          id: user.id_usuario,
          token: user.password_reset_token,
          expires: user.password_reset_expires,
          currentTime: now,
          isValid: user.password_reset_expires > now,
        }
      : "No valid user found",
  );

  if (!user) return false;

  const hashedPassword = await hash(newPassword, 10);

  await prisma.usuarios.update({
    where: { id_usuario: user.id_usuario },
    data: {
      password: hashedPassword,
      password_reset_token: null,
      password_reset_expires: null,
    },
  });

  return true;
};
export const validatePassword = async (
  user: User,
  password: string,
): Promise<boolean> => {
  return compare(password, user.password);
};

export const updateRefreshToken = async (
  userId: number,
  token: string | null,
): Promise<void> => {
  await prisma.usuarios.update({
    where: { id_usuario: userId },
    data: { refresh_token: token },
  });
};

export const findUserByRefreshToken = async (
  token: string,
): Promise<User | null> => {
  return prisma.usuarios.findFirst({
    where: { refresh_token: token },
    include: {
      rol: true,
    },
  });
};

export const updateLastLogin = async (userId: number): Promise<void> => {
  await prisma.usuarios.update({
    where: { id_usuario: userId },
    data: { last_login: new Date() },
  });
};

export const getUserRole = async (userId: number): Promise<number> => {
  const user = await prisma.usuarios.findUnique({
    where: { id_usuario: userId },
    select: { id_rol: true },
  });
  return user?.id_rol || Rol.VISITOR;
};

export const generateAndSend2FACode = async (userId: number) => {
  try {
    const user = await prisma.usuarios.findUnique({
      where: { id_usuario: userId },
    });

    if (!user?.two_factor_secret) {
      throw new Error("2FA no configurado para este usuario");
    }

    const code = speakeasy.totp({
      secret: user.two_factor_secret,
      encoding: "base32",
    });

    await send2FACodeEmail(user.email, code);

    return { code };
  } catch (error) {
    throw new Error("Error generando código 2FA: " + (error as Error).message);
  }
};

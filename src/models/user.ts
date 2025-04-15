import { compare, hash } from "bcrypt";
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

const emailSchema = pipe(
  string(),
  email(),
  maxLength(50, "El email no debe tener mas de 50 caracteres"),
);
const passwordSchema = pipe(
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
}: UserInput): Promise<User> => {
  const hashedPassword = await hash(password, 10);

  return prisma.usuarios.create({
    data: {
      email,
      password: hashedPassword,
      nombre,
      biografia: biografia || "",
      id_rol: Rol.VISITOR,
      two_factor_secret: "",
      last_login: new Date(),
    },
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
  const secret = speakeasy.generateSecret({ length: 20 });
  const qrCode = await QRCode.toDataURL(secret.otpauth_url || "");

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
): Promise<boolean> => {
  const user = await prisma.usuarios.findUnique({
    where: { id_usuario: userId },
  });

  if (!user?.two_factor_secret) return false;

  return speakeasy.totp.verify({
    secret: user.two_factor_secret,
    encoding: "base32",
    token,
  });
};

export const generatePasswordResetToken = async (
  userId: number,
): Promise<string> => {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date();
  expires.setHours(expires.getHours() + 1);

  await prisma.usuarios.update({
    where: { id_usuario: userId },
    data: {
      password_reset_token: token,
      password_reset_expires: expires,
    },
  });

  return token;
};

export const resetPassword = async (
  token: string,
  newPassword: string,
): Promise<boolean> => {
  const user = await prisma.usuarios.findFirst({
    where: {
      password_reset_token: token,
      password_reset_expires: {
        gt: new Date(),
      },
    },
  });

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

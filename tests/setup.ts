import { afterEach, mock } from "bun:test";

console.log("Loading test environment variables from .env.test");

mock.module("@app/lib/email", () => ({
  send2FASetupEmail: mock(() => Promise.resolve()),
  sendPasswordResetEmail: mock(() => Promise.resolve()),
  send2FACodeEmail: mock(() => Promise.resolve()),
}));

mock.module("@app/lib/prisma", () => ({
  default: {
    usuarios: {
      findUnique: mock(() => Promise.resolve(null)),
      findFirst: mock(() => Promise.resolve(null)),
      findMany: mock(() => Promise.resolve([])),
      create: mock(() => Promise.resolve({})),
      update: mock(() => Promise.resolve({})),
      delete: mock(() => Promise.resolve({})),
    },
    colecciones: {
      create: mock(() => Promise.resolve({})),
      deleteMany: mock(() => Promise.resolve({})),
    },
    logs: {
      deleteMany: mock(() => Promise.resolve({})),
    },
    refresh_tokens: {
      findFirst: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({ token: "" })),
      deleteMany: mock(() => Promise.resolve({})),
    },
    $transaction: mock(async (fn: (tx: any) => Promise<any>) => {
      const tx = {
        usuarios: {
          create: mock(() => Promise.resolve({})),
        },
        colecciones: {
          create: mock(() => Promise.resolve({})),
        },
      };
      return await fn(tx);
    }),
  },
}));

mock.module("jsonwebtoken", () => ({
  sign: mock(() => "mocked_token"),
  verify: mock(() => ({ id_usuario: 1, id_rol: 4 })),
}));

mock.module("config", () => ({
  default: {
    jwtSecret: Bun.env.JWT_SECRET || "test_jwt_secret",
    emailHost: "smtp.example.com",
    emailPort: 587,
    emailUser: "test@example.com",
    emailPassword: "test_password",
    frontendUrl: "http://localhost:3000",
  },
}));

mock.module("bcryptjs", () => ({
  compare: mock(() => Promise.resolve(true)),
  hash: mock(() => Promise.resolve("hashed_password")),
}));

afterEach(() => {
  mock.restore();
});

console.log("Test setup completed");
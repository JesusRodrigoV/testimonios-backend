import prisma from "src/lib/prisma";

export const addRevokeToken = async (token: string): Promise<void> => {
  await prisma.usuarios.updateMany({
    where: {
      refresh_token: token,
    },
    data: {
      refresh_token: null,
    },
  });
};

export const isTokenRevoked = async (token: string): Promise<boolean> => {
  const user = await prisma.usuarios.findFirst({
    where: {
      refresh_token: token,
    },
  });
  return !user;
};

export const cleanupOldTokens = async (): Promise<void> => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  await prisma.usuarios.updateMany({
    where: {
      last_login: {
        lt: oneWeekAgo,
      },
      refresh_token: {
        not: null,
      },
    },
    data: {
      refresh_token: null,
    },
  });
};

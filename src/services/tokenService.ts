import prisma from "@app/lib/prisma";

export const tokenService = {
  revokeToken: async (token: string) => {
    await prisma.usuarios.updateMany({
      where: { refresh_token: token },
      data: { refresh_token: null },
    });
  },

  isTokenRevoked: async (token: string) => {
    const user = await prisma.usuarios.findFirst({
      where: { refresh_token: token },
    });
    return !user;
  },

  cleanupTokens: async () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    await prisma.usuarios.updateMany({
      where: {
        last_login: { lt: oneWeekAgo },
        refresh_token: { not: null },
      },
      data: { refresh_token: null },
    });
  },
};

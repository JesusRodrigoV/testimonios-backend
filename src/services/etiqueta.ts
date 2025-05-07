import prisma from "@app/lib/prisma";

export const etiquetaService = {
  getAllTags: async () => {
    const tags = await prisma.etiquetas.findMany({
      select: {
        id_etiquetas: true,
        nombre: true,
      },
      orderBy: { nombre: "asc" },
    });

    return tags.map((t) => ({
      id: t.id_etiquetas,
      name: t.nombre,
    }));
  },
};
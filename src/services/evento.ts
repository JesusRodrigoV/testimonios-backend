import prisma from "@app/lib/prisma";

export const eventoService = {
    getAllEvents: async () => {
        const events = await prisma.eventos_historicos.findMany({
          select: {
            id_evento: true,
            nombre: true,
            descripcion: true,
            fecha: true,
          },
          orderBy: { fecha: "desc" },
        });
    
        return events.map((e) => ({
          id: e.id_evento,
          name: e.nombre,
          description: e.descripcion,
          date: e.fecha,
        }));
      },
}
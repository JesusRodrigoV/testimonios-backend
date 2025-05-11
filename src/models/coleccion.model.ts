import prisma from "src/lib/prisma";

export class ColeccionModel {
    static async findAll() {
        return prisma.colecciones.findMany();
    }

    static async findByUserId(userId: number) {
        return prisma.colecciones.findMany({
            where: { id_usuario: userId }
        });
    }

    static async findById(id: number) {
        return prisma.colecciones.findUnique({
            where: { id_coleccion: id }
        });
    }

    static async create(data: { titulo: string; descripcion: string; fecha_creacion: Date; id_usuario: number }) {
        return prisma.colecciones.create({
            data
        });
    }

    static async update(id: number, data: { titulo?: string; descripcion?: string; fecha_creacion?: Date; id_usuario?: number }) {
        return prisma.colecciones.update({
            where: { id_coleccion: id },
            data
        });
    }

    static async delete(id: number) {
        return prisma.colecciones.delete({
            where: { id_coleccion: id }
        });
    }
}
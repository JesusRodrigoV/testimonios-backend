import prisma from "src/lib/prisma";

export class CategoriaModel {
  static async findAll() {
    return prisma.categorias.findMany();
  }

  static async findById(id: number) {
    return prisma.categorias.findUnique({
      where: { id_categoria: id }
    });
  }

  static async create(data: { nombre: string; descripcion: string }) {
    return prisma.categorias.create({
      data
    });
  }

  static async update(id: number, data: { nombre?: string; descripcion?: string }) {
    return prisma.categorias.update({
      where: { id_categoria: id },
      data
    });
  }

  static async delete(id: number) {
    return prisma.categorias.delete({
      where: { id_categoria: id }
    });
  }
}
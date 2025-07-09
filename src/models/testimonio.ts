import type { Prisma } from "@generated/prisma";
import {
  array,
  maxLength,
  minLength,
  nullable,
  number,
  object,
  optional,
  pipe,
  string,
  type InferInput,
} from "valibot";

const titleSchema = pipe(string(), minLength(5), maxLength(255));
const descriptionSchema = pipe(string(), minLength(5), maxLength(1000));
const contentSchema = pipe(string(), minLength(5), maxLength(1000));
const tagsSchema = pipe(string(), minLength(1), maxLength(255));
const categorySchema = pipe(string(), minLength(1), maxLength(255));
const eventIdSchema = nullable(number());
const latitudeSchema = nullable(number());
const longitudeSchema = nullable(number());
const urlSchema = pipe(string("La URL del medio debe ser un texto"));
const durationSchema = pipe(number("La duración debe ser un número"));
const formatSchema = pipe(string());

const testimonySchema = object({
  title: titleSchema,
  description: descriptionSchema,
  content: contentSchema,
  tags: array(tagsSchema),
  category: array(categorySchema),
  url: urlSchema,
  duration: durationSchema,
  format: formatSchema,
  eventId: eventIdSchema,
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});

export const inputTestimonySchema = object({
  title: testimonySchema.entries.title,
  description: testimonySchema.entries.description,
  content: optional(testimonySchema.entries.content),
  tags: optional(testimonySchema.entries.tags),
  categories: optional(testimonySchema.entries.category),
  url: testimonySchema.entries.url,
  duration: optional(testimonySchema.entries.duration),
  format: testimonySchema.entries.format,
  eventId: optional(testimonySchema.entries.eventId),
  latitude: optional(testimonySchema.entries.latitude),
  longitude: optional(testimonySchema.entries.longitude),
});

export type TestimonyInput = InferInput<typeof inputTestimonySchema>;

export type TestimonyWithRelations = Prisma.testimoniosGetPayload<{
  select: {
    id_testimonio: true;
    titulo: true;
    descripcion: true;
    contenido_texto: true;
    url_medio: true;
    duracion: true;
    latitud: true;
    longitud: true;
    created_at: true;
    estado: { select: { nombre: true } };
    medio: { select: { nombre: true } };
    usuarios_testimonios_subido_porTousuarios: { select: { nombre: true } };
    testimonios_categorias?: {
      include: { categorias: { select: { nombre: true } } };
    };
    testimonios_etiquetas?: {
      include: { etiquetas: { select: { nombre: true } } };
    };
    testimonios_eventos?: {
      include: { eventos_historicos: { select: { nombre: true } } };
    };
  };
}>;
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

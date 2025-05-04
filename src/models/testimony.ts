import {
  array,
  enum_,
  maxLength,
  minLength,
  minSize,
  number,
  object,
  optional,
  pipe,
  string,
  type InferInput,
  type InferOutput,
} from "valibot";

const titleSchema = pipe(string(), minLength(5), maxLength(255));
const descriptionSchema = pipe(string(), minLength(5), maxLength(1000));
const contentSchema = pipe(string(), minLength(5), maxLength(1000));
const tagsSchema = pipe(string(), minLength(1), maxLength(255));
const categorySchema = pipe(string(), minLength(1), maxLength(255));
const eventIdSchema = pipe(number());
const latitudeSchema = pipe(number());
const longitudeSchema = pipe(number());
const mediaUrlSchema = pipe(string("La URL del medio debe ser un texto"));
const durationSchema = pipe(number("La duración debe ser un número"));
const formatSchema = pipe(string());

const testimonySchema = object({
  title: titleSchema,
  description: descriptionSchema,
  content: contentSchema,
  tags: tagsSchema,
  category: categorySchema,
  mediaUrl: mediaUrlSchema,
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
  tags: optional(array(testimonySchema.entries.tags)),
  categories: optional(array(testimonySchema.entries.category)),
  mediaUrl: testimonySchema.entries.mediaUrl,
  duration: optional(testimonySchema.entries.duration),
  format: testimonySchema.entries.format,
  eventId: optional(testimonySchema.entries.eventId),
  latitude: optional(testimonySchema.entries.latitude),
  longitude: optional(testimonySchema.entries.longitude),
});

export type TestimonyInput = InferInput<typeof inputTestimonySchema>;

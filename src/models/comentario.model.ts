import {
  date,
  email,
  nullable,
  number,
  object,
  pipe,
  string,
  type InferInput,
} from "valibot";

const idForocommentSchema = pipe(number());
const contenidoSchema = pipe(string());
const fechaCreacionSchema = pipe(date());
const creadoPorSchema = pipe(number());
const idForoTemaSchema = pipe(number());
const parentIdSchema = nullable(pipe(number()));

const idUsuarioSchema = pipe(number());
const nombreSchema = pipe(string());
const emailSchema = pipe(string(), email());
const profileImageSchema = nullable(pipe(string()));

const usuarioSchema = object({
  id_usuario: idUsuarioSchema,
  nombre: nombreSchema,
  email: emailSchema,
  profile_image: profileImageSchema,
});

const commentSchema = object({
  id_forocoment: idForocommentSchema,
  contenido: contenidoSchema,
  fecha_creacion: fechaCreacionSchema,
  creado_por_id_usuario: creadoPorSchema,
  id_forotema: idForoTemaSchema,
  parent_id: parentIdSchema,
  usuarios: usuarioSchema,
});

export type Comment = InferInput<typeof commentSchema>;

export interface CommentWithChildren extends Comment {
  children: CommentWithChildren[];
}


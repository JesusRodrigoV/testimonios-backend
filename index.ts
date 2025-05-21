import express from "express";
import cors from "cors";
import config from "./config";
import { authRouter } from "./src/routes/auth";
import testimoniosRouter from "@app/routes/testimonios";
import categoriaRouter from "@app/routes/CategoriaRoutes"; 
import etiquetaRouter from "@app/routes/etiqueta";
import eventoRouter from "@app/routes/evento";
import comentarioRouter from "@app/routes/comentario.route";
import notificacionRouter from "@app/routes/notificacion.route";
import coleccionRouter from "@app/routes/coleccion.route";
import transcripcionRouter from "@app/routes/transcripcion.route";
import calificacionRouter from "@app/routes/calificacion.route";
import forotemaRouter from "@app/routes/forotema.route";
import forocomentarioRouter from "@app/routes/forocomentario.route";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRouter);
app.use("/media", testimoniosRouter);
app.use("/categories", categoriaRouter);
app.use("/tags", etiquetaRouter);
app.use("/events", eventoRouter);
app.use("/comments", comentarioRouter);
app.use("/notifications", notificacionRouter);
app.use("/collections", coleccionRouter);
app.use("/transcription", transcripcionRouter);
app.use("/score", calificacionRouter);
app.use("/forumtopics", forotemaRouter);
app.use("/forumcomments", forocomentarioRouter);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  },
);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

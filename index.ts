import express from "express";
import cors from "cors";
import config from "./config";
import * as routers from '@app/routes';
import path from 'path';

const app = express();

app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use("/auth", routers.authRouter);
app.use("/media", routers.testimoniosRouter);
app.use("/categories", routers.categoriaRouter);
app.use("/tags", routers.etiquetaRouter);
app.use("/events", routers.eventoRouter);
app.use("/comments", routers.comentarioRouter);
app.use("/notifications", routers.notificacionRouter);
app.use("/collections", routers.coleccionRouter);
app.use("/transcription", routers.transcripcionRouter);
app.use("/score", routers.calificacionRouter);
app.use("/forumtopics", routers.forotemaRouter);
app.use("/forumcomments", routers.forocomentarioRouter);
app.use("/api-docs", routers.swaggerRouter);

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

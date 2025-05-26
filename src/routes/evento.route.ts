import { getAllEvents } from "@app/controllers/evento.controller";
import express from "express";

export const eventoRouter = express.Router();

eventoRouter.get("/", getAllEvents);
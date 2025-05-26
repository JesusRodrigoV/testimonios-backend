import { getAllEvents } from "@app/controllers/evento";
import express from "express";

export const eventoRouter = express.Router();

eventoRouter.get("/", getAllEvents);
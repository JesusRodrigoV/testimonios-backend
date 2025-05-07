import { getAllEvents } from "@app/controllers/evento";
import express from "express";

const router = express.Router();

router.get("/", getAllEvents);

export default router;
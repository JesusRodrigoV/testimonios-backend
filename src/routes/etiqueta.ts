import { getAllTags } from "@app/controllers/etiqueta";
import express from "express";

const router = express.Router();

router.get("/", getAllTags);

export default router;
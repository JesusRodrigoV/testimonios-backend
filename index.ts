import express from "express";
import cors from "cors";
import config from "./config";
import { authRouter } from "./src/routes/auth";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRouter);

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  },
);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

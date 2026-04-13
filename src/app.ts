import express, { type Request, type Response } from "express";
import { routes } from "./routes/index.js";
import cors from "cors";

export const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Vehicle Sharing API" });
});

app.use("/api", routes);

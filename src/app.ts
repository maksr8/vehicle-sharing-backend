import express, { type Request, type Response } from "express";
import { routes } from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFound.js";
import cors from "cors";

export const app = express();

app.use(cors());

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Vehicle Sharing API" });
});

app.use("/api", routes);

app.use(notFoundHandler);

app.use(errorHandler);

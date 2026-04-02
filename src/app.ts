import express, { type Request, type Response } from "express";
import { routes } from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFound.js";

export const app = express();

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Vehicle Sharing API" });
});

app.use("/api", routes);

app.use(notFoundHandler);

app.use(errorHandler);

import "dotenv/config";
import http from "http";
import { app } from "./app.js";
import { startSessionCleanupJob } from "./jobs/cleanup.job.js";
import { initSocket } from "./socket.js";
import { initGraphQL } from "./graphql/initGraphql.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const PORT = process.env.SERVER_PORT;
const apiTransport = (process.env.API_TRANSPORT || "rest").toLowerCase();
if (apiTransport !== "rest" && apiTransport !== "graphql") {
  throw new Error("Invalid API_TRANSPORT value. Use either 'rest' or 'graphql'.");
}

const server = http.createServer(app);

initSocket(server);

await initGraphQL(app);
app.use(notFoundHandler);
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`NODE_ENV mode ${process.env.NODE_ENV}`);
  console.log(`API transport mode ${apiTransport}`);
  startSessionCleanupJob();
});

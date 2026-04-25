import "dotenv/config";
import http from "http";
import { app } from "./app.js";
import { startSessionCleanupJob } from "./jobs/cleanup.job.js";
import { initSocket } from "./socket.js";

const PORT = process.env.SERVER_PORT;

const server = http.createServer(app);

initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`NODE_ENV mode ${process.env.NODE_ENV}`);
  startSessionCleanupJob();
});

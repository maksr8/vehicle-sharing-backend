import "dotenv/config";
import { app } from "./app.js";
import { startSessionCleanupJob } from "./jobs/cleanup.job.js";

const PORT = process.env.SERVER_PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`NODE_ENV mode ${process.env.NODE_ENV}`);
  startSessionCleanupJob();
});

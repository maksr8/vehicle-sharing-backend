import cron from "node-cron";
import { prisma } from "../db/prisma.js";

export function startSessionCleanupJob() {
  cron.schedule("0 3 * * *", async () => {
    console.log("[Cron] Starting cleaning session table");
    try {
      const result = await prisma.session.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
      console.log(
        `[Cron] Cleaning finished. Sessions deleted: ${result.count}`,
      );
    } catch (error) {
      console.error("[Cron] Error while cleaning: ", error);
    }
  });
}

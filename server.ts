import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createApp } from "./backend/src/app";
import { connectDB } from "./backend/src/config/database";
import { seedDatabaseIfEmpty } from "./backend/src/services/seed.service";
import { logger } from "./backend/src/utils/logger";
import { BUSINESS_TIMEZONE } from "./backend/src/utils/date";

async function startServer() {
  try {
    // 1. Initialize MongoDB (embedded or cloud instance)
    await connectDB();

    // 2. Seed initial enterprise users, settings, and records
    await seedDatabaseIfEmpty();

    // 3. Instantiate full backend app with all /api routes & controllers
    const app = createApp();
    const PORT = 3000;

    // 4. Vite Middleware for SPA Frontend
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      logger.info(
        `[Enterprise AMS Full-Stack] Server running on http://0.0.0.0:${PORT} (Timezone: ${BUSINESS_TIMEZONE})`
      );
    });
  } catch (error) {
    logger.error("Failed to start enterprise server:", { error });
    process.exit(1);
  }
}

startServer();

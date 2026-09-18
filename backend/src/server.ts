import { createApp } from "./app";
import { connectDB } from "./config/database";
import { config } from "./config/env";
import { seedDatabaseIfEmpty } from "./services/seed.service";
import { logger } from "./utils/logger";

async function bootstrap() {
  try {
    await connectDB();
    await seedDatabaseIfEmpty();

    const app = createApp();
    const port = Number(config.PORT) || 3000;

    app.listen(port, "0.0.0.0", () => {
      logger.info(`AMS Backend Server running on port ${port} (Timezone: ${config.TIMEZONE})`);
    });
  } catch (error) {
    logger.error("Failed to start backend server:", { error });
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  bootstrap();
}

export default bootstrap;

import express from "express";
import cors from "cors";
import morgan from "morgan";
import apiRoutes from "./routes/index";
import { errorHandler } from "./middleware/error.middleware";
import { logger } from "./utils/logger";

export function createApp(): express.Application {
  const app = express();

  // Morgan HTTP logging routed to Winston (only for /api backend routes)
  const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
  app.use(
    morgan(morganFormat, {
      skip: (req) => !req.originalUrl.startsWith("/api"),
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    })
  );

  // CORS Configuration
  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization", "x-user-id"],
    })
  );

  // Payload Limit for Selfie Captures (Base64 JPEG)
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // API Routes
  app.use("/api", apiRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

export default createApp;

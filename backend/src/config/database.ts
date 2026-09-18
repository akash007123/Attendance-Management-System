import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { config } from "./env";
import { logger } from "../utils/logger";

let mongoMemoryServer: MongoMemoryServer | null = null;

export async function connectDB(): Promise<typeof mongoose> {
  try {
    let uri = config.MONGODB_URI;

    if (!uri) {
      logger.info("No external MONGODB_URI detected. Initializing embedded MongoDB server instance...");
      mongoMemoryServer = await MongoMemoryServer.create();
      uri = mongoMemoryServer.getUri();
      logger.info(`Embedded MongoDB Memory Server running at ${uri}`);
    } else {
      logger.info(`Connecting to configured MongoDB instance...`);
    }

    mongoose.set("strictQuery", true);
    await mongoose.connect(uri);

    logger.info("MongoDB database connection established successfully.");
    return mongoose;
  } catch (error) {
    logger.error("Error connecting to MongoDB database:", { error });
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
      logger.info("Embedded MongoDB Memory Server stopped.");
    }
  } catch (error) {
    logger.error("Error disconnecting from MongoDB database:", { error });
  }
}

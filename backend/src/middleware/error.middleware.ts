import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";

  logger.error(`[API ERROR] ${req.method} ${req.originalUrl}: ${message}`, {
    statusCode,
    stack: err.stack,
    body: req.body,
    ip: req.ip,
  });

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Duplicate record conflict encountered.",
      fields: err.keyPattern,
    });
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val: any) => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join(", "),
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
}

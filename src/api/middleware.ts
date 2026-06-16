// src/api/middleware.ts

import type { Request, Response, NextFunction } from "express";
import { config } from "../config.js";
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from "./errors.js";

// Middleware to log non-OK status codes
export const middlewareLogResponses = (req: Request, res: Response, next: NextFunction) => {
  res.on("finish", () => {
    if (res.statusCode >= 400) {
      console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`);
    }
  });
  next();
};

// Metrics increment middleware
export const middlewareMetricsInc = (req: Request, res: Response, next: NextFunction) => {
  config.api.fileserverHits += 1;
  next();
};

// --- ERROR HANDLING MIDDLEWARE ---
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof BadRequestError) {
    res.status(400).json({ error: err.message });
  } else if (err instanceof UnauthorizedError) {
    res.status(401).json({ error: err.message });
  } else if (err instanceof ForbiddenError) {
    res.status(403).json({ error: err.message });
  } else if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
  } else {
    console.error(err);
    res.status(500).json({ error: "Something went wrong on our end" });
  }
};
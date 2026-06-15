// src/config.ts

import { config as loadEnv } from "dotenv";

// Load environment variables from .env
loadEnv();

// Helper to ensure critical variables are present
function envOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is missing`);
  }
  return value;
}

export type APIConfig = {
  fileserverHits: number;
  dbURL: string;
};

export const config: APIConfig = {
  fileserverHits: 0,
  dbURL: envOrThrow("DB_URL"),
};
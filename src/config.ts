// src/config.ts

import { config as loadEnv } from "dotenv";
import type { MigrationConfig } from "drizzle-orm/migrator";

loadEnv();

function envOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is missing`);
  }
  return value;
}

export type DBConfig = {
  url: string;
  migrationConfig: MigrationConfig;
};

export type APIConfig = {
  fileserverHits: number;
};

export const config: { api: APIConfig; db: DBConfig } = {
  api: {
    fileserverHits: 0,
  },
  db: {
    url: envOrThrow("DB_URL"),
    migrationConfig: {
      migrationsFolder: "./src/db/migrations",
    },
  },
};
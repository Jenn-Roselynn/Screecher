// src/index.ts

import express, { Request, Response, NextFunction } from "express";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { config } from "./config.js";

// Database cleanup queries
import { deleteAllUsers } from "./db/queries/users/users.js";
import { deleteAllChirps } from "./db/queries/chirps/chirps.js"; 
import { deleteAllRefreshTokens } from "./db/queries/refresh-tokens/refresh-tokens.js";
import { deleteAllScreeches } from "./db/queries/screeches/screeches.js";

// Custom Errors & Middleware Modules
import { ForbiddenError } from "./api/errors.js";
import { 
  middlewareLogResponses, 
  middlewareMetricsInc, 
  errorHandler 
} from "./api/middleware.js";

// Refactored HTTP Route Handlers
import { handlerCreateUser } from "./api/users.js";
import { handlerLogin, handlerRefresh, handlerRevoke } from "./api/auth.js";
import { 
  handlerCreateChirp, 
  handlerGetAllChirps, 
  handlerGetChirpById 
} from "./api/chirps.js";
import {
  handlerCreateScreech,
  handlerGetAllScreeches,
  handlerGetScreechById
} from "./api/screeches.js";

// --- AUTOMATIC MIGRATIONS ---
const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);

const app = express();
const PORT = 8080;

// Built-in JSON body parsing middleware
app.use(express.json());

// Global logging middleware
app.use(middlewareLogResponses);

// --- API ENDPOINTS ---

// Auth Routes
app.post("/api/users", handlerCreateUser);
app.post("/api/login", handlerLogin);
app.post("/api/refresh", handlerRefresh);
app.post("/api/revoke", handlerRevoke);

// Chirp Collection & Singleton Routes
app.get("/api/chirps", handlerGetAllChirps);
app.get("/api/chirps/:chirpId", handlerGetChirpById);
app.post("/api/chirps", handlerCreateChirp);

// Screech Parallel Collection & Singleton Routes
app.get("/api/screeches", handlerGetAllScreeches);
app.get("/api/screeches/:screechId", handlerGetScreechById);
app.post("/api/screeches", handlerCreateScreech);

// Readiness endpoint
app.get("/api/healthz", (req: Request, res: Response) => {
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.status(200).send("OK");
});

// Admin Metrics endpoint
app.get("/admin/metrics", (req: Request, res: Response) => {
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(`
<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${config.api.fileserverHits} times!</p>
  </body>
</html>`);
});

// Admin Reset endpoint
app.post("/admin/reset", async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (config.api.platform !== "dev") {
      throw new ForbiddenError("Not allowed in this environment");
    }
    config.api.fileserverHits = 0;
    
    // Leverage database ON DELETE CASCADE by wiping the parent table.
    // This safely and atomically clears all related chirps, screeches, and tokens.
    await deleteAllUsers();
    
    // Safety sweep for any orphaned records that somehow lacked a user relation
    await deleteAllChirps();
    await deleteAllScreeches();
    await deleteAllRefreshTokens();
    
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send("OK");
  } catch (err) {
    next(err);
  }
});

// Echo endpoint
app.post("/api/echo", (req: Request, res: Response) => {
  res.json(req.body);
});

app.get("/", (req, res) => {
  res.redirect("/app");
});

// Page routes under /app
app.use("/app", middlewareMetricsInc, express.static("./src/app"));

// Assets served UNMETERED
app.use("/assets", express.static("./src/app/assets"));

// --- GLOBAL ERROR HANDLING MIDDLEWARE ---
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Screecher is roosting at http://localhost:${PORT}`);
});
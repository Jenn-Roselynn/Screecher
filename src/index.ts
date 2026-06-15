// src/index.ts

import express, { Request, Response, NextFunction } from "express";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { config } from "./config.js";
import { createUser, deleteAllUsers } from "./db/queries/users/users.js";
import { createChirp, getAllChirps, deleteAllChirps } from "./db/queries/chirps/chirps.js"; 
// import { createScreech, getAllScreeches, deleteAllScreeches } from "./db/queries/screeches/screeches.js";

// --- AUTOMATIC MIGRATIONS ---
const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);

const app = express();
const PORT = 8080;

// --- CUSTOM ERROR CLASSES ---
class BadRequestError extends Error {}
class UnauthorizedError extends Error {}
class ForbiddenError extends Error {}
class NotFoundError extends Error {}

// Built-in JSON body parsing middleware
app.use(express.json());

// Middleware to log non-OK status codes
const middlewareLogResponses = (req: Request, res: Response, next: NextFunction) => {
  res.on("finish", () => {
    if (res.statusCode >= 400) {
      console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`);
    }
  });
  next();
};

app.use(middlewareLogResponses);

// Metrics increment middleware
const middlewareMetricsInc = (req: Request, res: Response, next: NextFunction) => {
  config.api.fileserverHits += 1;
  next();
};

// --- API ENDPOINTS ---

// Get all chirps (screeches) endpoint
app.get("/api/chirps", async (req: Request, res: Response, next: NextFunction) => { // app.get("/api/screeches", ...
  try {
    const chirps = await getAllChirps(); // const screeches = await getAllScreeches();
    res.status(200).json(chirps);
  } catch (err) {
    next(err);
  }
});

// Create chirp (screech) endpoint
app.post("/api/chirps", async (req: Request, res: Response, next: NextFunction) => { // app.post("/api/screeches", ...
  try {
    const { body, userId } = req.body;

    if (!body) {
      throw new BadRequestError("Missing body field");
    }
    if (!userId) {
      throw new BadRequestError("Missing userId field");
    }
    if (body.length > 140) {
      throw new BadRequestError("Chirp is too long. Max length is 140");
    }

    const badWords = ["kerfuffle", "sharbert", "fornax"];
    const words = body.split(" ");
    
    const cleanedWords = words.map((word: string) => {
      const lowerWord = word.toLowerCase();
      if (badWords.includes(lowerWord)) {
        return "****";
      }
      return word;
    });

    const cleanedBody = cleanedWords.join(" ");

    const chirp = await createChirp({ body: cleanedBody, userId }); // const screech = await createScreech({ body: cleanedBody, userId });
    
    res.status(201).json({
      id: chirp.id,
      createdAt: chirp.createdAt,
      updatedAt: chirp.updatedAt,
      body: chirp.body,
      userId: chirp.userId,
    });
  } catch (err) {
    next(err);
  }
});

// Create user endpoint
app.post("/api/users", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new BadRequestError("Missing email field");
    }
    const user = await createUser({ email });
    res.status(201).json({
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

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
  if (config.api.platform !== "dev") {
    throw new ForbiddenError("Not allowed in this environment");
  }
  config.api.fileserverHits = 0;
  await deleteAllChirps(); // await deleteAllScreeches();
  await deleteAllUsers();
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.status(200).send("OK");
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

// --- ERROR HANDLING MIDDLEWARE ---
// Must be defined AFTER all routes
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof BadRequestError) {
    res.status(400).json({ error: err.message });
  } else if (err instanceof UnauthorizedError) {
    res.status(401).json({ error: err.message });
  } else if (err instanceof ForbiddenError) {
    res.status(403).json({ error: err.message });
  } else if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
  } else {
    console.error(err); // Log the actual error for server-side debugging
    res.status(500).json({ error: "Something went wrong on our end" });
  }
};

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Screecher is roosting at http://localhost:${PORT}`);
});
// src/index.ts

import express, { Request, Response, NextFunction } from "express";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { config } from "./config.js";
import { createUser, getUserByEmail, deleteAllUsers } from "./db/queries/users/users.js";
import { createChirp, getAllChirps, getChirpById, deleteAllChirps } from "./db/queries/chirps/chirps.js"; 
import { hashPassword, checkPasswordHash, makeJWT, getBearerToken, validateJWT } from "./auth.js";

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

// User authentication login endpoint
app.post("/api/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, expiresInSeconds } = req.body;

    if (!email || !password) {
      throw new BadRequestError("Missing email or password field");
    }

    const user = await getUserByEmail(email);
    if (!user) {
      throw new UnauthorizedError("incorrect email or password");
    }

    const isPasswordValid = await checkPasswordHash(password, user.hashedPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedError("incorrect email or password");
    }

    // Default to 1 hour, cap at 1 hour, and ensure it's a positive number
    let expiration = 3600;
    if (typeof expiresInSeconds === "number") {
      expiration = Math.min(Math.max(expiresInSeconds, 1), 3600);
    }

    const token = makeJWT(user.id, expiration, config.api.jwtSecret);

    res.status(200).json({
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      token: token,
    });
  } catch (err) {
    next(err);
  }
});

// Create user endpoint with argon2 hashing protection
app.post("/api/users", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      throw new BadRequestError("Missing email field");
    }
    if (!password) {
      throw new BadRequestError("Missing password field");
    }

    const hashedPassword = await hashPassword(password);
    const user = await createUser({ email, hashedPassword });

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

// Get single chirp (screech) by ID singleton endpoint
app.get("/api/chirps/:chirpId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chirpId } = req.params;
    const chirp = await getChirpById(String(chirpId)); 

    if (!chirp) {
      throw new NotFoundError("Chirp not found");
    }

    res.status(200).json(chirp);
  } catch (err) {
    next(err);
  }
});

// Get all chirps (screeches) collection endpoint
app.get("/api/chirps", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chirps = await getAllChirps();
    res.status(200).json(chirps);
  } catch (err) {
    next(err);
  }
});

// Create chirp (screech) endpoint - NOW AUTHENTICATED
app.post("/api/chirps", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getBearerToken(req);
    const userId = validateJWT(token, config.api.jwtSecret);
    
    const { body } = req.body;

    if (!body) {
      throw new BadRequestError("Missing body field");
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

    const chirp = await createChirp({ body: cleanedBody, userId });
    
    res.status(201).json({
      id: chirp.id,
      createdAt: chirp.createdAt,
      updatedAt: chirp.updatedAt,
      body: chirp.body,
      userId: chirp.userId,
    });
  } catch (err) {
    if (err instanceof Error && (err.message.includes("token") || err.message.includes("Authorization"))) {
      return next(new UnauthorizedError(err.message));
    }
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
  await deleteAllChirps();
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
    console.error(err);
    res.status(500).json({ error: "Something went wrong on our end" });
  }
};

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Screecher is roosting at http://localhost:${PORT}`);
});
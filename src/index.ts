// src/index.ts

import express, { Request, Response, NextFunction } from "express";
import { config } from "./config.js";

const app = express();
const PORT = 8080;

// This middleware parses incoming JSON requests automatically
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
  config.fileserverHits += 1;
  next();
};

// --- API ENDPOINTS ---

app.post("/api/validate_chirp", (req: Request, res: Response) => {
  const { body } = req.body;

  if (body.length > 140) {
    res.status(400).json({ error: "Chirp is too long" });
    return;
  }

  res.status(200).json({ valid: true });
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
    <p>Chirpy has been visited ${config.fileserverHits} times!</p>
  </body>
</html>`);
});

// Admin Reset endpoint
app.post("/admin/reset", (req: Request, res: Response) => {
  config.fileserverHits = 0;
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

app.listen(PORT, () => {
  console.log(`Screecher is roosting at http://localhost:${PORT}`);
});
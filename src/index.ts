// src/index.ts

import express, { Request, Response, NextFunction } from "express";
import { config } from "./config.js"; // Note the .js extension!

const app = express();
const PORT = 8080;

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

// Readiness endpoint
app.get("/healthz", (req: Request, res: Response) => {
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.status(200).send("OK");
});

// Metrics endpoint
app.get("/metrics", (req: Request, res: Response) => {
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send(`Hits: ${config.fileserverHits}`);
});

// Reset endpoint
app.get("/reset", (req: Request, res: Response) => {
  config.fileserverHits = 0;
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.status(200).send("OK");
});

app.get("/", (req, res) => {
  res.redirect("/app");
});

// Mount static files at /app
// We apply the middleware ONLY to this route
app.use("/app", middlewareMetricsInc, express.static("./src/app"));
app.use("/assets", express.static("./src/app/assets"));

app.post("/echo", (req, res) => {
  res.json(req.body);
});

app.listen(PORT, () => {
  console.log(`Screecher is roosting at http://localhost:${PORT}`);
});
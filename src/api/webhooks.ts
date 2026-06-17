// src/api/webhooks.ts

import type { Request, Response, NextFunction } from "express";
import { config } from "../config.js";
import { getAPIKey } from "../auth.js";
import { upgradeUserToChirpyRed } from "../db/queries/users/users.js";
import { NotFoundError, UnauthorizedError } from "./errors.js";

export async function handlerWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const apiKey = getAPIKey(req);
    if (apiKey !== config.api.polkaKey) {
      throw new UnauthorizedError("Invalid API Key");
    }
  } catch (err) {
    // If getAPIKey throws or the key is wrong, we want a 401
    return next(new UnauthorizedError("Invalid or missing API key"));
  }

  const { event, data } = req.body;

  if (event !== "user.upgraded") {
    res.status(204).send();
    return;
  }

  try {
    const user = await upgradeUserToChirpyRed(data.userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
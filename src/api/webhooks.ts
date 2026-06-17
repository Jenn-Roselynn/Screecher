// src/api/webhooks.ts
import type { Request, Response, NextFunction } from "express";
import { upgradeUserToChirpyRed } from "../db/queries/users/users.js";
import { NotFoundError } from "./errors.js";

export async function handlerWebhook(req: Request, res: Response, next: NextFunction) {
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
    
    // Returning 204 No Content as is standard for webhook acknowledgments
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
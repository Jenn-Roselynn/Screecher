// src/api/auth-helpers.ts

import type { Request } from "express";
import { config } from "../config.js";
import { getBearerToken, validateJWT } from "../auth.js";
import { UnauthorizedError } from "./errors.js";

export function getAuthenticatedUserId(req: Request): string {
  try {
    const token = getBearerToken(req);
    return validateJWT(token, config.api.jwtSecret);
  } catch (err) {
    // Wrapping the error ensures the calling route handler 
    // doesn't have to know about JWT parsing specifics.
    throw new UnauthorizedError("Invalid or missing token");
  }
}
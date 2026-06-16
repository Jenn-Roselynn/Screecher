// src/api/auth-tokens.ts

import type { Request, Response } from "express";
import { getBearerToken } from "../auth.js";

/**
 * Centralized logic for extracting a refresh token.
 * Currently supports Bearer tokens, but can be updated 
 * later to check for HttpOnly cookies.
 */
export function getRefreshTokenFromRequest(req: Request): string {
  return getBearerToken(req);
}

/**
 * Centralized logic for returning the refresh token to the client.
 * Currently returns in JSON, but can be updated later to 
 * also set an HttpOnly cookie for browsers.
 */
export function getRefreshTokenResponseFields(
  _res: Response,
  refreshToken: string,
): { refreshToken: string } {
  return { refreshToken };
}
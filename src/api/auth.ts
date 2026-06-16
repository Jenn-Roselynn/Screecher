// src/api/auth.ts

import type { Request, Response, NextFunction } from "express";
import { config } from "../config.js";
import { getUserByEmail } from "../db/queries/users/users.js";
import { 
  createRefreshToken, 
  getValidRefreshTokenWithUser, 
  revokeRefreshToken 
} from "../db/queries/refresh-tokens/refresh-tokens.js";
import { 
  checkPasswordHash, 
  makeJWT, 
  makeRefreshToken, 
  getBearerToken 
} from "../auth.js";
import { BadRequestError, UnauthorizedError } from "./errors.js";

// POST /api/login
export async function handlerLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

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

    // Access tokens (JWTs) always expire after 1 hour (3600 seconds) per lesson spec
    const accessToken = makeJWT(user.id, 3600, config.api.jwtSecret);

    // Generate a random 256-bit refresh token
    const tokenString = makeRefreshToken();
    
    // Refresh tokens expire after 60 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60);

    await createRefreshToken({
      token: tokenString,
      userId: user.id,
      expiresAt: expiresAt,
      revokedAt: null,
    });

    res.status(200).json({
      id: user.id,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      email: user.email,
      token: accessToken,
      refreshToken: tokenString,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/refresh
export async function handlerRefresh(req: Request, res: Response, next: NextFunction) {
  try {
    const tokenString = getBearerToken(req);
    const tokenRecord = await getValidRefreshTokenWithUser(tokenString);

    if (!tokenRecord) {
      throw new UnauthorizedError("Invalid or missing refresh token");
    }

    // Check if expired
    if (new Date() > new Date(tokenRecord.expiresAt)) {
      throw new UnauthorizedError("Refresh token has expired");
    }

    // Check if revoked
    if (tokenRecord.revokedAt !== null) {
      throw new UnauthorizedError("Refresh token has been revoked");
    }

    // Issue a brand new access token valid for 1 hour
    const newAccessToken = makeJWT(tokenRecord.user.id, 3600, config.api.jwtSecret);

    res.status(200).json({
      token: newAccessToken,
    });
  } catch (err) {
    if (err instanceof Error && (err.message.includes("token") || err.message.includes("Authorization"))) {
      return next(new UnauthorizedError(err.message));
    }
    next(err);
  }
}

// POST /api/revoke
export async function handlerRevoke(req: Request, res: Response, next: NextFunction) {
  try {
    const tokenString = getBearerToken(req);
    
    // Set revoked_at to current timestamp in the database
    await revokeRefreshToken(tokenString);

    // 204 Status Code means request was successful, but no response body is returned
    res.status(204).send();
  } catch (err) {
    if (err instanceof Error && (err.message.includes("token") || err.message.includes("Authorization"))) {
      return next(new UnauthorizedError(err.message));
    }
    next(err);
  }
}
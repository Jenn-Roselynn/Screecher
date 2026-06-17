// src/auth.ts

import argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { Request } from "express";
import crypto from "crypto";

export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password);
}

export async function checkPasswordHash(password: string, hash: string): Promise<boolean> {
  return await argon2.verify(hash, password);
}

export function makeJWT(userID: string, expiresIn: number, secret: string): string {
  const payload: Pick<JwtPayload, "iss" | "sub" | "iat" | "exp"> = {
    iss: "chirpy",
    sub: userID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresIn,
  };

  return jwt.sign(payload, secret);
}

export function validateJWT(tokenString: string, secret: string): string {
  try {
    const decoded = jwt.verify(tokenString, secret) as JwtPayload;

    if (typeof decoded.sub !== "string") {
      throw new Error("Invalid token: missing or invalid subject");
    }

    return decoded.sub;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

export function getBearerToken(req: Request): string {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    throw new Error("Missing Authorization header");
  }
  
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
    throw new Error("Invalid Authorization header format");
  }
  
  return parts[1].trim();
}

// Added function to extract the API Key from the Authorization header
export function getAPIKey(req: Request): string {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    throw new Error("Missing Authorization header");
  }
  
  // Expecting format: "ApiKey THE_KEY_HERE"
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "ApiKey" || !parts[1]) {
    throw new Error("Invalid Authorization header format");
  }
  
  return parts[1].trim();
}

export function makeRefreshToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
// src/auth.ts

import argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

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

    if (!decoded.sub) {
      throw new Error("Invalid token: missing subject");
    }

    return decoded.sub;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}
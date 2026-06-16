// src/db/queries/refresh-tokens/refresh-tokens.ts

import { db } from "../../index.js";
import { NewRefreshToken, refreshTokens, users } from "../../schema.js";
import { eq } from "drizzle-orm";
import { createHash } from "node:crypto";

/**
 * Hashes a token using SHA-256 for secure storage at rest.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createRefreshToken(tokenData: NewRefreshToken) {
  // We hash the token before it hits the database
  const hashedToken = hashToken(tokenData.token);
  
  const [result] = await db
    .insert(refreshTokens)
    .values({
      ...tokenData,
      token: hashedToken,
    })
    .returning();
  return result;
}

export async function getRefreshTokenWithUser(token: string) {
  // We hash the incoming token to match what's in the DB
  const hashedToken = hashToken(token);

  const results = await db
    .select({
      token: refreshTokens.token,
      expiresAt: refreshTokens.expiresAt,
      revokedAt: refreshTokens.revokedAt,
      user: {
        id: users.id,
        email: users.email,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      },
    })
    .from(refreshTokens)
    .innerJoin(users, eq(refreshTokens.userId, users.id))
    .where(eq(refreshTokens.token, hashedToken));

  return results[0];
}

export async function revokeRefreshToken(token: string) {
  const hashedToken = hashToken(token);
  const now = new Date();
  
  const [result] = await db
    .update(refreshTokens)
    .set({
      revokedAt: now,
      updatedAt: now,
    })
    .where(eq(refreshTokens.token, hashedToken))
    .returning();
  return result;
}

export async function deleteAllRefreshTokens() {
  await db.delete(refreshTokens);
}
// src/db/queries/refresh-tokens/refresh-tokens.ts

import { db } from "../../index.js";
import { NewRefreshToken, refreshTokens, users } from "../../schema.js";
import { eq } from "drizzle-orm";

export async function createRefreshToken(tokenData: NewRefreshToken) {
  const [result] = await db
    .insert(refreshTokens)
    .values(tokenData)
    .returning();
  return result;
}

export async function getValidRefreshTokenWithUser(token: string) {
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
        hashedPassword: users.hashedPassword,
      },
    })
    .from(refreshTokens)
    .innerJoin(users, eq(refreshTokens.userId, users.id))
    .where(eq(refreshTokens.token, token));

  return results[0];
}

export async function revokeRefreshToken(token: string) {
  const now = new Date();
  const [result] = await db
    .update(refreshTokens)
    .set({
      revokedAt: now,
      updatedAt: now,
    })
    .where(eq(refreshTokens.token, token))
    .returning();
  return result;
}

export async function deleteAllRefreshTokens() {
  await db.delete(refreshTokens);
}
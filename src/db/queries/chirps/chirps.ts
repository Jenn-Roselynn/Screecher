// src/db/queries/chirps/chirps.ts

import { db } from "../../index.js";
import { NewChirp, chirps } from "../../schema.js";
import { asc } from "drizzle-orm";

export async function createChirp(chirp: NewChirp) {
  const [result] = await db
    .insert(chirps)
    .values(chirp)
    .returning({
      id: chirps.id,
      createdAt: chirps.createdAt,
      updatedAt: chirps.updatedAt,
      body: chirps.body,
      userId: chirps.userId,
    });
  return result;
}

export async function getAllChirps() {
  return await db
    .select({
      id: chirps.id,
      createdAt: chirps.createdAt,
      updatedAt: chirps.updatedAt,
      body: chirps.body,
      userId: chirps.userId,
    })
    .from(chirps)
    .orderBy(asc(chirps.createdAt));
}

export async function deleteAllChirps() {
  await db.delete(chirps);
}
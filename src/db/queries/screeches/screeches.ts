// src/db/queries/screeches/screeches.ts

import { db } from "../../index.js";
import { NewChirp, chirps } from "../../schema.js"; // import { NewScreech, screeches } from "../../schema.js";
import { asc, eq } from "drizzle-orm";

export async function createScreech(screech: NewChirp) { // export async function createScreech(screech: NewScreech) {
  const [result] = await db
    .insert(chirps) // .insert(screeches)
    .values(screech)
    .returning({
      id: chirps.id,
      createdAt: chirps.createdAt,
      updatedAt: chirps.updatedAt,
      body: chirps.body,
      userId: chirps.userId,
    });
  return result;
}

export async function getAllScreeches() {
  return await db
    .select({
      id: chirps.id,
      createdAt: chirps.createdAt,
      updatedAt: chirps.updatedAt,
      body: chirps.body,
      userId: chirps.userId,
    })
    .from(chirps) // .from(screeches)
    .orderBy(asc(chirps.createdAt));
}

export async function getScreechById(id: string) {
  const [result] = await db
    .select({
      id: chirps.id,
      createdAt: chirps.createdAt,
      updatedAt: chirps.updatedAt,
      body: chirps.body,
      userId: chirps.userId,
    })
    .from(chirps) // .from(screeches)
    .where(eq(chirps.id, id));
  return result;
}

export async function deleteScreech(id: string) {
  await db.delete(chirps).where(eq(chirps.id, id));
}

export async function deleteAllScreeches() {
  await db.delete(chirps); // await db.delete(screeches);
}
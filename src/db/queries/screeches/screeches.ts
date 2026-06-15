// src/db/queries/screeches/screeches.ts

import { db } from "../../index.js";
import { NewChirp, chirps } from "../../schema.js"; // import { NewScreech, screeches } from "../../schema.js";

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

export async function deleteAllScreeches() {
  await db.delete(chirps); // await db.delete(screeches);
}

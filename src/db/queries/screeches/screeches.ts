// src/db/queries/screeches/screeches.ts

import { db } from "../../index.js";
import { NewScreech, screeches } from "../../schema.js";
import { asc, eq } from "drizzle-orm";

export async function createScreech(screech: NewScreech) {
  const [result] = await db
    .insert(screeches)
    .values(screech)
    .returning({
      id: screeches.id,
      createdAt: screeches.createdAt,
      updatedAt: screeches.updatedAt,
      body: screeches.body,
      userId: screeches.userId,
    });
  return result;
}

export async function getAllScreeches() {
  return await db
    .select({
      id: screeches.id,
      createdAt: screeches.createdAt,
      updatedAt: screeches.updatedAt,
      body: screeches.body,
      userId: screeches.userId,
    })
    .from(screeches)
    .orderBy(asc(screeches.createdAt));
}

export async function getScreechById(id: string) {
  const [result] = await db
    .select({
      id: screeches.id,
      createdAt: screeches.createdAt,
      updatedAt: screeches.updatedAt,
      body: screeches.body,
      userId: screeches.userId,
    })
    .from(screeches)
    .where(eq(screeches.id, id));
  return result;
}

export async function deleteScreech(id: string) {
  await db.delete(screeches).where(eq(screeches.id, id));
}

export async function deleteAllScreeches() {
  await db.delete(screeches);
}
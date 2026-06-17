// src/db/queries/users/users.ts

import { db } from "../../index.js";
import { NewUser, users } from "../../schema.js";
import { eq } from "drizzle-orm";

export async function createUser(user: NewUser) {
  const [result] = await db
    .insert(users)
    .values(user)
    .returning({
      id: users.id,
      email: users.email,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      hashedPassword: users.hashedPassword,
      isChirpyRed: users.isChirpyRed,
    });
  return result;
}

export async function getUserByEmail(email: string) {
  const [result] = await db
    .select({
      id: users.id,
      email: users.email,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      hashedPassword: users.hashedPassword,
      isChirpyRed: users.isChirpyRed,
    })
    .from(users)
    .where(eq(users.email, email));
  
  return result;
}

export async function updateUser(id: string, email: string, hashedPassword: string) {
  const [result] = await db
    .update(users)
    .set({
      email,
      hashedPassword,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      email: users.email,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      isChirpyRed: users.isChirpyRed,
    });
  return result;
}

export async function upgradeUserToChirpyRed(id: string) {
  const [result] = await db
    .update(users)
    .set({
      isChirpyRed: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      isChirpyRed: users.isChirpyRed,
    });
  
  return result;
}

export async function deleteAllUsers() {
  await db.delete(users);
}
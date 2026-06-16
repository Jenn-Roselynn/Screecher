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
    })
    .from(users)
    .where(eq(users.email, email));
  
  return result;
}

export async function deleteAllUsers() {
  await db.delete(users);
}
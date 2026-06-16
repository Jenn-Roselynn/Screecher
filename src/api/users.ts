// src/api/users.ts

import type { Request, Response, NextFunction } from "express";
import { createUser } from "../db/queries/users/users.js";
import { hashPassword } from "../auth.js";
import { BadRequestError } from "./errors.js";

// POST /api/users
export async function handlerCreateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    if (!email) {
      throw new BadRequestError("Missing email field");
    }
    if (!password) {
      throw new BadRequestError("Missing password field");
    }

    const hashedPassword = await hashPassword(password);
    const user = await createUser({ email, hashedPassword });

    res.status(201).json({
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    next(err);
  }
}
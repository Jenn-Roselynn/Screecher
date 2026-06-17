// src/api/users.ts

import type { Request, Response, NextFunction } from "express";
import { createUser, updateUser } from "../db/queries/users/users.js";
import { hashPassword } from "../auth.js";
import { BadRequestError } from "./errors.js";
import { getAuthenticatedUserId } from "./auth-helpers.js";

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

// PUT /api/users
export async function handlerUpdateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getAuthenticatedUserId(req);
    const { email, password } = req.body;

    if (!email) {
      throw new BadRequestError("Missing email field");
    }
    if (!password) {
      throw new BadRequestError("Missing password field");
    }

    const hashedPassword = await hashPassword(password);
    const updatedUser = await updateUser(userId, email, hashedPassword);

    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
}
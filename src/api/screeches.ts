// src/api/screeches.ts

import type { Request, Response, NextFunction } from "express";
import { createScreech, getAllScreeches, getScreechById } from "../db/queries/screeches/screeches.js";
import { getAuthenticatedUserId } from "./auth-helpers.js";
import { BadRequestError, NotFoundError, UnauthorizedError } from "./errors.js";

// GET /api/screeches/:screechId
export async function handlerGetScreechById(req: Request, res: Response, next: NextFunction) {
  try {
    const { screechId } = req.params;
    const screech = await getScreechById(String(screechId)); 

    if (!screech) {
      throw new NotFoundError("Screech not found");
    }

    res.status(200).json(screech);
  } catch (err) {
    next(err);
  }
}

// GET /api/screeches
export async function handlerGetAllScreeches(req: Request, res: Response, next: NextFunction) {
  try {
    const screeches = await getAllScreeches();
    res.status(200).json(screeches);
  } catch (err) {
    next(err);
  }
}

// POST /api/screeches
export async function handlerCreateScreech(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getAuthenticatedUserId(req);
    
    const { body } = req.body;

    if (!body) {
      throw new BadRequestError("Missing body field");
    }
    if (body.length > 140) {
      throw new BadRequestError("Screech is too long. Max length is 140");
    }

    const badWords = ["kerfuffle", "sharbert", "fornax"];
    const words = body.split(" ");
    
    const cleanedWords = words.map((word: string) => {
      const lowerWord = word.toLowerCase();
      if (badWords.includes(lowerWord)) {
        return "****";
      }
      return word;
    });

    const cleanedBody = cleanedWords.join(" ");

    const screech = await createScreech({ body: cleanedBody, userId });
    
    res.status(201).json({
      id: screech.id,
      createdAt: screech.createdAt,
      updatedAt: screech.updatedAt,
      body: screech.body,
      userId: screech.userId,
    });
  } catch (err) {
    next(err);
  }
}
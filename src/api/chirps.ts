// src/api/chirps.ts

import type { Request, Response, NextFunction } from "express";
import { config } from "../config.js";
import { createChirp, getAllChirps, getChirpById } from "../db/queries/chirps/chirps.js";
import { getBearerToken, validateJWT } from "../auth.js";
import { BadRequestError, NotFoundError, UnauthorizedError } from "./errors.js";

// GET /api/chirps/:chirpId
export async function handlerGetChirpById(req: Request, res: Response, next: NextFunction) {
  try {
    const { chirpId } = req.params;
    const chirp = await getChirpById(String(chirpId)); 

    if (!chirp) {
      throw new NotFoundError("Chirp not found");
    }

    res.status(200).json(chirp);
  } catch (err) {
    next(err);
  }
}

// GET /api/chirps
export async function handlerGetAllChirps(req: Request, res: Response, next: NextFunction) {
  try {
    const chirps = await getAllChirps();
    res.status(200).json(chirps);
  } catch (err) {
    next(err);
  }
}

// POST /api/chirps
export async function handlerCreateChirp(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req);
    const userId = validateJWT(token, config.api.jwtSecret);
    
    const { body } = req.body;

    if (!body) {
      throw new BadRequestError("Missing body field");
    }
    if (body.length > 140) {
      throw new BadRequestError("Chirp is too long. Max length is 140");
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

    const chirp = await createChirp({ body: cleanedBody, userId });
    
    res.status(201).json({
      id: chirp.id,
      createdAt: chirp.createdAt,
      updatedAt: chirp.updatedAt,
      body: chirp.body,
      userId: chirp.userId,
    });
  } catch (err) {
    if (err instanceof Error && (err.message.includes("token") || err.message.includes("Authorization"))) {
      return next(new UnauthorizedError(err.message));
    }
    next(err);
  }
}
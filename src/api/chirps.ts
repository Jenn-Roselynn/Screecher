// src/api/chirps.ts

import type { Request, Response, NextFunction } from "express";
import { 
  createChirp, 
  getAllChirps, 
  getChirpById, 
  deleteChirp 
} from "../db/queries/chirps/chirps.js";
import { getAuthenticatedUserId } from "./auth-helpers.js";
import { 
  BadRequestError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError 
} from "./errors.js";

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
    let authorId: string | undefined = undefined;
    const authorIdQuery = req.query.authorId;
    
    if (typeof authorIdQuery === "string") {
      authorId = authorIdQuery;
    }

    let chirps = await getAllChirps(authorId);

    const sortQuery = req.query.sort;
    if (typeof sortQuery === "string" && sortQuery.toLowerCase() === "desc") {
      chirps.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
    } else {
      // Default or explicit 'asc' sorting
      chirps.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeA - timeB;
      });
    }

    res.status(200).json(chirps);
  } catch (err) {
    next(err);
  }
}

// POST /api/chirps
export async function handlerCreateChirp(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getAuthenticatedUserId(req);
    
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
    next(err);
  }
}

// DELETE /api/chirps/:chirpId
export async function handlerDeleteChirp(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getAuthenticatedUserId(req);
    const { chirpId } = req.params;

    const chirp = await getChirpById(String(chirpId));
    if (!chirp) {
      throw new NotFoundError("Chirp not found");
    }

    if (chirp.userId !== userId) {
      throw new ForbiddenError("Cannot delete someone else's chirp");
    }

    await deleteChirp(String(chirpId));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
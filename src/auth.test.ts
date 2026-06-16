// src/auth.test.ts

import { describe, it, expect } from "vitest";
import { makeJWT, validateJWT } from "./auth.js";

describe("JWT Authentication", () => {
  const secret = "super-secret-key";
  const userID = "user-123";

  it("should create and validate a JWT successfully", () => {
    const token = makeJWT(userID, 3600, secret);
    const sub = validateJWT(token, secret);
    expect(sub).toBe(userID);
  });

  it("should throw an error for a token signed with the wrong secret", () => {
    const token = makeJWT(userID, 3600, "wrong-secret");
    expect(() => validateJWT(token, secret)).toThrow("Invalid or expired token");
  });

  it("should throw an error for an expired token", () => {
    // Create a token that expired 1 hour ago (-3600 seconds)
    const expiredToken = makeJWT(userID, -3600, secret);
    expect(() => validateJWT(expiredToken, secret)).toThrow("Invalid or expired token");
  });
});
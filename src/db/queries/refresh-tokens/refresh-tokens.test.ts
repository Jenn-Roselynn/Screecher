// src/db/queries/refresh-tokens/refresh-tokens.test.ts

import { describe, it, expect } from "vitest";
import { hashToken } from "./refresh-tokens.js";

describe("Refresh Token Hashing", () => {
  it("should produce the same hash for the same token", () => {
    const token = "super-secret-random-string";
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it("should produce a different hash for a different token", () => {
    expect(hashToken("token-a")).not.toBe(hashToken("token-b"));
  });
});
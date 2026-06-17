# Screecher Backend API 🐦✨

A high-performance, production-ready RESTful microblogging backend engine built from scratch using TypeScript, Node.js, and Express. This platform implements robust relational data models, structured database migration pipelines, secure cryptographic authentication mechanisms, and an optimized stateful persistence layer backed by PostgreSQL and Drizzle ORM.

This project is an advanced, production-grade evolution based on the core architectural milestones learned during the official [Boot.dev Guided Project](https://www.boot.dev/courses/learn-http-servers-typescript).

* **Course Authors:** Boot.Dev Team 🧙🐻👩‍💻
* **Implemented By:** Jenn Roselynn 🦇✨🌙

---

## 📋 Project & Architecture Overview

* **System Design Strategy:** Modular layer separation isolating HTTP routing layers, error handling middleware, and structural data access query objects.
* **Core Engineering Scope:** Type-safe relational database management, stateless identity provisioning, automated migration generation, and runtime request-response parsing.

---

## 🛠️ Key Architectural Features

* **Relational Persistence Tier:** Leverages Drizzle ORM with PostgreSQL to enforce data schemas over relational entities (Users, Chirps/Screeches, and Refresh Tokens) with absolute database-level integrity constraints.
* **Dual-Token Authentication Pipeline:** Implements secure stateless authentication utilizing short-lived JWT access tokens alongside a stateful, cryptographically secure database-backed refresh token loop for persistent, tamper-proof user sessions.
* **Streamlined Data Optimization:** Features high-performance in-memory sorting algorithms utilizing upfront boolean evaluation and concise ternary structures to process multi-directional chronological arrays (`asc`/`desc`) over ISO 8601 timestamps.
* **Advanced Content Sanitization Middleware:** Intercepts incoming data streams to perform multi-stage payload verification, character restriction validation (140-character maximum limits), and dynamic profanity scrubbing filters before committing writes to disk.
* **Global Error Hierarchy:** Centralizes system failures using a deterministic, middleware-driven tracking matrix that converts standard application exceptions (`BadRequestError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`) into predictable, structured JSON HTTP responses.

---

## 🚦 REST API Endpoint Specifications

All public and private routing surfaces accept and return `application/json` payloads. Private endpoints require a valid JWT passed via the `Authorization: Bearer <token>` header.

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/users` | None | Registers a new user account with secure, hashed password storage. |
| `POST` | `/api/login` | None | Authenticates identity credentials and issues dual access/refresh tokens. |
| `POST` | `/api/refresh` | None | Validates a persistent refresh token to securely reissue a fresh short-lived JWT. |
| `POST` | `/api/revoke` | None | Explicitly revokes an active refresh token, immediately terminating the session. |

### Chirps / Screeches Endpoints

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/chirps` | None | Retrieves a filtered, chronological collection of all messages. Supports optional query filters: `authorId` (UUID string) and `sort` (`asc` or `desc`). |
| `GET` | `/api/chirps/:chirpId` | None | Fetches the complete statistical payload profile of a single specified message by its unique ID. |
| `POST` | `/api/chirps` | **JWT** | Validates user identity parameters and commits a new sanitized message to the data layer. |
| `DELETE` | `/api/chirps/:chirpId` | **JWT** | Confirms ownership contexts and permanently deletes the specified resource. |

### System Administration

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/admin/reset` | None | Database cleanup routine that resets schemas to a clean testing state. |

---

## 🖥️ Production API Interaction Examples

### 1. Authenticating & Acquiring Tokens
```bash
POST /api/login
Request Body:
{
  "email": "walt@breakingbad.com",
  "password": "123456"
}

Response (200 OK):
{
  "id": "6218aedf-48b6-4e21-a58c-37dcef4ee3f1",
  "email": "walt@breakingbad.com",
  "isChirpyRed": false,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "83685ca006894cde370c40b7f851a56fa83fa8c3a0ff05f8f818a1fbee5e49c1",
  "createdAt": "2026-06-16T21:00:18.133Z",
  "updatedAt": "2026-06-16T21:00:18.133Z"
}

```

### 2. Listing and Sorting Content Chronologically

```bash
GET /api/chirps?sort=desc

Response (200 OK):
[
  {
    "id": "77fbdff4-948b-4d98-a34d-17dfc6f8b56a",
    "body": "Darn that fly, I just wanna cook",
    "userId": "6218aedf-48b6-4e21-a58c-37dcef4ee3f1",
    "createdAt": "2026-06-16T21:00:18.202Z",
    "updatedAt": "2026-06-16T21:00:18.202Z"
  },
  {
    "id": "e56deb4c-6342-40c6-a2a2-98af72a7c75f",
    "body": "Cmon Pinkman",
    "userId": "6218aedf-48b6-4e21-a58c-37dcef4ee3f1",
    "createdAt": "2026-06-16T21:00:18.197Z",
    "updatedAt": "2026-06-16T21:00:18.197Z"
  }
]

```

---

## ⚙️ Development, Deployment, and Setup

### 1. Prerequisites

Ensure your system has Node.js installed. This project uses an `.nvmrc` configuration file for strict runtime tracking alignment:

```bash
nvm use

```

### 2. Installation

Pull down local dependencies, Express TypeScript type definitions, hashing engines, and environment utilities:

```bash
npm install

```

### 3. Environment Configuration

Create a localized `.env` resource configuration block in your project root to handle active system contexts securely:

```env
PORT=8080
DB_URL=postgres://username:password@localhost:5432/screecher_db
JWT_SECRET=your_super_secret_cryptographic_key_here

```

### 4. Compiling & Schema Migration Management

Compile your local type definitions, automatically trace schema structural topologies via Drizzle Kit, and generate/execute database schema synchronizations:

```bash
# Compile TypeScript files
npm run build

# Generate and apply relational database migrations
npx drizzle-kit generate
npx drizzle-kit migrate

```

### 5. Running the Application Server

Launch the compiled system architecture backend. The routing network hot-reloads and hosts active server instances immediately:

```bash
npm run dev

```

```text
◇ injected env (4) from .env
Screecher is roosting at http://localhost:8080

```

---

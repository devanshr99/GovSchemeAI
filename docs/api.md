# REST API Reference Documentation

This document describes the API endpoints exposed by the **GovSchemeAI** FastAPI backend service.

---

## 🔒 Authentication & Headers

Protected admin endpoints require JSON Web Tokens (JWT) for authentication.
* **Header Format**: `Authorization: Bearer <your-admin-jwt-token>`
* **CORS Details**: The server accepts calls originating from localhost dev servers or production deployment domains configured under `ALLOWED_ORIGINS`.

---

## 📡 API Endpoints Index

### 1. Diagnostics & Health

#### `GET /live`
Verifies that the FastAPI application instance is alive.
* **Response**: `200 OK`
* **JSON Output**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-07-05T23:44:00Z"
  }
  ```

#### `GET /ready`
Runs deep dependency verification checking database connection status and worker pool loops.
* **Response**: `200 OK` (or `503 Service Unavailable` if DB connection fails).

---

### 2. Schemes & Categories Catalog

#### `GET /schemes`
Lists schemes with support for search keywords, paging, and filters.
* **Query Parameters**:
  * `page` (integer, default: 1)
  * `size` (integer, default: 10)
  * `category` (string, optional)
  * `level` (string, optional - `central` or `state`)
  * `state_code` (string, optional)
* **Response `200 OK`**:
  ```json
  {
    "items": [
      {
        "id": "e2ba-49f59ac451b9",
        "name": "Pradhan Mantri Fasal Bima Yojana",
        "slug": "pm-fasal-bima-yojana",
        "ministry": "Ministry of Agriculture",
        "benefits_amount": "Varies by crop",
        "is_active": true
      }
    ],
    "total": 125,
    "page": 1,
    "pages": 13
  }
  ```

#### `GET /schemes/{slug}`
Retrieves full details of a specific scheme.
* **Path Parameter**: `slug` (string)
* **Response `200 OK`**:
  ```json
  {
    "id": "e2ba-49f59ac451b9",
    "name": "Pradhan Mantri Fasal Bima Yojana",
    "slug": "pm-fasal-bima-yojana",
    "description": "Insurance service for farmers...",
    "eligibility_rules": [
      {
        "rule_type": "occupation",
        "operator": "eq",
        "value": "farmer"
      }
    ]
  }
  ```

---

### 3. Smart Eligibility Checker

#### `POST /eligibility/check`
Compares a citizen's profile attributes against database rules to check eligibility.
* **Request Payload**:
  ```json
  {
    "age": 28,
    "gender": "male",
    "state_code": "MH",
    "income": 120000,
    "occupation": "farmer",
    "is_student": false
  }
  ```
* **Response `200 OK`**:
  ```json
  {
    "eligible": true,
    "matched_schemes": [
      {
        "id": "e2ba-49f59ac451b9",
        "name": "PM Kisan Samman Nidhi",
        "confidence": 1.0
      }
    ],
    "ineligible_schemes": []
  }
  ```

---

### 4. RAG Chat Assistant

#### `POST /chat/ask`
Sends questions to the AI assistant using context-aware RAG vector search models.
* **Request Payload**:
  ```json
  {
    "message": "What benefits do I get as a farmer in Maharashtra under PM Kisan?",
    "history": [
      {
        "role": "user",
        "content": "Hello"
      },
      {
        "role": "assistant",
        "content": "Hi there! How can I help you today?"
      }
    ]
  }
  ```
* **Response `200 OK`**:
  ```json
  {
    "answer": "Under the PM Kisan Samman Nidhi scheme, you receive an income support of ₹6,000 per year...",
    "sources": [
      {
        "title": "PM Kisan Samman Nidhi",
        "url": "https://pmkisan.gov.in/"
      }
    ]
  }
  ```

---

### 5. Admin Panel & Controls (Protected)

#### `POST /admin/updates/trigger`
Starts a background update run: executes web scraper daemons, crawls government portals, routes raw payloads to AI extraction engines, and updates system schemas.
* **Headers**: Bearer Token required.
* **Response `202 Accepted`**:
  ```json
  {
    "run_id": "update-run-uuid-12345",
    "status": "triggered",
    "message": "Scraper update execution started in background worker."
  }
  ```

#### `POST /backup/create`
Runs database dump exports, compressing schemas to zip directories.
* **Headers**: Bearer Token required.
* **Response `201 Created`**:
  ```json
  {
    "backup_id": "bk-2026-07-05",
    "status": "completed",
    "file_size_bytes": 451200
  }
  ```

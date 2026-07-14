# Security & Hardening Architecture Guide

This document describes the security designs, middleware layers, cryptographic choices, and validation patterns implemented in **GovSchemeAI**.

---

## 🛡️ Network & CORS Policies

Cross-Origin Resource Sharing (CORS) rules prevent malicious web scripts from accessing API resources.
* **Backend CORS Configuration**:
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["http://localhost:3000", "http://localhost:3001", "https://govscheme-ai.vercel.app"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```
* **Vercel Edge Proxying**: By routing all client calls through Next.js proxy rewrites, direct backend exposure is minimized, preventing cookie-hijacking and cross-site scripts.

---

## 🔒 Session Security & Authorization (JWT)

Admin access is protected using **JSON Web Tokens (JWT)**:
* **Token Signature**: Signed using `HS256` symmetric encryption via a strong, system-configured `JWT_SECRET`.
* **Token Content**: Contains the token issuer, issuance timestamp (`iat`), user email claims, and explicit token expiration boundaries (`exp`, defaulting to 24 hours).
* **Cryptographic Storage**: User credentials stored in database tables use **bcrypt** salts, protecting passwords against database leak vulnerabilities.

---

## 🛠️ Security Middleware Pipeline

GovSchemeAI implements custom middleware to protect the web server:

### 1. Security Headers (`SecurityHeadersMiddleware`)
Forces client browsers to apply security features by setting the following response headers:
* `Content-Security-Policy (CSP)`: Dictates authorized sources for scripts, fonts, styles, and imagery.
* `X-Frame-Options: DENY`: Mitigates clickjacking attacks.
* `X-Content-Type-Options: nosniff`: Prevents mime-sniffing exploits.
* `Strict-Transport-Security (HSTS)`: Restricts browser traffic to HTTPS.

### 2. Request Size Constraints (`RequestSizeLimitMiddleware`)
* Intercepts `Content-Length` headers.
* Rejects payloads larger than `5MB` with an HTTP `413 Payload Too Large` error, mitigating memory-exhaustion exploits.

### 3. Client Rate Limiter (`RateLimitMiddleware`)
* Tracks connection counts per IP on a moving 60-second window.
* Rejects calls exceeding `100 requests/min` with an HTTP `429 Too Many Requests` code.
* Uses an asynchronous cleanup loop to purge stale client data and prevent memory leaks.

---

## 🗄️ Database Protection (SQL Injection)

* **SQLAlchemy Async Execution**: Raw SQL queries are avoided. Database CRUD calls use SQLAlchemy's Object Relational Mapper (ORM), which automatically sanitizes inputs using parameterized query structures.
* **Pydantic Validation**: Payload inputs (such as ages, dates, state codes) are validated by Pydantic models, blocking invalid inputs before they reach the database queries.

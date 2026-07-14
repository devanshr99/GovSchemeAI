# Frontend Architecture & Development Guide

This document describes the design, folder structure, state management, and routing policies of the **GovSchemeAI** Next.js user interface.

---

## 📁 Frontend Directory Layout

The Next.js client is located under the `/frontend` directory and is structured to leverage TypeScript and modern React standards.

```
frontend/src/
├── app/                        # Next.js App Router (Pages, Layouts, CSS)
│   ├── about-developer/        # Developer profile & credentials layout
│   ├── admin/                  # Admin control panel UI pages
│   ├── chat/                   # Interactive AI RAG chat interface
│   ├── results/                # Eligibility evaluation results display
│   ├── schemes/                # Public scheme list and detail views
│   ├── globals.css             # Tailwind theme configurations
│   ├── layout.tsx              # Root HTML wrapper and context provider
│   └── page.tsx                # Interactive landing page and eligibility stepper
├── components/                 # Shared User Interface Components
│   ├── eligibility/            # Custom questionnaire cards and state filters
│   ├── layout/                 # Global components (Navbar, Footer, Notifications)
│   └── schemes/                # Individual scheme lists and analytics tables
├── context/                    # Global React State Management
│   └── AppContext.tsx          # User profile tracking, bookmarks, notifications
├── lib/                        # Client-side Network & Utility Layers
│   ├── api.ts                  # Fetch/Axios API wrappers for API calls
│   ├── formatter.ts            # Local currency & date formatters
│   └── translations.ts         # Multi-lingual utility definitions (Hindi/English)
└── types/                      # Declarations for type safety
    └── index.ts                # TypeScript Interfaces (Scheme, Rule, User, Log)
```

---

## 🛠️ App Router & Routing System

GovSchemeAI uses the **Next.js App Router** for layouts, rendering, and routing. 

### Core Pages
1. **Interactive Stepper (`/src/app/page.tsx`)**:
   * Renders the landing page and the primary **Eligibility Questionnaire Stepper**.
   * Validates demographic details (Age, Gender, State, Caste, Income, etc.) step-by-step.
2. **Results Display (`/src/app/results/page.tsx`)**:
   * Evaluates checked responses against the backend API and presents matching schemes.
   * Features interactive sorting options (by confidence, release dates, benefit amount).
3. **Schemes Catalog (`/src/app/schemes/page.tsx` & `[slug]/page.tsx`)**:
   * Direct scheme browser with pagination, state search fields, and category tags.
   * `[slug]/page.tsx` uses dynamic routing to display a single scheme's application process, required documentation, and direct portal links.
4. **AI Assistant (`/src/app/chat/page.tsx`)**:
   * An interactive chatroom connecting users to the FastAPI RAG service.
   * Keeps track of local thread state and formats inline references to official files.
5. **Admin Panel (`/src/app/admin/page.tsx`)**:
   * Admin-only area displaying sync reports, scheduler registers, telemetry charts, and backup triggers. Secured via local storage token keys.

---

## 🔄 Global State & React Context

Global state is managed by the custom `AppContext` provider wrapping the application in `/src/app/layout.tsx`.

### `AppContext.tsx` State Store
The global provider manages state across components without unnecessary re-renders:
* **User Profile**: Caches validated eligibility fields to prevent restarting questionnaires.
* **Bookmarked Schemes**: Allows saving active schemes to local storage, automatically matching user IDs if logged in.
* **Notification Feed**: A toast notification system showing system alerts (e.g. "Backup Completed", "Crawl Executed").
* **Language Toggle**: Switches strings between English (`en`) and Hindi (`hi`) across core components.

---

## 🌐 API Integrations & Requests

All network operations route through `/src/lib/api.ts`, which uses configured backend parameters.

* **Base Configuration**: Next.js automatically rewrites `/api/*` to the FastAPI backend service (e.g., `${BACKEND_URL}/*`) to bypass CORS blocks.
* **Endpoints Mapping**:
  ```typescript
  import axios from 'axios';

  const client = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' }
  });

  // Example API integrations
  export const fetchSchemes = (params: any) => client.get('/schemes', { params });
  export const checkEligibility = (profile: any) => client.post('/eligibility/check', profile);
  export const askAI = (message: string, history: any[]) => client.post('/chat/ask', { message, history });
  ```
* **Security Headers**: Standard JWT authorization headers are automatically injected into admin requests when the token resides in local storage.

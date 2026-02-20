# Matrixa — Full Audit Report

> **Date:** 2026-02-20  
> **Scope:** Errors, missing features, incomplete implementations, and documentation inconsistencies  
> **Status Key:** 🔴 Error / 🟡 Incomplete / 🟠 Inconsistency / 🔵 Missing Feature

---

## Summary

The `FEATURES_CHECKLIST.md` claims **100% feature completion (250/250)**. This audit found that claim to be inaccurate. Several API endpoints listed in the checklist do not exist, one admin page is undocumented, a deprecated file convention is in use, and a dependency conflict prevents clean installation.

---

## 1. 🔴 Build Failure — Google Fonts in Restricted Environments

**File:** `src/app/layout.tsx`

The app imports `Geist` and `Geist_Mono` from `next/font/google`, which fetches fonts from `fonts.googleapis.com` at build time. In environments without internet access (CI, Docker, air-gapped servers), this causes the entire build to fail with:

```
next/font: error: Failed to fetch `Geist` from Google Fonts.
```

**What to do:**  
Install the `geist` npm package and change the imports:

```diff
- import { Geist, Geist_Mono } from "next/font/google"
- const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
- const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })
+ import { GeistSans } from "geist/font/sans"
+ import { GeistMono } from "geist/font/mono"
```

Then update the `<body>` className to use `GeistSans.variable` and `GeistMono.variable`.

---

## 2. 🔴 Deprecated File Convention — `middleware.ts` in Next.js 16

**File:** `src/middleware.ts`

Next.js 16 (currently installed: `v16.1.3`) deprecates the `middleware.ts` file convention in favour of `proxy.ts`. The build currently emits this warning:

```
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
```

**What to do:**
1. Rename `src/middleware.ts` → `src/proxy.ts`
2. Rename the exported function from `middleware` to `proxy`:

```diff
- export async function middleware(request: NextRequest) {
+ export async function proxy(request: NextRequest) {
```

The `config` export at the bottom stays the same.

---

## 3. 🔴 Dependency Conflict — `nodemailer` Version

**File:** `package.json`

The project specifies:
- `"nodemailer": "^8.0.1"`
- `"next-auth": "^4.24.11"`

`next-auth@4.24.x` declares a peer dependency of `nodemailer@^7.0.7`. Having `nodemailer` v8 installed causes `npm install` to fail with an `ERESOLVE` peer conflict:

```
npm error Could not resolve dependency:
npm error peerOptional nodemailer@"^7.0.7" from next-auth@4.24.13
```

**What to do:**  
Downgrade `nodemailer` to a v7 release:

```diff
- "nodemailer": "^8.0.1"
+ "nodemailer": "^7.0.3"
```

The `src/lib/email.ts` API (`createTransport`, `sendMail`) is identical in both v7 and v8, so no code changes are needed.

---

## 4. 🔵 Missing API Endpoint — `POST /api/focus-sessions/:id/complete`

**Claimed in:** `FEATURES_CHECKLIST.md` line ~379  
**Actual location checked:** `src/app/api/focus-sessions/`

The checklist documents:
```
- POST /api/focus-sessions
- POST /api/focus-sessions/:id/complete   ← MISSING
- GET  /api/focus-sessions
```

Only `src/app/api/focus-sessions/route.ts` exists (handles GET + POST for the collection). There is **no** `src/app/api/focus-sessions/[id]/complete/route.ts`.

The focus session flow currently creates a session on POST and updates it in the same call (by passing `wasCompleted: true`). However, if the design intends sessions to be started first and completed separately (two-step flow), this endpoint needs to be built.

**What to add:**  
Create `src/app/api/focus-sessions/[id]/complete/route.ts` with a `POST` handler that:
- Finds the focus session by `id` and verifies it belongs to the authenticated user
- Accepts `actualDuration`, `videosWatched`, `questionsSolved`, `revisionsCompleted`, `brainDump`
- Marks `wasCompleted = true` and sets `endedAt`
- Updates the leaderboard score and streak

---

## 5. 🔵 Missing API Endpoints — `GET` and `POST /api/notes/templates`

**Claimed in:** `FEATURES_CHECKLIST.md` lines ~368–369  
**Actual location checked:** `src/app/api/notes/`

The checklist documents:
```
- GET  /api/notes/templates   ← MISSING
- POST /api/notes/templates   ← MISSING
```

The directory `src/app/api/notes/templates/` does **not exist**.

The `NoteTemplate` model **does** exist in `prisma/schema.prisma` (with fields for `userId`, `name`, `nameAr`, `content`, `type`, `isSystem`, `isActive`), so the database is ready — only the API layer is absent.

**Current workaround:** Templates are hardcoded as a static array inside `src/components/notes/NoteModal.tsx` (client-side only). The frontend never calls any `/api/notes/templates` endpoint.

**What to add:**  
Create `src/app/api/notes/templates/route.ts` with:
- `GET` — Returns active system templates (`isSystem: true, userId: null`) plus the authenticated user's own custom templates
- `POST` — Creates a new custom template for the authenticated user, sanitising the HTML `content` field

---

## 6. 🔵 Missing Admin Page — `/admin/plans`

**Claimed in:** `FEATURES_CHECKLIST.md` line ~495 (file structure diagram)  
**Actual location checked:** `src/app/admin/`

The checklist file structure shows:
```
│   ├── admin/
│   │   ├── plans/    # Subscription plans   ← PAGE DOES NOT EXIST
```

The directory `src/app/admin/plans/` does **not exist** and there is no navigation entry for it in `src/components/admin/AdminLayout.tsx`.

**Note:** Plans management currently lives as a **tab** inside `/admin/subscriptions/page.tsx` (it calls `/api/admin/plans` successfully). This is functional but is not the dedicated standalone page that the documentation describes.

**What to add:**  
Either:
- Create `src/app/admin/plans/page.tsx` as a standalone plans management page, and add a `plans` entry to the `adminNavItems` array in `AdminLayout.tsx`, **or**
- Update `FEATURES_CHECKLIST.md` to reflect that plans are managed within the Subscriptions page (no standalone `/admin/plans` route exists)

---

## 7. 🟠 HTTP Method Inconsistency — Plans Update Endpoint

**Claimed in:** `FEATURES_CHECKLIST.md` line ~438  
**File:** `src/app/api/admin/plans/[id]/route.ts`

The checklist documents:
```
- PATCH /api/admin/plans/:id
```

The actual implementation exports:
```typescript
export async function PUT(...)  // ← PUT, not PATCH
```

`PUT` and `PATCH` are semantically different (`PUT` replaces the whole resource; `PATCH` applies a partial update). The code currently accepts partial fields (matching `PATCH` semantics), but the HTTP method is `PUT`. The checklist and the actual route disagree.

**What to fix:**  
Either rename the export to `PATCH` in the route file to match the checklist, or update the checklist to say `PUT`.

---

## 8. 🔵 Missing Feature — Admin UI for Note Templates (System Templates)

**Related to:** Item 5 above

The `NoteTemplate` Prisma model supports `isSystem: true` (system-wide templates visible to all users). However:
- There is no admin page to create, edit, or delete system note templates
- There is no admin API for system templates
- The seed file (`prisma/seed.ts`) does not seed any system templates

This means the system-template feature in the schema is completely unused at runtime.

**What to add:**  
- An admin page (e.g., `/admin/notes-templates`) or a section within an existing admin page
- API routes under `/api/admin/note-templates` for CRUD on system templates
- Optionally, seed default system templates (Cornell, Mind Map, etc.) in `prisma/seed.ts`

---

## 9. 🟡 No `.env.example` File

**Files checked:** root directory

There is no `.env.example` (or `.env.sample`) file in the project root. New developers have no template to follow when setting up the environment. The required variables are partially documented in `docs/SETUP.md` and `src/lib/env.ts`, but a sample file is the standard practice.

**Required variables to document:**
```
DATABASE_URL=
JWT_ACCESS_SECRET=       # min 32 characters
JWT_REFRESH_SECRET=      # min 32 characters
NEXT_PUBLIC_APP_URL=     # e.g. http://localhost:3000

# Optional — email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM_NAME=
SMTP_FROM_EMAIL=

# Optional — Paymob payment
PAYMOB_API_KEY=
PAYMOB_INTEGRATION_ID=
PAYMOB_IFRAME_ID=
PAYMOB_HMAC_SECRET=

# Optional — Push notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Optional — Redis rate limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Optional — Cron job security
CRON_SECRET=
```

---

## 10. 🟡 No System Note Templates Seeded in `prisma/seed.ts`

**File:** `prisma/seed.ts`

The `NoteTemplate` model supports system templates (`isSystem: true`). The seed file creates admin users, branches, subjects, plans, and settings — but seeds **zero** note templates.

As a result, when a fresh database is seeded, the templates feature only has the hardcoded client-side templates in `NoteModal.tsx`. If the API endpoint from Item 5 is ever built, it will return an empty list until templates are seeded.

**What to add:**  
Seed at least the five documented system templates in `prisma/seed.ts`:

| `type`      | `name`         | `nameAr`           |
|-------------|----------------|--------------------|
| GENERAL     | Blank          | فارغ               |
| CORNELL     | Cornell Method | طريقة كورنيل       |
| SUMMARY     | Lesson Summary | ملخص درس           |
| STUDY_GUIDE | Study Guide    | دليل مذاكرة        |
| FLASHCARD   | Flashcard      | بطاقة مراجعة       |

---

## 11. 🟠 `FEATURES_CHECKLIST.md` Is Inaccurate

The checklist header states:
```
Last Updated: 2025-01-19 (Final - All Features Complete)
Total Features: 250 / Complete: 250 (100%)
```

Based on this audit, the following items are marked ✅ in the checklist but are **not fully implemented**:

| Checklist Claim | Reality |
|---|---|
| `✅ Note templates (Cornell, Mindmap, Summary, Flashcard, Study Guide)` | Templates are client-side only; no API and no DB records |
| `GET /api/notes/templates` and `POST /api/notes/templates` | Route does not exist |
| `POST /api/focus-sessions/:id/complete` | Route does not exist |
| `PATCH /api/admin/plans/:id` | Route exists but exports `PUT`, not `PATCH` |
| `admin/plans/` page in file structure | Page does not exist; plans are a tab inside subscriptions |

---

## Quick Reference — All Issues

| # | Severity | Category | File / Location | Description |
|---|---|---|---|---|
| 1 | 🔴 Critical | Build Error | `src/app/layout.tsx` | Google Fonts fails in offline/CI environments |
| 2 | 🔴 Critical | Deprecation | `src/middleware.ts` | Deprecated in Next.js 16; rename to `proxy.ts` + function to `proxy` |
| 3 | 🔴 Critical | Dependency | `package.json` | `nodemailer@^8` conflicts with `next-auth@4` peer dep requirement of `^7` |
| 4 | 🔵 Missing | API Route | `src/app/api/focus-sessions/[id]/complete/` | `POST /api/focus-sessions/:id/complete` not implemented |
| 5 | 🔵 Missing | API Route | `src/app/api/notes/templates/` | `GET` + `POST /api/notes/templates` not implemented |
| 6 | 🔵 Missing | Admin Page | `src/app/admin/plans/` | Standalone plans admin page does not exist |
| 7 | 🟠 Inconsistency | API Method | `src/app/api/admin/plans/[id]/route.ts` | Docs say `PATCH`; code exports `PUT` |
| 8 | 🔵 Missing | Feature | `src/app/admin/` + API | No admin UI or API for managing system note templates |
| 9 | 🟡 Improvement | DX | project root | No `.env.example` file for new developers |
| 10 | 🟡 Improvement | Seed Data | `prisma/seed.ts` | No system note templates are seeded |
| 11 | 🟠 Inconsistency | Docs | `FEATURES_CHECKLIST.md` | Claims 100% complete; at least 5 items are inaccurate |

---

*Report generated from code audit of commit `2ecaf08` on branch `copilot/check-app-errors-and-features`.*

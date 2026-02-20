# Matrixa — Full Audit Report

> **Date:** 2026-02-20 (updated with worklog analysis)  
> **Scope:** Errors, missing features, incomplete implementations, mocked code, and inconsistencies across the entire codebase — cross-referenced with `worklog.md`  
> **Status Key:** 🔴 Error/Build Failure · 🟠 Inconsistency · 🟡 Incomplete/Partial · 🔵 Missing Feature · ⚠️ Security Issue

---

## Table of Contents

1. [Build & Dependency Errors](#section-1-build--dependency-errors)
2. [Missing Admin Features](#section-2-missing-admin-features)
3. [Missing Student-Facing Features](#section-3-missing-student-facing-features)
4. [Mocked / Not Production-Ready Code](#section-4-mocked--not-production-ready-code)
5. [Badge System — Broken Award Logic](#section-5-badge-system--broken-award-logic)
6. [Announcements Component — Built but Never Used](#section-6-announcements-component--built-but-never-used)
7. [Impersonation — No Exit Mechanism](#section-7-impersonation--no-exit-mechanism)
8. [Email System — Incomplete Automation](#section-8-email-system--incomplete-automation)
9. [Security Issues](#section-9-security-issues)
10. [API Documentation vs. Implementation Gaps](#section-10-api-documentation-vs-implementation-gaps)
11. [Developer Experience Gaps](#section-11-developer-experience-gaps)
12. [Landing Page — Hardcoded and Not Admin-Editable](#section-12-landing-page--hardcoded-and-not-admin-editable)
13. [Worklog Gap Analysis — What Was Claimed vs. What Is Incomplete](#section-13-worklog-gap-analysis--what-was-claimed-vs-what-is-incomplete)
14. [FEATURES_CHECKLIST.md Inaccuracies](#section-14-features_checklistmd-inaccuracies)
15. [Quick Reference Table](#section-15-quick-reference-table)

---

## Section 1 — Build & Dependency Errors

### 1.1 🔴 Build Failure — Google Fonts Requires Internet Access

**File:** `src/app/layout.tsx`

> **Note:** The current code in this branch already imports from the local `geist` package (`GeistSans`, `GeistMono`). This item documents the original issue for reference.

The original code imported `Geist` and `Geist_Mono` from `next/font/google`, which fetches font files from `fonts.googleapis.com` at build time. In environments without internet access (CI, Docker, air-gapped servers), this causes the entire build to fail with:

```
next/font: error: Failed to fetch `Geist` from Google Fonts.
```

**Fix:** Use the local `geist` npm package instead of `next/font/google`.

---

### 1.2 🔴 Deprecated File Convention — `middleware.ts` in Next.js 16

**File:** `src/middleware.ts`

Next.js 16 (installed: `v16.1.3`) deprecates `middleware.ts` in favour of `proxy.ts`. Every build emits:

```
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
```

**Fix:**
1. Rename `src/middleware.ts` → `src/proxy.ts`
2. Rename the exported function:

```diff
- export async function middleware(request: NextRequest) {
+ export async function proxy(request: NextRequest) {
```

The `config` export at the bottom stays the same.

---

### 1.3 🔴 Dependency Conflict — `nodemailer` Version

**File:** `package.json`

The project specifies `"nodemailer": "^8.0.1"` alongside `"next-auth": "^4.24.11"`. The `next-auth@4.24.x` package declares a peer dependency of `nodemailer@^7.0.7`. Running `npm install` (without `--legacy-peer-deps`) fails:

```
npm error peerOptional nodemailer@"^7.0.7" from next-auth@4.24.13
```

**Fix:** Downgrade nodemailer to `^7.0.x`. No code changes are needed; the `createTransport`/`sendMail` API is unchanged between v7 and v8.

---

## Section 2 — Missing Admin Features

### 2.1 🔵 No Admin Landing Page Builder / Editor

**Files affected:** `src/app/page.tsx`, `src/app/admin/`

The landing page (`src/app/page.tsx`) has **no admin editing capability whatsoever**. Every piece of content is hardcoded in the React component:

- Hero headline and subtitle (Arabic, hardcoded)
- Feature cards (6 cards, titles and descriptions hardcoded)
- Statistics bar (`10K+ طالب نشط`, `50K+ ساعة مذاكرة`, `95% رضا`, `4.9 تقييم` — all **fake/fictional** hardcoded values)
- CTA section text and button labels
- Footer copyright

There is no database model for landing page content, no admin API for it, and no admin page for editing it.

**What needs to be added:**
- A Prisma model (e.g. `LandingContent`) or system settings keys to store hero text, feature cards, and stats
- An admin page `/admin/landing` with a form to edit hero title, subtitle, feature cards, and the stats numbers
- A corresponding API route `/api/admin/landing` (GET + PUT)
- The landing page should fetch and display this dynamic content instead of static JSX arrays

---

### 2.2 🔵 Standalone `/admin/plans` Page Does Not Exist

**Claimed in:** `FEATURES_CHECKLIST.md` file-structure diagram, line ~495

The checklist shows `admin/plans/` as a directory. This page **does not exist**. Plans management is only accessible as a **second tab inside** `/admin/subscriptions/page.tsx`.

There is also **no navigation link** for plans in `src/components/admin/AdminLayout.tsx`.

**What needs to be added:**
- `src/app/admin/plans/page.tsx` as a dedicated standalone page, or
- A nav item in `AdminLayout.tsx` linking to the plans tab inside subscriptions

---

### 2.3 🔵 No Admin Note Templates Management

**File:** `prisma/schema.prisma` (model `NoteTemplate`)

The schema has a full `NoteTemplate` model with `isSystem` flag (for platform-wide templates), `type` enum (`GENERAL`, `CORNELL`, `MINDMAP`, `SUMMARY`, `FLASHCARD`, `STUDY_GUIDE`), and `isActive` toggle. However:

- There is **no admin page** to create, edit, or delete system templates
- There is **no admin API** for system note templates
- The `prisma/seed.ts` file seeds **zero** note templates
- The `GET`/`POST /api/notes/templates` routes **do not exist** (see §10.1)

As a result, this entire system is dead: no system templates are ever created, and the student-facing template picker in `NoteModal.tsx` uses five hardcoded client-side objects that are never stored in the database.

**What needs to be added:**
- Admin page: `/admin/note-templates` with CRUD UI
- API: `/api/admin/note-templates` (GET, POST, PUT `:id`, DELETE `:id`)
- Student API: `/api/notes/templates` (GET + POST)
- Seed: default system templates (Blank, Cornell, Summary, Study Guide, Flashcard) in `prisma/seed.ts`

---

### 2.4 🔵 No Cron Routes for Subscription Expiry Emails or Grace Period Checking

**File:** `src/app/api/cron/`

Only one cron route exists: `streak-check`. The `FUTURE_UPGRADE_GUIDE.md` documents several automated subscription email triggers (trial ending, trial expired, subscription ending, grace period started, access denied). **None of these automated triggers exist** as cron routes:

- Missing: `POST /api/cron/subscription-check` — to expire subscriptions, start grace periods, and trigger email notifications
- Missing: `POST /api/cron/email-triggers` — to run through email templates with `trigger` fields and send scheduled emails

The `EmailTemplate` model in the schema has `trigger` and `triggerOffset` fields, but no cron job ever reads these to fire emails automatically.

---

### 2.5 🔵 No Admin Export/Download Feature for User or Analytics Data

No CSV, Excel, or PDF export exists anywhere in the admin panel. The admin analytics page has charts but no way to export the underlying data. The admin users page has no bulk export of user records.

**What is missing:**
- Export users list to CSV from `/admin/users`
- Export analytics data from `/admin/analytics`
- Export payment/subscription history from `/admin/subscriptions`

---

### 2.6 🔵 No Admin Search for Users by Phone Number

**File:** `src/app/admin/users/page.tsx`, `src/app/api/admin/users/route.ts`

The user model has a `phone` field. The admin user search queries by `fullName` and `email` only — there is no ability to search by phone number, even though it is a stored field. The API route does not include `phone` in the search `where` clause.

---

### 2.7 🔵 No Bulk Actions in Admin Users Page

**File:** `src/app/admin/users/page.tsx`

The users table has no checkboxes, no "select all", and no bulk operations (e.g., bulk ban, bulk email, bulk subscription grant). Each action must be done one user at a time.

---

### 2.8 🔵 No Admin Dashboard Link to Landing Page Preview

**File:** `src/components/admin/AdminLayout.tsx`

The admin sidebar has a "عرض الموقع" (View Site) link pointing to `/dashboard` — but this opens the student dashboard, not the public landing page. An admin cannot preview the public-facing landing page directly from the admin panel. There is no link to `/` (the landing page) in the admin navigation.

---

## Section 3 — Missing Student-Facing Features

### 3.1 🔵 Announcements Component Built but Never Shown to Students

**File:** `src/components/announcements/AnnouncementBanner.tsx`

The `AnnouncementBanner` component exists and is fully implemented (fetches active announcements from `/api/announcements`, renders dismissible banners). However, it is **never imported or used in any student-facing page**. The admin can create announcements, but students never see them.

**Pages where the banner should appear:**
- `src/app/dashboard/page.tsx` (highest visibility)
- Optionally `src/app/subjects/page.tsx`, `src/app/notes/page.tsx`

---

### 3.2 🔵 No `/api/focus-sessions/:id/complete` Endpoint

**Claimed in:** `FEATURES_CHECKLIST.md`

The checklist lists `POST /api/focus-sessions/:id/complete` as an endpoint. Only a collection-level `route.ts` exists at `src/app/api/focus-sessions/route.ts`. There is **no** `src/app/api/focus-sessions/[id]/complete/route.ts`.

The current workaround is that `wasCompleted` is passed as a field in the initial POST body — meaning there is no two-step "start session → complete session" flow. If the product design calls for a timer that starts, then completes, this endpoint is needed.

---

### 3.3 🔵 No Email Verification at Registration

**Files:** `src/app/api/auth/register/route.ts`, `src/app/auth/register/page.tsx`

Registration creates an account and immediately grants access with no email verification step. Anyone can register with any email address (real or fake) as long as it has a valid format. This means:

- Fake/invalid email addresses can get full accounts
- No way to verify a student's identity
- Password reset emails might go undelivered to misspelled addresses

**What is missing:** A `POST /api/auth/verify-email` route, a verification token model (or reuse `PasswordResetToken`), and a verification step between registration and first login.

---

### 3.4 🔵 No Welcome Email Sent on Registration

**File:** `src/app/api/auth/register/route.ts`

The `sendWelcomeEmail()` function is fully implemented in `src/lib/email.ts` but is **never called**. New user registrations do not receive a welcome email.

---

### 3.5 🔵 No Admin Password Reset Notifies User

**File:** `src/app/api/admin/users/[id]/reset-password/route.ts`

When an admin resets a student's password from the admin panel, the student receives **no notification**. The new password is set silently. The student has no way of knowing their password was changed unless they try to log in and fail.

**What is missing:** An email to the user notifying them of the admin-initiated password reset (using the existing `sendEmail()` infrastructure).

---

### 3.6 🔵 No Note Templates API — Frontend Uses Hardcoded Client-Side Data

**Files:** `src/components/notes/NoteModal.tsx`, `src/app/api/notes/`

Five note templates (Blank, Cornell Method, Lesson Summary, Study Guide, Checklist) are hardcoded in `NoteModal.tsx` as a static JavaScript array. They are never stored in the database, never fetched from an API, and cannot be managed by an admin.

The `GET /api/notes/templates` and `POST /api/notes/templates` routes are documented in the checklist but **do not exist**.

---

### 3.7 🔵 No Note Folder or Tag Edit by ID

**File:** `src/app/api/notes/folders/route.ts`

The folders API uses query parameters (`?id=...`) for update and delete instead of the RESTful pattern `PUT /api/notes/folders/:id` and `DELETE /api/notes/folders/:id`. Tags have a similar pattern. This is a design inconsistency that makes the API harder to use and contradicts REST conventions used everywhere else in the codebase.

---

### 3.8 🔵 Push Notifications — Subscriptions Saved but Nothing is Ever Sent

**Files:** `src/app/api/push/subscribe/route.ts`, `src/lib/pwa.ts`

The push subscription flow (browser asks permission → token saved to DB) is fully implemented. However, **no code in the entire application ever sends a push notification** to a stored subscription. The server-side `web-push` package is not installed. There is no `sendPushNotification()` utility function. The stored `pushSubscription` JSON strings are never used.

**What is missing:**
- Install `web-push` npm package
- Create `src/lib/push.ts` with a `sendPushNotification(userId, title, body)` function
- Call it from: streak breaks (cron), task reminders, admin announcements

---

### 3.9 🔵 No Contact or Support Page

There is no `/contact`, `/support`, or `/help` page in the student-facing app. Students with problems have no in-app way to reach support. The footer on the landing page only shows a copyright line.

---

### 3.10 🔵 No Data Export for Students (GDPR/Right to Data)

Students have no way to export their own data (tasks, notes, study sessions, progress). There is no "Export my data" button in the settings page.

---

## Section 4 — Mocked / Not Production-Ready Code

### 4.1 🟡 Paymob Payment Integration is Fully Mocked

**File:** `src/app/api/payment/route.ts`

The payment route is documented with a JSDoc comment: `"Creates mock payment intent for subscription"`. The implementation:

- Generates a fake `paymentId` using `mock_${Date.now()}_${Math.random()...}`
- Returns a `mockPaymentUrl` (a redirect to the subscription page, not Paymob)
- Never calls Paymob's API (`accept.paymob.com`)

`FUTURE_UPGRADE_GUIDE.md` documents exactly how to implement the real Paymob integration with full code examples. **This work has not been done.**

The mock webhook at `src/app/api/payment/webhook/route.ts` also contains a `verifyMockSignature()` function. When `PAYMOB_HMAC_SECRET` is not set in production, the code logs a warning but **still processes the webhook**, which is a security risk.

---

### 4.2 🟡 Profile Picture Upload — Stored as Base64 in Database

**File:** `src/app/api/user/avatar/route.ts`

Avatar images are converted to base64 data URLs and stored directly in the `User.avatarUrl` database column. This means:

- Every user query that includes `avatarUrl` fetches potentially hundreds of KB of base64 data
- No image resizing or compression is applied (a 10 MB photo becomes a 10 MB+ base64 string in the DB)
- There is no file size validation beyond a 5 MB limit check
- No CDN delivery for images

`FUTURE_UPGRADE_GUIDE.md` item §8 documents upgrading to proper file storage (S3/Cloudflare R2), but the work has not been done.

---

### 4.3 🟡 Receipt Uploads Stored on Disk (Not Compatible with Serverless)

**File:** `src/app/api/upload/receipt/route.ts`

Payment receipt images are saved to `public/uploads/receipts/` on the local filesystem using Node.js `fs`. This approach:

- Does not work in serverless environments (Vercel, Cloudflare Workers) where the filesystem is read-only
- Files are lost on every deployment
- The `public/uploads/` path is publicly accessible — anyone who guesses a filename can access any receipt

---

### 4.4 🟡 Cron Job for Streaks Has No Automated Scheduling

**File:** `src/app/api/cron/streak-check/route.ts`

The streak-check cron endpoint exists and works when called, but there is **no automated scheduler configured**. No `vercel.json`, no `cron-job.org` configuration, no Cloudflare Cron Trigger setup. The streak check will never run unless someone calls the URL manually.

The same applies to subscription expiry checking — no cron job exists for it.

---

### 4.5 🟡 Welcome and Subscription Expiry Emails Are Never Sent

**File:** `src/lib/email.ts`

Three email functions are fully implemented:
- `sendWelcomeEmail()` — never called anywhere
- `sendExpiryWarningEmail()` — never called anywhere  
- `sendPasswordResetEmail()` — ✅ called correctly from forgot-password route

The subscription expiry warning email that `FUTURE_UPGRADE_GUIDE.md` documents under §2 ("Subscription Expiration Email Triggers") is not wired up to any event or cron job.

---

## Section 5 — Badge System — Broken Award Logic

**Files:** `src/app/api/badges/route.ts`, `src/app/api/admin/badges/route.ts`

The badge system has a critical design gap: **badges are never automatically awarded to users**.

- The `UserBadge` table exists in the schema
- `prisma.userBadge.create()` is **never called anywhere** in the codebase (verified by searching all API routes and lib files)
- The GET `/api/badges` endpoint calculates progress dynamically from live stats and returns it, but it never writes a `UserBadge` record when a threshold is met
- The admin `PUT /api/admin/badges` seeds the badge definitions, but never creates user awards

**Result:** No student will ever earn a badge. The BadgesSection component in settings will always show 0 earned badges for every user, regardless of their actual progress.

**What is missing:**
- A `checkAndAwardBadges(userId)` function in `src/lib/` that reads current user stats and creates `UserBadge` records when requirements are met
- Call this function after: task completion, focus session completion, streak updates
- Add a cron route to retroactively award badges to existing users

---

## Section 6 — Announcements Component — Built but Never Used

*(See §3.1 above for full details.)*

**Summary:** `AnnouncementBanner` component is fully built and working but is imported in exactly zero student-facing pages. Admins can create announcements that no student will ever see.

---

## Section 7 — Impersonation — No Exit Mechanism

**File:** `src/app/api/admin/impersonate/route.ts`, `src/app/admin/users/page.tsx`

The admin impersonation feature (`POST /api/admin/impersonate`) sets cookies (`impersonatorId`, `impersonatorEmail`) and redirects to `/dashboard`. However:

- There is **no banner or indicator** on the dashboard telling the admin they are impersonating a user
- There is **no "Stop Impersonating" button** or API endpoint to end the session
- The admin must manually clear cookies or wait for the 1-hour impersonation session to expire
- If the admin closes the browser while impersonating, they effectively lock themselves out of the admin panel until the cookie expires

**What is missing:**
- A persistent banner on the dashboard showing "You are viewing as [user email]" when `impersonatorId` cookie is set
- A "Return to Admin" button that calls a `DELETE /api/admin/impersonate` endpoint to clear the impersonation cookies and redirect back to `/admin`

---

## Section 8 — Email System — Incomplete Automation

### 8.1 🟡 Email Templates Have Trigger Fields but No Automation Engine

**Files:** `prisma/schema.prisma` (model `EmailTemplate`), `src/app/api/admin/email/`

The `EmailTemplate` model has `trigger` (enum: `TRIAL_STARTING`, `SUBSCRIPTION_ENDING`, etc.) and `triggerOffset` (hours before/after event) fields. The admin email page can create and configure these templates. However:

- **No automation engine exists** that reads these trigger settings and fires emails at the configured offset
- The only way emails get sent is via the manual "Send" form in `/admin/email`
- All subscription lifecycle emails (trial ending, subscription expiring, grace period) must be sent manually by the admin

### 8.2 🟡 Password Reset Email Not Logged to `EmailLog` Table

**File:** `src/app/api/auth/forgot-password/route.ts`

When `sendPasswordResetEmail()` is called, the result is not saved to the `EmailLog` table. The admin email logs page (`/admin/email`) will never show password reset emails. Only emails sent through the admin "Send" form are logged.

---

## Section 9 — Security Issues

### 9.1 ⚠️ `dangerouslySetInnerHTML` in `RichTextContent` Without Client-Side Sanitization

**File:** `src/components/notes/RichTextContent.tsx` (line 104)

The component renders note HTML content directly:

```tsx
dangerouslySetInnerHTML={{ __html: content }}
```

Content **is** sanitized server-side when saved via `src/lib/sanitize.ts` (using `isomorphic-dompurify`). However, the `RichTextContent` component has **no client-side sanitization**. If content ever reaches this component through a path that bypasses the API (e.g., local state, cached data, a future code path), it could execute arbitrary JavaScript.

**Fix:** Apply `sanitizeHtml(content)` before passing to `dangerouslySetInnerHTML`, or use a DOMPurify call inside the component itself.

---

### 9.2 ⚠️ Payment Webhook Accepts Unverified Requests When HMAC Secret Not Set

**File:** `src/app/api/payment/webhook/route.ts`

```typescript
if (!hmacSecret) {
  console.warn('WARNING: PAYMOB_HMAC_SECRET not configured - allowing webhook in development')
  // proceeds to process the webhook
}
```

If `PAYMOB_HMAC_SECRET` is not set in production (easily forgotten), any HTTP request to `/api/payment/webhook` will be processed as a valid payment, potentially activating subscriptions for free.

**Fix:** In production (`NODE_ENV === 'production'`), the webhook should **always reject** requests when `PAYMOB_HMAC_SECRET` is not configured.

---

### 9.3 ⚠️ Receipt Images Stored in Public Directory

**File:** `src/app/api/upload/receipt/route.ts`

Uploaded receipts are saved to `public/uploads/receipts/`. Files in `public/` are served directly by Next.js without any authentication. Anyone who knows (or guesses) a filename can view any student's payment receipt.

The filenames are partially predictable: `receipt_{userId}_{timestamp}_{hash}.{ext}`. The `userId` is a cuid (relatively hard to guess), but the pattern leaks user IDs in the filename.

**Fix:** Move uploads outside of `public/` and serve them through an authenticated API route.

---

## Section 10 — API Documentation vs. Implementation Gaps

### 10.1 🔵 `GET /api/notes/templates` and `POST /api/notes/templates` Do Not Exist

**Claimed in:** `FEATURES_CHECKLIST.md`  
**Checked:** `src/app/api/notes/` — no `templates/` subdirectory exists

### 10.2 🔵 `POST /api/focus-sessions/:id/complete` Does Not Exist

**Claimed in:** `FEATURES_CHECKLIST.md`  
**Checked:** `src/app/api/focus-sessions/` — only a single `route.ts` file exists

### 10.3 🟠 `PATCH /api/admin/plans/:id` — Method Mismatch

**Claimed in:** `FEATURES_CHECKLIST.md`  
**Actual:** `src/app/api/admin/plans/[id]/route.ts` exports `PUT`, not `PATCH`

The implementation uses partial updates (semantically correct for `PATCH`), but the HTTP verb is `PUT`. The checklist and implementation disagree.

### 10.4 🟡 `GET /api/subscription/plans` — Returns Plans But No Edit Route Exists for Students

**File:** `src/app/api/subscription/plans/route.ts`

Only a `GET` method exists. Students cannot update plan preferences or switch plans through the API — they must go through the admin.

---

## Section 11 — Developer Experience Gaps

### 11.1 🟡 No `.env.example` File

No `.env.example` or `.env.sample` exists at the project root. A new developer cloning the repo has no template to work from. The `src/lib/env.ts` file documents required variables in code but is not the same as a ready-to-copy environment template.

**Minimum required variables to document:**
```env
DATABASE_URL=file:./db/custom.db
JWT_ACCESS_SECRET=        # min 32 characters — generate: openssl rand -base64 32
JWT_REFRESH_SECRET=       # min 32 characters — generate: openssl rand -base64 32
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional — Email (SMTP)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM_NAME=Matrixa
SMTP_FROM_EMAIL=

# Optional — Paymob
PAYMOB_API_KEY=
PAYMOB_INTEGRATION_ID=
PAYMOB_IFRAME_ID=
PAYMOB_HMAC_SECRET=

# Optional — Web Push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Optional — Redis (rate limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Optional — Cron
CRON_SECRET=
```

### 11.2 🟡 No System Note Templates in `prisma/seed.ts`

The seed file creates admin user, branches, invite codes, and a plan — but **zero** note templates. If the templates API is ever built, it will return an empty list for all users on a fresh install.

### 11.3 🟡 Default Badge Definitions Not Seeded in `prisma/seed.ts`

Default badge definitions are loaded only via an admin `PUT /api/admin/badges` request. A fresh install has zero badges until an admin manually triggers this endpoint. The badges should be part of `prisma/seed.ts`.

### 11.4 🟡 `examples/websocket/` Contains Files with Unresolved Imports

**Files:** `examples/websocket/frontend.tsx`, `examples/websocket/server.ts`

TypeScript compilation reports:
```
examples/websocket/frontend.tsx(4,20): error TS2307: Cannot find module 'socket.io-client'
examples/websocket/server.ts(2,24): error TS2307: Cannot find module 'socket.io'
```

These example files reference packages (`socket.io`, `socket.io-client`) that are not installed. While these are just examples and `next.config.ts` has `ignoreBuildErrors: true`, the TypeScript errors clutter the output and suggest abandoned/incomplete work.

---

## Section 12 — Landing Page — Hardcoded and Not Admin-Editable

**File:** `src/app/page.tsx`

This is the most significant missing feature in the admin panel. The public landing page contains:

| Content | Type | Editable? |
|---------|------|-----------|
| Hero headline: "ادرس بذكاء، ابقَ مركزاً" | Hardcoded JSX | ❌ No |
| Hero subtitle | Hardcoded JSX | ❌ No |
| Stats: "10K+", "50K+", "95%", "4.9" | **Fictional, hardcoded** | ❌ No |
| 6 feature cards (icons, titles, descriptions) | Hardcoded JS array | ❌ No |
| CTA section text | Hardcoded JSX | ❌ No |
| Footer copyright year | Hardcoded (shows 2024) | ❌ No |
| Header nav links | Hardcoded | ❌ No |
| Testimonials | **None exist** | — |
| FAQ section | **None exist** | — |
| Pricing section on landing | **None exists** | — |

The admin panel has no page, no API, and no database model for any landing page content.

**Additional landing page issues:**
- The footer says "© 2024" — this will be wrong every year and is not dynamically set
- No social media links
- No testimonials section (common for SaaS landing pages)
- No pricing/plans section on the public landing page — potential customers cannot see prices before registering
- No FAQ section

---

## Section 13 — Worklog Gap Analysis — What Was Claimed vs. What Is Incomplete

This section cross-references each worklog task entry with the actual codebase to identify discrepancies — things the worklog says were implemented but are either absent, broken, or only partially done.

---

### 13.1 🔵 Note Favorite & Archive Toggles Broken — `isFavorite`/`isArchived` Missing from PATCH Schema

**Worklog reference:** Task ID 19 (Notes System Major Upgrade) — "Toggle Favorite/Pin actions", "Archive support"  
**Files:** `src/app/api/notes/[id]/route.ts`, `src/app/notes/page.tsx`

The `PATCH /api/notes/:id` endpoint uses Zod validation with this schema:

```typescript
const updateNoteSchema = z.object({
  title, content, subjectId, lessonId, color, isPinned   // ← isFavorite and isArchived are MISSING
})
```

The notes page (`handleToggleFavorite`) sends `PATCH` with `{ isFavorite: !note.isFavorite }`, but since `isFavorite` is not in the Zod schema, it is silently stripped and the database is never updated. The UI optimistically updates the state, creating the appearance of success — but on page refresh, the note returns to its original state.

The same applies to `isArchived`: there is no archive toggle in `NoteCard`'s dropdown menu at all. The `Archive` icon is imported from lucide-react but never rendered. Users can view archived notes (via `showArchived` toggle in the notes page), but there is no way to archive a note from the UI in the first place.

**Summary of broken note UI features:**
- `isFavorite` toggle: appears to work, silently does nothing in DB
- `isArchived` toggle: no UI control exists at all
- `isPinned` toggle: ✅ works correctly (is in the PATCH schema)

---

### 13.2 🔵 Subscription Write Gate Exists Only Client-Side — No API-Level Enforcement

**Worklog reference:** Task ID 19 (Subscription Expiration) — "`requireWriteAccess()` helper for API routes", "API route protection for writes"  
**Files:** `src/lib/subscription-check.ts`, all write API routes

The `requireWriteAccess()` function and `withSubscriptionCheck()` wrapper were created and documented in the worklog. However, `requireWriteAccess` is **never imported or called** in any API route. Searching the entire `src/app/api/` directory for any import of `subscription-check` returns zero results.

This means:
- An expired student can directly call `POST /api/tasks` (create task) with a valid JWT and it will succeed
- An expired student can directly call `POST /api/notes` (create note) with a valid JWT and it will succeed  
- An expired student can directly call `POST /api/focus-sessions` with a valid JWT and it will succeed

The read-only mode enforcement exists **only in the frontend** (via `useCanWrite()` hook). Any student who bypasses the UI (e.g., with curl or a browser dev-tools fetch call) can freely write data regardless of subscription status.

---

### 13.3 🔵 `UpgradeModal` Missing on Focus Page and Subjects Page

**Worklog reference:** Task ID 19 (Subscription Expiration) — "Visual indicators throughout UI"  
**Files:** `src/app/focus/page.tsx`, `src/app/subjects/page.tsx`

The `UpgradeModal` and `useCanWrite` subscription gate was added to these pages:
- ✅ `/dashboard` — has `UpgradeModal`
- ✅ `/planner` — has `UpgradeModal` + `canWrite` checks
- ✅ `/notes` — has `UpgradeModal` + `canWrite` checks
- ✅ `/private-lessons` — has `UpgradeModal` + `canWrite` checks
- ✅ `/focus/history` — has `UpgradeModal`

But these two key pages are **missing the gate**:
- ❌ `/focus` (starting a focus session) — no `UpgradeModal`, no `canWrite` check. An expired user can start unlimited focus sessions.
- ❌ `/subjects` (marking lesson progress: video/questions/revision) — no `UpgradeModal`, no `canWrite` check. An expired user can mark lessons as done.

---

### 13.4 🔵 Push Notifications Use Hardcoded Mock VAPID Key — Real Key Never Read

**Worklog reference:** Task ID 19 (Remaining 9 Gaps) — "Web Push Notification opt-in UI - Already implemented"  
**File:** `src/app/settings/page.tsx` line 284–285, `src/lib/env.ts`

The settings page subscribes to push notifications using a hardcoded mock VAPID public key:

```typescript
// Mock VAPID keys (in production, these would be generated and stored securely)
const MOCK_VAPID_PUBLIC_KEY = 'BNcR5d3Y9xW7vK2mF8nQ4jL6sT1hG3pA5bC8dE0fH2iJ4kL6mN8oP0qR2sT4uV6wX8yZ0'
```

The `NEXT_PUBLIC_VAPID_PUBLIC_KEY` environment variable is defined in `src/lib/env.ts` but the settings page **never reads it**. This means:
1. Even if a real VAPID key pair is generated and configured in `.env`, the push subscription will be created with the mock key — it will appear to succeed but the subscription will be invalid and undeliverable.
2. Any notification that tried to send (if the server-side push library were installed) would fail because the subscription endpoint was created with a different key than the server's private key.

---

### 13.5 🔵 XP Reward System is Decorative — No `totalXP` Field in User Model

**Worklog reference:** Task ID 19 (Badges) — "XP rewards display", "xpReward" per badge  
**Files:** `prisma/schema.prisma`, `src/components/badges/BadgesSection.tsx`

The `Badge` model has a `xpReward` field (e.g., 10 XP for common badges, 100 XP for rare ones) and the `BadgesSection` component displays XP rewards. However:

- The `User` model has **no `totalXP`, `xpBalance`, or `experiencePoints` field** in the schema
- There is no API route or function that credits XP to a user
- Even if badges were awarded (they aren't — see §5), the XP reward would never be applied anywhere
- XP reward numbers shown to users are entirely decorative/misleading

---

### 13.6 🟡 Curriculum Import/Export Does Not Handle `xpPerLesson`

**Worklog reference:** Task ID 15 (Curriculum Import/Export)  
**Files:** `src/lib/curriculum-import.ts`, `src/lib/curriculum-export.ts`

The `Subject` model has a `xpPerLesson` field (`Int @default(10)`) and the `Lesson` model also has a `duration` field. While `duration` is handled in the import/export, `xpPerLesson` is not present in either `curriculum-import.ts` or `curriculum-export.ts`. If an admin exports curriculum and re-imports it (e.g., to a new environment), all per-subject XP values are reset to the default of 10.

---

### 13.7 🟡 Study & Task Reminder Toggles Are Stored but Never Act

**Worklog reference:** Task ID 20 (Missing UI Features) — "Functional notification toggles (study reminders, task reminders)"  
**Files:** `prisma/schema.prisma`, `src/app/settings/page.tsx`, `src/app/api/user/settings/route.ts`

The settings page has toggle switches for "Study Reminders" (`studyReminders`) and "Task Reminders" (`taskReminders`). The values are correctly stored in the `User` table. However:

- No cron job exists that reads these flags and sends reminders
- No push notification code reads these flags
- No email code reads these flags
- The toggles are purely cosmetic — they store a preference that is never consumed

---

### 13.8 🟡 Rate Limiting is Non-Functional in Serverless Without Redis

**Worklog reference:** Task ID 9 (Rate Limiting)  
**File:** `src/lib/rate-limit.ts`

The worklog claims: *"In-memory rate limiting with configurable limits"*. This is accurate but the caveat is significant: in serverless environments (Vercel, AWS Lambda, Cloudflare Workers), every function invocation may get a fresh process — the in-memory `Map` is reset on every cold start.

The rate limiter has a Redis fallback (`@upstash/redis`) but it requires configuring `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Without these variables, the in-memory fallback is used — and in serverless production deployments, this means rate limiting effectively doesn't work. A brute-force attacker hitting `/api/auth/login` in different geographic regions (which land on different function instances) would face no rate limiting at all.

Additionally, rate limiting is **only applied to 3 routes** (login, register, refresh). Other attack-sensitive routes have no rate limiting:
- `POST /api/auth/forgot-password` — no rate limit → can be used to spam password reset emails
- Admin routes — no rate limit
- Note creation — no rate limit

---

### 13.9 🟡 Ban Status Check Relies on Cookie — No Immediate API-Level Enforcement

**Worklog reference:** Task ID 16 (Ban User Feature) — "Banned user login prevention", "Cookie-based banned status checking"  
**Files:** `src/middleware.ts`, `src/app/api/admin/users/[id]/ban/route.ts`

The ban check in middleware reads the `isBanned` cookie:

```typescript
function isUserBannedFromCookie(request: NextRequest): boolean {
  return request.cookies.get('isBanned')?.value === 'true'
}
```

When a user is banned by an admin, all their sessions are deleted (which is correct). However:
1. The ban check only works at the middleware/page navigation level, not at the API request level. A banned user whose access token has not expired (valid for 15 minutes) can still call any API route directly.
2. The `isBanned` cookie is set to `'false'` on login and never updated mid-session. If a user is banned while logged in, they won't see the ban until their current session cookies expire, or until they try to navigate to a new page through the middleware.
3. There is no check against the database for real-time ban status in API routes.

---

### 13.10 🟡 Private Lessons Page Not in Main Student Navigation

**Worklog reference:** Task ID 11 (Private Lessons) — "Integrated with existing navigation patterns"  
**File:** `src/app/dashboard/page.tsx`

The student navigation bar (`navItems` array) contains exactly 5 items:
- Today (`/dashboard`)
- Subjects (`/subjects`)
- Planner (`/planner`)
- Notes (`/notes`)
- Insights (`/insights`)

The `/private-lessons` page is **not in this navigation**. It is only reachable via a small "إدارة" link button inside the Planner page. Students who don't visit the Planner may never discover the Private Lessons feature. The worklog claims it was "integrated with existing navigation patterns" but the nav was not updated.

---

### 13.11 🟠 Dead Code: `useRouter` Import Left in Register Page After Task 17 Cleanup

**Worklog reference:** Task ID 17 (Registration Flow Bug Fix) — "Replaced all `router.push()` with `window.location.href`"  
**File:** `src/app/auth/register/page.tsx`

The worklog states that all `router.push()` calls were replaced with `window.location.href`. The actual redirect on line 81 does use `window.location.href = '/onboarding'`. However, the file still contains:

```typescript
import { useRouter } from 'next/navigation'
// ...
const router = useRouter()
```

The `router` variable is declared but never used — dead code left behind from the cleanup. This is minor but reflects incomplete refactoring.

---

### 13.12 🟡 `forgot-password` Rate Limiting Missing

**Worklog reference:** Task ID 9 (Rate Limiting) — lists `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh` only  
**File:** `src/app/api/auth/forgot-password/route.ts`

The password reset route (`POST /api/auth/forgot-password`) has **no rate limiting**. An attacker can enumerate valid email addresses by hammering this endpoint, and can also use it to spam arbitrary email addresses with password reset emails. This is a common abuse vector and is not addressed by the current rate limiting implementation.

---

### 13.13 🟡 Subscription Context Auto-Refreshes But Login Doesn't Re-sync On New Tab

**Worklog reference:** Task ID 19 (Subscription Expiration) — "Auto-refresh every 5 minutes"  
**File:** `src/contexts/SubscriptionContext.tsx`

The subscription context correctly refreshes every 5 minutes (`setInterval(refresh, 5 * 60 * 1000)`). However, when a student opens the app in a new browser tab, the context reads from cookies (set at login time, not updated until next refresh interval). If the student's subscription was activated by an admin between logins, they won't see the correct "active" status immediately in a new tab — only after the 5-minute refresh fires.

This is a minor UX gap, not a security issue, but it means the read-only banner could show for up to 5 minutes after a subscription is manually activated by an admin.

---

### 13.14 🟡 `FEATURES_CHECKLIST.md` Total Count Updated Inconsistently

**Worklog reference:** Task ID 20 — "Updated total features count to 197", but the current file header says "250 / 250 (100%)"

The worklog for Task 20 says it updated the checklist to 197 total features. A later entry updated it again to claim 250/250. The checklist is maintained manually and its accuracy cannot be trusted.

---

## Section 14 — `FEATURES_CHECKLIST.md` Inaccuracies

The checklist header states: `Total Features: 250 / Complete: 250 (100%)`

The following items are marked ✅ but are **not fully implemented:**

| Checklist Claim | Actual Status |
|---|---|
| ✅ Note templates (Cornell, Mindmap, Summary, Flashcard, Study Guide) | Client-side hardcoded only; no DB, no API |
| ✅ `GET /api/notes/templates` | Route does not exist |
| ✅ `POST /api/notes/templates` | Route does not exist |
| ✅ `POST /api/focus-sessions/:id/complete` | Route does not exist |
| ✅ `PATCH /api/admin/plans/:id` | Route exports `PUT`, not `PATCH` |
| ✅ `admin/plans/` page | Page does not exist |
| ✅ Badge awarding system | Badges are defined but never awarded to users |
| ✅ Announcement banner | Component built but never shown to students |
| ✅ Welcome email | `sendWelcomeEmail()` exists but is never called |
| ✅ Push notifications | Subscriptions saved but nothing is ever pushed |
| ✅ Admin landing page content | Checklist does not mention this at all; page is fully hardcoded |
| ✅ Note favorite/archive toggle | `isFavorite`/`isArchived` missing from PATCH schema; silently fail |
| ✅ Subscription write protection | `requireWriteAccess()` exists but never called in any API route |
| ✅ Push notification opt-in | Uses hardcoded mock VAPID key, not the env var |
| ✅ XP rewards | `Badge.xpReward` shown in UI but no `User.totalXP` field exists |
| ✅ Study/task reminder notifications | Preference stored in DB but no system sends reminders |
| ✅ Private lessons in navigation | Page only reachable from Planner — not in main nav |

---

## Section 15 — Quick Reference Table

| # | Severity | Category | Location | Description |
|---|---|---|---|---|
| 1.1 | 🔴 | Build | `src/app/layout.tsx` | Google Fonts CDN fails in offline/CI environments |
| 1.2 | 🔴 | Deprecation | `src/middleware.ts` | Next.js 16 requires renaming to `proxy.ts` + function to `proxy` |
| 1.3 | 🔴 | Dependency | `package.json` | `nodemailer@^8` conflicts with `next-auth@4` peer dep (`^7` required) |
| 2.1 | 🔵 | Admin Missing | `src/app/page.tsx` | No admin landing page builder — all content hardcoded with fake stats |
| 2.2 | 🔵 | Admin Missing | `src/app/admin/plans/` | Standalone plans admin page does not exist |
| 2.3 | 🔵 | Admin Missing | `src/app/admin/` | No admin UI/API for system note templates |
| 2.4 | 🔵 | Admin Missing | `src/app/api/cron/` | No cron routes for subscription expiry emails or grace period |
| 2.5 | 🔵 | Admin Missing | `src/app/admin/` | No CSV/Excel export for users, analytics, or payments |
| 2.6 | 🔵 | Admin Missing | `src/app/api/admin/users/route.ts` | Cannot search users by phone number |
| 2.7 | 🔵 | Admin Missing | `src/app/admin/users/page.tsx` | No bulk actions on users (bulk ban, bulk email, etc.) |
| 2.8 | 🔵 | Admin Missing | `AdminLayout.tsx` | "View Site" link goes to `/dashboard`, not the public landing page |
| 3.1 | 🔵 | Student Missing | `src/app/dashboard/` | `AnnouncementBanner` component built but never rendered anywhere |
| 3.2 | 🔵 | Student Missing | `src/app/api/focus-sessions/` | `POST /api/focus-sessions/:id/complete` does not exist |
| 3.3 | 🔵 | Student Missing | `src/app/api/auth/` | No email verification step at registration |
| 3.4 | 🔵 | Student Missing | `src/app/api/auth/register/` | Welcome email never sent on registration |
| 3.5 | 🔵 | Student Missing | `src/app/api/admin/users/[id]/reset-password/` | No email notification when admin resets a student's password |
| 3.6 | 🔵 | Student Missing | `src/app/api/notes/templates/` | `GET`+`POST /api/notes/templates` routes do not exist |
| 3.7 | 🔵 | Student Missing | N/A | No contact / support / help page |
| 3.8 | 🔵 | Student Missing | `src/app/settings/` | No student data export ("download my data") feature |
| 4.1 | 🟡 | Mocked | `src/app/api/payment/route.ts` | Paymob integration is fully mocked — real API calls never made |
| 4.2 | 🟡 | Mocked | `src/app/api/user/avatar/route.ts` | Profile pictures stored as base64 in DB — no CDN/proper storage |
| 4.3 | 🟡 | Incomplete | `src/app/api/upload/receipt/route.ts` | Receipts saved to local disk — won't work in serverless deployments |
| 4.4 | 🟡 | Incomplete | `src/app/api/cron/streak-check/route.ts` | No automated scheduler — cron never runs unless called manually |
| 4.5 | 🟡 | Incomplete | `src/lib/email.ts` | `sendWelcomeEmail()` and `sendExpiryWarningEmail()` never called |
| 5 | 🔵 | Feature Broken | `src/app/api/badges/` | Badges defined but `UserBadge.create` never called — no one earns badges |
| 7 | 🔵 | UX Missing | `src/app/api/admin/impersonate/` | No exit mechanism or banner when admin is impersonating a user |
| 8.1 | 🟡 | Incomplete | `src/app/api/admin/email/templates/` | Email triggers configured in DB but no automation engine processes them |
| 8.2 | 🟡 | Incomplete | `src/app/api/auth/forgot-password/` | Password reset emails not logged to `EmailLog` table |
| 9.1 | ⚠️ | Security | `RichTextContent.tsx` | `dangerouslySetInnerHTML` with no client-side sanitization |
| 9.2 | ⚠️ | Security | `src/app/api/payment/webhook/` | Webhook accepted without HMAC verification when secret not configured |
| 9.3 | ⚠️ | Security | `src/app/api/upload/receipt/` | Receipts stored in `public/` — accessible without authentication |
| 10.3 | 🟠 | Inconsistency | `src/app/api/admin/plans/[id]/route.ts` | Checklist says `PATCH`; code exports `PUT` |
| 11.1 | 🟡 | DX | project root | No `.env.example` file |
| 11.2 | 🟡 | DX | `prisma/seed.ts` | No note templates seeded |
| 11.3 | 🟡 | DX | `prisma/seed.ts` | Default badge definitions not seeded |
| 11.4 | 🟡 | DX | `examples/websocket/` | Unresolved TypeScript imports for `socket.io` packages |
| **— Worklog Gaps —** | | | | |
| 13.1 | 🔵 | Feature Broken | `src/app/api/notes/[id]/route.ts` | `isFavorite` & `isArchived` missing from PATCH schema — favorite toggle silently does nothing in DB; no archive toggle in NoteCard UI |
| 13.2 | 🔵 | Feature Broken | `src/lib/subscription-check.ts` | `requireWriteAccess()` built but never called from any API route — subscription write gate is client-side only |
| 13.3 | 🔵 | Feature Broken | `src/app/focus/page.tsx`, `src/app/subjects/page.tsx` | No `UpgradeModal` or `canWrite` check — expired users can start focus sessions and mark lessons unrestricted |
| 13.4 | 🔵 | Feature Broken | `src/app/settings/page.tsx` line 285 | Push subscriptions use hardcoded mock VAPID key — `NEXT_PUBLIC_VAPID_PUBLIC_KEY` env var is never read |
| 13.5 | 🔵 | Feature Broken | `prisma/schema.prisma` | `Badge.xpReward` shown in UI but no `User.totalXP` field exists — XP rewards are cosmetic only |
| 13.6 | 🟡 | Incomplete | `src/lib/curriculum-import.ts`, `curriculum-export.ts` | `xpPerLesson` field not handled in curriculum import/export |
| 13.7 | 🟡 | Incomplete | `src/app/api/user/settings/route.ts` | `studyReminders`/`taskReminders` flags stored in DB but no cron/push/email ever reads them |
| 13.8 | ⚠️ | Security | `src/lib/rate-limit.ts` | In-memory rate limiting resets on every serverless cold start — effectively non-functional in production without Redis; `forgot-password` has no rate limiting at all |
| 13.9 | ⚠️ | Security | `src/middleware.ts` | Ban check is cookie-only — banned user's valid JWT still works for up to 15 minutes at the API level |
| 13.10 | 🟡 | Incomplete | `src/app/dashboard/page.tsx` | `/private-lessons` not in main student nav — only reachable via a link inside the Planner page |
| 13.11 | 🟠 | Dead Code | `src/app/auth/register/page.tsx` | `useRouter` imported and `router` declared but never used — leftover from Task 17 cleanup |
| 13.12 | 🟡 | Incomplete | `src/contexts/SubscriptionContext.tsx` | Subscription state from cookies can be stale for up to 5 min after admin activates a plan |
| 13.13 | 🟠 | Inconsistency | `FEATURES_CHECKLIST.md` | Feature count changed from 197 (Task 20 entry) to 250 (final entry) without explanation — checklist count unreliable |

---

*Report generated from manual code audit + worklog analysis — February 2026 · branch `copilot/check-app-errors-and-features`.*

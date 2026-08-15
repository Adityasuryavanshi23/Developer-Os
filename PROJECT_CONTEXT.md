# DeveloperOS AI — Project Context

> **Purpose of this file:** Paste this into a new chat to give the AI full context about this project — what it is, what's built, what's pending, and all the critical technical decisions made so far.

---

## What Is This Project?

**DeveloperOS AI** is a full-stack AI-powered Learning Platform for developers. It's NOT just a task tracker — it's a complete learning OS with:

- Structured curriculum (10 pre-built roadmaps)
- AI-generated learning content per topic (Gemini)
- Progress tracking (skills → topics → status)
- Daily tasks with priority + scheduling
- Spaced repetition revision system
- Analytics with charts
- Interview prep question bank
- Settings / profile management

---

## Tech Stack

### Frontend
| | |
|---|---|
| Framework | React 19 + Vite 8 + TypeScript 6 |
| Routing | react-router-dom v7 |
| State | Zustand v5 (auth only), TanStack Query v5 (server state) |
| HTTP | Axios |
| Animation | Framer Motion v13 |
| Charts | Recharts v3 |
| Icons | lucide-react |
| Forms | react-hook-form + zod |

### Backend
| | |
|---|---|
| Runtime | Node.js |
| Framework | **Express 5** |
| Language | TypeScript 7 |
| ORM | **Prisma 7** (`prisma-client-js` provider) |
| DB Driver | `@prisma/adapter-pg` (PrismaPg adapter) |
| Database | PostgreSQL (Neon cloud) |
| Auth | JWT (`jsonwebtoken`) + bcryptjs |
| AI | `@google/generative-ai` v0.24.1 |
| Validation | Zod |
| Security | helmet + cors + express-rate-limit |

---

## Critical Technical Decisions & Gotchas

### Prisma 7 Breaking Changes
- DB URL goes in `prisma.config.ts` (not directly in `schema.prisma`)
- Must use `@prisma/adapter-pg` + `PrismaPg` driver adapter
- Generated client lives at `../../generated/prisma` (not default path)
- `provider = "prisma-client-js"` in generator block

### Express 5 Error Handler
- Express 5 does NOT auto-detect 4-arg error handlers
- Must explicitly cast/wrap: `app.use((err, req, res, next) => { errorHandler(err, req, res, next) })`

### Gemini AI Model Name
- `gemini-2.5-flash` → **404 error**
- `gemini-1.5-flash-latest` → **404 error** (deprecated alias)
- `gemini-1.5-flash` → **404 error** (removed from v1beta endpoint)
- **`gemini-2.0-flash`** → ✅ **WORKING** (current setting)
- SDK: `@google/generative-ai` v0.24.1 (old SDK, not `@google/genai`)

### Zustand + Page Refresh
- Zustand is in-memory — user object is lost on page refresh
- Fixed via `ProtectedRoute` calling `GET /api/auth/me` on every mount to rehydrate user

### Tasks Date/Time Bug (Fixed)
- Using `datetime-local` input (not `date`) to avoid UTC midnight → IST 5:30 AM display bug
- `formatTime()` returns `null` for midnight UTC timestamps (old tasks without time) — no misleading time badge shown

### Layout: Fixed Sidebar + Scrollable Content
- `DashboardLayout`: outer div `height: 100vh` + `overflow: hidden`
- Sidebar: `height: 100%` — never scrolls
- Main content area: `overflow-y: auto` — scrolls independently

### Analytics Page Width
- `maxWidth` must be `780px` not `900px` (sidebar is ~220px wide, need space)

### UI Styling
- **NO Tailwind classes** for component styling — all inline `style={}` objects (deliberate choice for dynamic cyberpunk colors)
- Tailwind IS installed but only used globally (if at all)
- All UI text/labels/buttons in **English only**
- Hinglish/Hindi only in AI-generated Gemini content when user selects that language

---

## UI Theme

```
Background:    #020c1b  (deep dark navy)
Cards:         rgba(255,255,255,0.03) glassmorphism with border rgba(0,200,255,0.1)
Accent cyan:   #00c8ff
Accent purple: #a78bfa
Text primary:  #e2f0ff
Text muted:    rgba(255,255,255,0.35)
Success green: #4ade80
Error red:     #f87171
```

Style: Cyberpunk / dark glassmorphism. No gradients on backgrounds. Subtle borders.

---

## Project Structure

```
DeveloperOS/
├── frontend/
│   └── src/
│       ├── App.tsx                        — all routes wired
│       ├── index.css                      — global styles + .shimmer + .analytics-row1
│       ├── services/
│       │   └── api.ts                     — axios instance (baseURL: /api)
│       ├── components/
│       │   ├── DashboardLayout.tsx        — height:100vh fixed sidebar layout
│       │   ├── Sidebar.tsx                — avatar initials, nav links, user hydration
│       │   ├── ProtectedRoute.tsx         — calls /auth/me on mount to hydrate user
│       │   ├── GuestRoute.tsx             — redirects logged-in users away from /login
│       │   └── AnimatedBg.tsx             — tsparticles animated background
│       └── features/
│           ├── auth/
│           │   ├── auth.store.ts          — Zustand: { user, token, onboardingPending }
│           │   ├── auth.service.ts        — login, register, me
│           │   ├── LoginPage.tsx
│           │   └── RegisterPage.tsx
│           ├── dashboard/
│           │   ├── DashboardPage.tsx      — stats cards + today's tasks + skills overview
│           │   └── OnboardingPage.tsx     — 3-step flow (name → career goal → first skill)
│           ├── learning/
│           │   ├── LearningPage.tsx       — skills accordion + topics + Browse Curriculum btn
│           │   ├── learning.service.ts    — careerGoalService, skillService, topicService
│           │   ├── curriculum.service.ts  — getAll, getRoadmap, importTopics
│           │   ├── CurriculumModal.tsx    — skill list → select topics → import modal
│           │   ├── topicContent.service.ts — get(topicId), clearCache(topicId)
│           │   └── TopicContentDrawer.tsx — AI content slide-in drawer (3 tabs, 3 langs)
│           ├── tasks/
│           │   ├── TasksPage.tsx          — full CRUD, datetime-local, priority, inline actions
│           │   └── task.service.ts
│           ├── revision/
│           │   ├── RevisionPage.tsx       — spaced repetition schedule, purple theme
│           │   └── revision.service.ts
│           ├── analytics/
│           │   ├── AnalyticsPage.tsx      — Recharts bar/pie/line charts, memo optimized
│           │   └── analytics.service.ts
│           ├── interview/
│           │   ├── InterviewPage.tsx      — question bank CRUD, filters, inline answer editor
│           │   └── interview.service.ts
│           └── settings/
│               ├── SettingsPage.tsx       — profile edit, password change, danger zone
│               └── settings.service.ts
│
└── backend/
    └── src/
        ├── app.ts                         — Express 5 app setup
        ├── config/
        │   └── env.ts                     — all env vars, crashes on missing
        ├── database/
        │   └── prisma.ts                  — Prisma client singleton with PrismaPg adapter
        ├── middleware/
        │   ├── authenticate.ts            — JWT verify → req.userId
        │   └── errorHandler.ts            — global error handler
        ├── routes/
        │   └── index.ts                   — all route groups mounted under /api
        ├── services/
        │   └── gemini.service.ts          — Gemini AI, model: "gemini-1.5-flash"
        ├── data/
        │   └── curriculum.ts              — 10 pre-built roadmaps (static data)
        └── modules/
            ├── auth/                      — register, login, me, updateProfile, changePassword, deleteAccount
            ├── users/                     — careerGoal CRUD
            ├── learning/                  — skill CRUD + topic CRUD (status update)
            ├── tasks/                     — task CRUD + complete/reschedule/priority
            ├── revision/                  — spaced repetition CRUD (Day 1→3→7→15→30→60)
            ├── analytics/                 — 14-day stats aggregation
            ├── interview/                 — question bank + attempts
            ├── curriculum/                — GET list, GET :skill, POST /import
            └── topic-content/             — GET (generate or serve cache), DELETE (clear cache)
```

---

## Database Schema (15 models)

| Model | Description |
|---|---|
| `User` | Root — everything belongs to a user |
| `CareerGoal` | What user wants to become (drives AI) |
| `Skill` | Broad skill area (e.g. "JavaScript", "React") |
| `Topic` | Specific topic inside a skill (e.g. "Closures") |
| `TopicContent` | AI-generated content, cached forever by `topicName` (shared across all users) |
| `Task` | Daily learning tasks with priority + datetime |
| `StudySession` | Tracks study time in minutes |
| `Revision` | Spaced repetition schedule (Day 1→3→7→15→30→60) |
| `Note` | User notes per topic (markdown) |
| `Quiz` | AI-generated MCQ quiz per topic |
| `QuizAttempt` | User's quiz answers + correctness |
| `InterviewQuestion` | Interview prep questions (manual or AI) |
| `InterviewAttempt` | User's answers + AI feedback + score |
| `Notification` | In-app notifications / reminders |
| `Analytics` | Daily snapshots for charts |

**Migrations:**
- `20260810185702_init` — all base tables
- `20260813155552_add_topic_content` — added TopicContent model

---

## API Routes

All routes are prefixed with `/api`.

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PATCH  /api/auth/profile
PATCH  /api/auth/password
DELETE /api/auth/account

GET    /api/career-goal
PUT    /api/career-goal

GET    /api/learning/skills
POST   /api/learning/skills
DELETE /api/learning/skills/:id
GET    /api/learning/topics
POST   /api/learning/topics
PATCH  /api/learning/topics/:id
DELETE /api/learning/topics/:id

GET    /api/tasks
POST   /api/tasks
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
PATCH  /api/tasks/:id/complete
PATCH  /api/tasks/:id/reschedule

GET    /api/revisions
POST   /api/revisions
PATCH  /api/revisions/:id/complete

GET    /api/analytics/summary
GET    /api/analytics/tasks-14d
GET    /api/analytics/revisions-14d

GET    /api/interview/questions
POST   /api/interview/questions
DELETE /api/interview/questions/:id
GET    /api/interview/questions/:id/attempts
POST   /api/interview/questions/:id/attempts

GET    /api/curriculum
GET    /api/curriculum/:skill
POST   /api/curriculum/import

GET    /api/topic-content/:topicId    — generates with Gemini or serves from cache
DELETE /api/topic-content/:topicId    — clears cache (force regenerate)
```

---

## AI System: Topic Content

**Flow:**
1. User clicks "Learn" on any topic in Learning page
2. `TopicContentDrawer` opens (slide-in from right)
3. Frontend calls `GET /api/topic-content/:topicId`
4. Backend checks `TopicContent` table by `topicName` (shared key)
5. **Cache hit** → returns instantly
6. **Cache miss** → calls Gemini, saves to DB, returns generated content

**Generated content structure:**
```typescript
{
  explanationEn: string   // English explanation (200-300 words)
  explanationHi: string   // Hindi (Devanagari script)
  explanationHl: string   // Hinglish (Hindi in Roman script + English terms)
  codeExample:   string | null   // runnable code example
  interviewQs:   string[]        // 5 interview questions
  resources:     { title: string; url: string }[]  // 3 external links
}
```

**Drawer tabs:** Learn | Code | Interview  
**Language toggles:** English 🇬🇧 | Hinglish 🇮🇳 | Hindi 🇮🇳

---

## Curriculum System (10 Roadmaps)

Pre-built static data in `backend/src/data/curriculum.ts`.

| Roadmap | Category | Topics |
|---|---|---|
| JavaScript | language | ~28 topics (beginner → advanced) |
| TypeScript | language | ~20 topics |
| React | frontend | ~22 topics |
| Next.js | frontend | ~18 topics |
| Node.js | backend | ~22 topics |
| DSA | dsa | ~25 topics |
| Git & GitHub | devops | ~15 topics |
| DevOps & Docker | devops | ~20 topics |
| Databases | backend | ~20 topics |
| System Design | fullstack | ~18 topics |

**Import flow:** Browse Curriculum → select roadmap → pick topics → click Import → topics added to user's Learning page

---

## Completed Features ✅

| Feature | Status |
|---|---|
| Auth (register/login/JWT) | ✅ Done |
| ProtectedRoute + user hydration on refresh | ✅ Done |
| GuestRoute | ✅ Done |
| 3-step Onboarding | ✅ Done |
| Dashboard (stats + tasks + skills) | ✅ Done |
| Learning Page (skills accordion + topics) | ✅ Done |
| Browse Curriculum modal | ✅ Done |
| AI Topic Content Drawer | ✅ Done |
| Tasks Page (full CRUD + datetime + priority) | ✅ Done |
| Revision Page (spaced repetition) | ✅ Done |
| Analytics Page (bar + pie + line charts) | ✅ Done |
| Interview Page (question bank + attempts) | ✅ Done |
| Settings Page (profile + password + delete account) | ✅ Done |
| Sidebar (fixed, avatar initials, user name/email) | ✅ Done |
| Gemini model fix (`gemini-1.5-flash`) | ✅ Fixed |

---

## Pending / Not Built Yet ⬜

| Feature | Notes |
|---|---|
| AI Daily Task Suggestions | "Based on your progress, focus on X today" |
| AI Quiz Generator | MCQ quiz for any topic using Gemini |
| Pre-seeded topic content | Cache common JS/React/DSA topics at startup to avoid first-time delay |
| Notification system | In-app revision reminders, streak alerts |
| Study timer / Study sessions | Timer that logs `StudySession` records |
| Streak tracking | Consecutive days of activity |
| Notes per topic | Markdown editor for user notes |
| Mobile responsive layout | Sidebar collapses on small screens |

---

## Environment Variables

### Backend (`.env`)
```env
DATABASE_URL=postgresql://...          # Neon PostgreSQL connection string
JWT_SECRET=your_jwt_secret
PORT=3000
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key     # From Google AI Studio
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:3000
```
*(Axios baseURL reads from `import.meta.env.VITE_API_URL`)*

---

## Dev Commands

```bash
# Backend
cd backend
npm run dev          # tsx watch src/app.ts
npm run db:generate  # prisma generate
npm run db:migrate   # prisma migrate dev
npm run db:studio    # prisma studio

# Frontend
cd frontend
npm run dev          # vite
npm run build        # tsc -b && vite build
```

---

## Known Issues / Things to Watch

1. **Gemini model** — `gemini-1.5-flash` works with `@google/generative-ai` v0.24.1. If you upgrade to `@google/genai` (new SDK), the import and API changes completely.
2. **Prisma 7** — `prisma.config.ts` must export the DB URL. Do NOT put `url = env("DATABASE_URL")` in `schema.prisma` datasource block.
3. **Express 5** — 4-arg error handlers must be explicitly wrapped (see `app.ts`).
4. **Zod version mismatch** — Frontend uses Zod v4 (`zod@4.4.3`), backend uses Zod v3 (`zod@3.25.76`). Their APIs differ slightly (e.g. `z.string().min()` works the same but some new v4 features differ).
5. **TopicContent is shared** — cached by `topicName` string, not per user. First user to request a topic pays the Gemini cost; everyone else gets it free from cache.

---

*Last updated: Session where Gemini model was fixed from `gemini-1.5-flash-latest` to `gemini-1.5-flash`*

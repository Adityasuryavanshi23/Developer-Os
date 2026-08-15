# DeveloperOS AI — Remaining Documentation Pack

---

# 03 — Feature Specification

## English

Defines every product feature, its purpose, user actions, system behavior, required data, validations, edge cases, and acceptance criteria.

### Core Features

* Authentication
* User onboarding
* Career goals
* Skills & topics
* Daily tasks
* Study timer
* Task completion
* Carry-forward
* Recovery day
* Revision queue
* Notes
* Analytics
* AI Mentor
* Interview preparation
* Notifications
* Settings

### Acceptance Criteria

Every feature must have:

* Expected behavior
* Success state
* Loading state
* Empty state
* Error state
* Permission rules
* Mobile behavior

## Hinglish

Isme **har feature exactly kya karega** define hoga—button click se lekar DB update aur error tak.

---

# 04 — User Flows

## English

Defines how users move through the application.

### Main Flow

```text
Signup
→ Onboarding
→ Career Goal
→ Skills
→ Topics
→ Learning Plan
→ Dashboard
→ Today's Tasks
→ Study
→ Complete
→ Revision
→ Analytics
```

### Important Flows

* Login/logout
* Onboarding
* Create skill
* Create topic
* Start task
* Complete task
* Miss task
* Carry-forward
* Revision
* Notes
* AI recommendation
* Interview practice

## Hinglish

User app me **ek screen se doosri screen tak kaise jayega**, woh yahan define hoga.

---

# 05 — Information Architecture

## English

Defines application structure and navigation hierarchy.

```text
App
├── Dashboard
├── Learning
│   ├── Skills
│   └── Topics
├── Tasks
├── Revision
├── Interview
├── Notes
├── Analytics
├── AI Mentor
└── Settings
```

### Navigation Principles

* Most important actions first
* Maximum clarity
* Minimal clicks
* Responsive navigation
* Consistent terminology

## Hinglish

App ke andar **kaunsa page kiske andar hoga aur sidebar/navigation kaisa hoga**, ye document decide karega.

---

# 06 — Database Design

## English

PostgreSQL will be the primary relational database.

### Core Entities

```text
User
CareerGoal
Skill
Topic
Task
StudySession
Revision
Note
Quiz
QuizAttempt
InterviewQuestion
InterviewAttempt
Notification
Analytics
```

### Relationships

```text
User
→ Skills
→ Topics
→ Tasks
→ Revisions
→ Notes
→ Attempts
→ Analytics
```

### Requirements

* Proper foreign keys
* Indexes
* Constraints
* Timestamps
* Soft deletion where required
* Database migrations
* Data isolation per user

## Hinglish

Yahan decide hoga **DB me kaunsi tables hongi, unke columns kya honge aur tables ek doosre se kaise connected hongi.**

---

# 07 — API Specification

## English

Backend APIs will follow REST principles.

### Authentication

```text
POST /auth/register
POST /auth/login
POST /auth/logout
GET  /auth/me
```

### Learning

```text
GET    /skills
POST   /skills
GET    /topics
POST   /topics
PATCH  /topics/:id
DELETE /topics/:id
```

### Tasks

```text
GET   /tasks/today
POST  /tasks
PATCH /tasks/:id
POST  /tasks/:id/complete
POST  /tasks/:id/reschedule
```

### Revision

```text
GET  /revisions/due
POST /revisions/:id/complete
```

### Analytics

```text
GET /analytics/daily
GET /analytics/weekly
GET /analytics/monthly
```

All APIs must include authentication, validation, authorization, consistent errors, and typed responses.

## Hinglish

Frontend backend se **kaise baat karega**, saare endpoints aur unka request/response yahan define hoga.

---

# 08 — AI Engine

## English

The AI Engine provides personalized recommendations based on:

* Career goal
* Skills
* Topics
* Study history
* Revision history
* Quiz performance
* Interview performance
* Missed tasks
* User preferences

### AI Responsibilities

* Generate learning plans
* Recommend today's tasks
* Identify weak topics
* Generate explanations
* Generate quizzes
* Generate interview questions
* Analyze answers
* Recommend revisions
* Provide mentor feedback

### Important Rule

AI must recommend actions based on stored user data rather than generating random generic advice.

## Hinglish

AI ko sirf chatbot nahi banana. **AI ko user ka pura learning history pata hoga** aur uske basis pe next action suggest karega.

---

# 09 — Revision Engine

## English

The Revision Engine manages knowledge retention.

### Initial Revision Schedule

```text
Day 0
→ Day 1
→ Day 3
→ Day 7
→ Day 15
→ Day 30
→ Day 60
```

### Revision Factors

* Last revision date
* Quiz score
* Interview score
* User confidence
* Difficulty
* Number of failures
* Time since learning

### Priority

```text
Critical
High
Medium
Low
```

The system should dynamically adjust future revision intervals.

## Hinglish

User topic padhega → app automatically decide karega **kab dobara revise karna hai**.

Agar quiz me baar-baar galti hui to revision jaldi aayega.

---

# 10 — Reminder Engine

## English

The Reminder Engine manages scheduled notifications.

### Reminder Types

* Daily learning reminder
* Revision reminder
* Missed-task reminder
* Recovery reminder
* Interview reminder
* Streak reminder

### Behavior

```text
Task Due
→ Notification
→ User Completes
```

If missed:

```text
Missed
→ Analyze Workload
→ Reschedule
→ Notify User
```

Notifications must respect user preferences and timezone.

## Hinglish

App khud yaad dilayega:

> "Aaj Closures ka revision due hai."

Aur missed task ko automatically handle karega.

---

# 11 — Design System

## English

The application will use a consistent design system.

### UI Stack

* Tailwind CSS
* shadcn/ui
* Lucide Icons
* Recharts
* Framer Motion

### Components

* Button
* Input
* Select
* Modal
* Dialog
* Card
* Badge
* Progress
* Tabs
* Table
* Dropdown
* Toast
* Tooltip
* Skeleton

### Design Principles

* Clean
* Modern
* Developer-focused
* Accessible
* Responsive
* Consistent spacing
* Clear hierarchy

## Hinglish

Har page ka UI alag-alag nahi hoga. **Same buttons, cards, colors, spacing aur components reuse honge.**

---

# 12 — Frontend Architecture

## English

### Stack

* React
* TypeScript
* Vite
* React Router
* TanStack Query
* Zustand
* React Hook Form
* Zod
* Tailwind CSS
* shadcn/ui

### Architecture

Feature-based architecture:

```text
src/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── learning/
│   ├── tasks/
│   ├── revision/
│   ├── analytics/
│   └── interview/
├── components/
├── hooks/
├── lib/
├── services/
├── types/
└── routes/
```

### Rules

* Strict TypeScript
* No unnecessary global state
* Server state via TanStack Query
* UI/client state via Zustand where needed
* Reusable components
* Lazy loading
* Error boundaries

## Hinglish

React ka code random folders me nahi hoga. **Feature-wise proper architecture** hoga aur har state ke liye sahi tool use hoga.

---

# 13 — Backend Architecture

## English

### Stack

* Node.js
* Express
* TypeScript
* Prisma
* PostgreSQL
* Redis
* BullMQ

### Architecture

```text
src/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── learning/
│   ├── tasks/
│   ├── revision/
│   ├── analytics/
│   └── interview/
├── middleware/
├── config/
├── database/
├── jobs/
├── utils/
└── app.ts
```

### Request Flow

```text
Request
→ Middleware
→ Controller
→ Service
→ Repository/Prisma
→ Database
→ Response
```

### Requirements

* Authentication
* Authorization
* Validation
* Error handling
* Logging
* Rate limiting
* Secure secrets
* Database transactions

## Hinglish

Backend me request seedha DB ko hit nahi karegi. Proper flow hoga:

**Route → Controller → Service → DB**

Isse code maintainable rahega.

---

# 14 — Development Roadmap

## English

### Phase 1 — Foundation

* Repository
* Frontend setup
* Backend setup
* PostgreSQL
* Prisma
* Authentication
* Design system

### Phase 2 — Core Product

* Onboarding
* Goals
* Skills
* Topics
* Tasks
* Study sessions
* Dashboard

### Phase 3 — Intelligence

* Revision engine
* Carry-forward
* Reminders
* Analytics
* Weak-topic detection

### Phase 4 — AI

* AI Mentor
* AI roadmap
* AI explanations
* AI quizzes
* AI recommendations

### Phase 5 — Interview

* Question bank
* Mock interviews
* Scoring
* Feedback

### Phase 6 — Production

* Testing
* Security
* Performance
* Monitoring
* Deployment

### Phase 7 — Future

* Voice interview
* GitHub analysis
* Resume analysis
* Company preparation

## Hinglish

Pehle **foundation**, phir core app, phir intelligence, phir AI, phir interview aur finally advanced features.

---

# 15 — Coding Standards

## English

### General

* TypeScript strict mode
* No unnecessary `any`
* Small reusable functions
* Clear naming
* No duplicated logic
* No hardcoded business data
* Environment variables for secrets

### React

* Functional components
* Reusable hooks
* Correct dependency handling
* Avoid unnecessary re-renders
* Avoid premature memoization

### Backend

* Controller/service separation
* Input validation
* Centralized error handling
* Secure authentication
* Database transactions where required

### Git

Branches:

```text
main
develop
feature/*
fix/*
```

Commits should be meaningful.

Example:

```text
feat: add daily task API
fix: prevent duplicate revision scheduling
refactor: simplify task service
```

### Testing

Important business logic must have tests.

### Coding Agent Rule

Before changing existing code, the agent must:

1. Understand the relevant architecture.
2. Inspect affected files.
3. Identify possible side effects.
4. Explain risky changes.
5. Implement the smallest safe change.
6. Verify affected functionality.

## Hinglish

Coding Agent ko **random code edit karne ki permission nahi hogi**.

Pehle existing code samjhega → impact check karega → phir change karega → test karega.

---

# Documentation Status

```text
01-Vision.md                    ✅
02-User-Research.md             ✅
03-Feature-Specification.md     ✅
04-User-Flows.md                ✅
05-Information-Architecture.md  ✅
06-Database-Design.md            ✅
07-API-Specification.md         ✅
08-AI-Engine.md                 ✅
09-Revision-Engine.md            ✅
10-Reminder-Engine.md            ✅
11-Design-System.md              ✅
12-Frontend-Architecture.md      ✅
13-Backend-Architecture.md       ✅
14-Development-Roadmap.md        ✅
15-Coding-Standards.md            ✅
```

**Total: 15/15 documents covered.**
**Next actual step: `03-Feature-Specification.md` ko detailed version me finalize karna, kyunki coding agent ke liye wahi sabse important blueprint hai.**

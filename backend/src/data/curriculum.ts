// ─── Pre-built Curriculum Data ────────────────────────────────────────────────
// Each roadmap has a skill name + ordered list of topics with level tags.
// Users can browse these and import into their account in one click.

export type Level = "beginner" | "intermediate" | "advanced"

export interface CurriculumTopic {
  name: string
  level: Level
}

export interface CurriculumRoadmap {
  skill: string          // becomes Skill.name
  icon: string           // emoji
  description: string
  category: "frontend" | "backend" | "dsa" | "devops" | "language" | "fullstack"
  topics: CurriculumTopic[]
}

export const CURRICULUM: CurriculumRoadmap[] = [

  // ── JavaScript ──────────────────────────────────────────────────────────────
  {
    skill: "JavaScript",
    icon: "🟨",
    description: "The language of the web — from basics to advanced patterns",
    category: "language",
    topics: [
      // Beginner
      { name: "Variables, let, const, var",            level: "beginner" },
      { name: "Data Types & Type Coercion",            level: "beginner" },
      { name: "Operators & Expressions",               level: "beginner" },
      { name: "Conditionals (if/else, switch)",        level: "beginner" },
      { name: "Loops (for, while, for...of)",          level: "beginner" },
      { name: "Functions & Arrow Functions",           level: "beginner" },
      { name: "Arrays & Array Methods",                level: "beginner" },
      { name: "Objects & Object Methods",              level: "beginner" },
      { name: "String Methods",                        level: "beginner" },
      { name: "DOM Manipulation",                      level: "beginner" },
      { name: "Events & Event Listeners",              level: "beginner" },
      // Intermediate
      { name: "Scope & Closures",                      level: "intermediate" },
      { name: "Hoisting",                              level: "intermediate" },
      { name: "Prototype & Prototypal Inheritance",    level: "intermediate" },
      { name: "this keyword",                          level: "intermediate" },
      { name: "ES6+ Features (Destructuring, Spread)", level: "intermediate" },
      { name: "Promises & async/await",                level: "intermediate" },
      { name: "Fetch API & AJAX",                      level: "intermediate" },
      { name: "Error Handling (try/catch)",            level: "intermediate" },
      { name: "Modules (import/export)",               level: "intermediate" },
      { name: "Higher Order Functions (map/filter/reduce)", level: "intermediate" },
      { name: "Set & Map",                             level: "intermediate" },
      // Advanced
      { name: "Event Loop & Call Stack",               level: "advanced" },
      { name: "Microtasks & Macrotasks",               level: "advanced" },
      { name: "WeakMap & WeakRef",                     level: "advanced" },
      { name: "Generators & Iterators",                level: "advanced" },
      { name: "Proxy & Reflect",                       level: "advanced" },
      { name: "Memory Management & Garbage Collection",level: "advanced" },
      { name: "Design Patterns in JS",                 level: "advanced" },
      { name: "Web Workers",                           level: "advanced" },
    ],
  },

  // ── TypeScript ──────────────────────────────────────────────────────────────
  {
    skill: "TypeScript",
    icon: "🔷",
    description: "Typed JavaScript — write safer, scalable code",
    category: "language",
    topics: [
      { name: "Type Annotations & Inference",          level: "beginner" },
      { name: "Primitive Types & Any/Unknown",         level: "beginner" },
      { name: "Interfaces vs Types",                   level: "beginner" },
      { name: "Arrays, Tuples & Enums",                level: "beginner" },
      { name: "Functions with Types",                  level: "beginner" },
      { name: "Union & Intersection Types",            level: "intermediate" },
      { name: "Generics",                              level: "intermediate" },
      { name: "Type Narrowing & Guards",               level: "intermediate" },
      { name: "Utility Types (Partial, Pick, Omit)",   level: "intermediate" },
      { name: "Classes & Access Modifiers",            level: "intermediate" },
      { name: "Decorators",                            level: "advanced" },
      { name: "Mapped & Conditional Types",            level: "advanced" },
      { name: "Template Literal Types",                level: "advanced" },
      { name: "Declaration Files (.d.ts)",             level: "advanced" },
      { name: "tsconfig Deep Dive",                    level: "advanced" },
    ],
  },

  // ── React ────────────────────────────────────────────────────────────────────
  {
    skill: "React",
    icon: "⚛️",
    description: "Build modern UIs with the world's most popular frontend library",
    category: "frontend",
    topics: [
      { name: "JSX & Rendering",                       level: "beginner" },
      { name: "Components (Function & Class)",         level: "beginner" },
      { name: "Props & PropTypes",                     level: "beginner" },
      { name: "useState Hook",                         level: "beginner" },
      { name: "useEffect Hook",                        level: "beginner" },
      { name: "Event Handling in React",               level: "beginner" },
      { name: "Conditional Rendering",                 level: "beginner" },
      { name: "Lists & Keys",                          level: "beginner" },
      { name: "Forms & Controlled Components",         level: "intermediate" },
      { name: "useRef Hook",                           level: "intermediate" },
      { name: "useContext & Context API",              level: "intermediate" },
      { name: "useReducer Hook",                       level: "intermediate" },
      { name: "useMemo & useCallback",                 level: "intermediate" },
      { name: "Custom Hooks",                          level: "intermediate" },
      { name: "React Router DOM",                      level: "intermediate" },
      { name: "Code Splitting & Lazy Loading",         level: "intermediate" },
      { name: "Error Boundaries",                      level: "intermediate" },
      { name: "React Query / TanStack Query",          level: "advanced" },
      { name: "State Management (Zustand/Redux)",      level: "advanced" },
      { name: "React Performance Optimization",        level: "advanced" },
      { name: "Portals & Refs (forwardRef)",           level: "advanced" },
      { name: "Testing React (Vitest/RTL)",            level: "advanced" },
      { name: "Server Components (RSC)",               level: "advanced" },
    ],
  },

  // ── Next.js ──────────────────────────────────────────────────────────────────
  {
    skill: "Next.js",
    icon: "▲",
    description: "The React framework for production — SSR, SSG, API routes",
    category: "fullstack",
    topics: [
      { name: "Pages Router vs App Router",            level: "beginner" },
      { name: "File-based Routing",                    level: "beginner" },
      { name: "Link & Image Components",               level: "beginner" },
      { name: "Static Site Generation (SSG)",          level: "beginner" },
      { name: "Server-Side Rendering (SSR)",           level: "intermediate" },
      { name: "Incremental Static Regeneration (ISR)", level: "intermediate" },
      { name: "API Routes",                            level: "intermediate" },
      { name: "Middleware",                            level: "intermediate" },
      { name: "Server Actions",                        level: "intermediate" },
      { name: "App Router & Layouts",                  level: "intermediate" },
      { name: "Data Fetching Patterns",                level: "intermediate" },
      { name: "Authentication (NextAuth.js)",          level: "intermediate" },
      { name: "Streaming & Suspense",                  level: "advanced" },
      { name: "Edge Runtime",                          level: "advanced" },
      { name: "Next.js Caching Strategies",            level: "advanced" },
      { name: "Deployment on Vercel",                  level: "advanced" },
    ],
  },

  // ── Node.js ──────────────────────────────────────────────────────────────────
  {
    skill: "Node.js",
    icon: "🟢",
    description: "Backend JavaScript — build servers, APIs and CLI tools",
    category: "backend",
    topics: [
      { name: "Node.js Architecture & Event Loop",     level: "beginner" },
      { name: "Modules (CommonJS & ESM)",              level: "beginner" },
      { name: "File System (fs module)",               level: "beginner" },
      { name: "HTTP Module & Creating Server",         level: "beginner" },
      { name: "NPM & package.json",                    level: "beginner" },
      { name: "Express.js Basics",                     level: "intermediate" },
      { name: "Middleware & Error Handling",           level: "intermediate" },
      { name: "REST API Design",                       level: "intermediate" },
      { name: "Authentication (JWT)",                  level: "intermediate" },
      { name: "Working with Databases (Prisma/ORM)",  level: "intermediate" },
      { name: "Environment Variables & Config",        level: "intermediate" },
      { name: "Streams & Buffers",                     level: "advanced" },
      { name: "Worker Threads",                        level: "advanced" },
      { name: "Clustering & PM2",                      level: "advanced" },
      { name: "WebSockets (Socket.io)",                level: "advanced" },
    ],
  },

  // ── DSA ──────────────────────────────────────────────────────────────────────
  {
    skill: "Data Structures & Algorithms",
    icon: "🧩",
    description: "Core CS fundamentals — crack any coding interview",
    category: "dsa",
    topics: [
      // Beginner
      { name: "Time & Space Complexity (Big O)",       level: "beginner" },
      { name: "Arrays & Strings",                      level: "beginner" },
      { name: "Two Pointers",                          level: "beginner" },
      { name: "Sliding Window",                        level: "beginner" },
      { name: "Hashing & HashMaps",                    level: "beginner" },
      { name: "Stacks",                                level: "beginner" },
      { name: "Queues",                                level: "beginner" },
      { name: "Linked Lists",                          level: "beginner" },
      // Intermediate
      { name: "Binary Search",                         level: "intermediate" },
      { name: "Recursion & Backtracking",              level: "intermediate" },
      { name: "Trees (Binary Tree, BST)",              level: "intermediate" },
      { name: "Tree Traversals (BFS/DFS)",             level: "intermediate" },
      { name: "Heaps & Priority Queue",                level: "intermediate" },
      { name: "Sorting Algorithms",                    level: "intermediate" },
      { name: "Graphs — Representation",               level: "intermediate" },
      { name: "Graph BFS & DFS",                       level: "intermediate" },
      // Advanced
      { name: "Dynamic Programming — 1D",              level: "advanced" },
      { name: "Dynamic Programming — 2D",              level: "advanced" },
      { name: "Greedy Algorithms",                     level: "advanced" },
      { name: "Tries",                                 level: "advanced" },
      { name: "Union Find (Disjoint Set)",             level: "advanced" },
      { name: "Topological Sort",                      level: "advanced" },
      { name: "Segment Trees",                         level: "advanced" },
      { name: "Bit Manipulation",                      level: "advanced" },
    ],
  },

  // ── Git & GitHub ─────────────────────────────────────────────────────────────
  {
    skill: "Git & GitHub",
    icon: "🔀",
    description: "Version control — essential for every developer",
    category: "devops",
    topics: [
      { name: "Git Init, Add, Commit",                 level: "beginner" },
      { name: "Branching & Merging",                   level: "beginner" },
      { name: "Push, Pull, Clone",                     level: "beginner" },
      { name: "Pull Requests & Code Review",           level: "intermediate" },
      { name: "Rebasing & Cherry-pick",                level: "intermediate" },
      { name: "Git Stash & Reset",                     level: "intermediate" },
      { name: "GitHub Actions (CI/CD Basics)",         level: "advanced" },
      { name: "Git Hooks",                             level: "advanced" },
    ],
  },

  // ── DevOps ───────────────────────────────────────────────────────────────────
  {
    skill: "DevOps",
    icon: "⚙️",
    description: "Deploy, scale and automate your applications",
    category: "devops",
    topics: [
      { name: "Linux Basics & Shell Scripting",        level: "beginner" },
      { name: "SSH & Remote Servers",                  level: "beginner" },
      { name: "Nginx — Reverse Proxy Setup",           level: "intermediate" },
      { name: "Docker — Images & Containers",          level: "intermediate" },
      { name: "Docker Compose",                        level: "intermediate" },
      { name: "CI/CD Pipelines (GitHub Actions)",      level: "intermediate" },
      { name: "Environment & Secret Management",       level: "intermediate" },
      { name: "Kubernetes Basics",                     level: "advanced" },
      { name: "Cloud Platforms (AWS/GCP basics)",      level: "advanced" },
      { name: "Monitoring & Logging (Grafana)",        level: "advanced" },
    ],
  },

  // ── Databases ────────────────────────────────────────────────────────────────
  {
    skill: "Databases",
    icon: "🗄️",
    description: "SQL, NoSQL and how to model your data",
    category: "backend",
    topics: [
      { name: "SQL Basics (SELECT, INSERT, UPDATE)",   level: "beginner" },
      { name: "Joins (INNER, LEFT, RIGHT)",            level: "beginner" },
      { name: "Indexes & Query Optimization",          level: "intermediate" },
      { name: "Transactions & ACID",                   level: "intermediate" },
      { name: "Database Design & Normalization",       level: "intermediate" },
      { name: "PostgreSQL Deep Dive",                  level: "intermediate" },
      { name: "MongoDB & NoSQL Concepts",              level: "intermediate" },
      { name: "Redis — Caching & Sessions",            level: "advanced" },
      { name: "Database Scaling & Sharding",           level: "advanced" },
    ],
  },

  // ── System Design ────────────────────────────────────────────────────────────
  {
    skill: "System Design",
    icon: "🏗️",
    description: "Design scalable systems — for senior roles & interviews",
    category: "backend",
    topics: [
      { name: "Client-Server Architecture",            level: "beginner" },
      { name: "REST vs GraphQL vs gRPC",               level: "intermediate" },
      { name: "Load Balancing",                        level: "intermediate" },
      { name: "Caching Strategies (CDN, Redis)",       level: "intermediate" },
      { name: "Database Replication & Sharding",       level: "intermediate" },
      { name: "Message Queues (Kafka, RabbitMQ)",      level: "advanced" },
      { name: "Microservices Architecture",            level: "advanced" },
      { name: "CAP Theorem",                           level: "advanced" },
      { name: "Rate Limiting & API Gateway",           level: "advanced" },
      { name: "Designing Twitter / URL Shortener",     level: "advanced" },
    ],
  },
]

# Project Structure

This document explains the folder organization and the purpose of each file in the Jazz LMS project.

---

## Root Directory Overview

```
jazz-lms/
├── prisma/              # Database schema and seed files
├── public/              # Static assets (images, PDFs)
├── src/                 # Source code (main application)
├── docs/                # Documentation (you are here!)
├── .env                 # Environment variables (not in git)
├── package.json         # Dependencies and scripts
├── tailwind.config.ts   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
├── next.config.mjs      # Next.js configuration
└── README.md            # Project readme
```

---

## 📁 `/prisma` - Database Configuration

This folder contains everything related to the database schema and initial data.

```
prisma/
├── schema.prisma     # Database model definitions
├── seed.ts           # Main seed script (creates course data)
└── seed-sample.ts    # Alternative seed with sample data
```

### Key Files

#### `schema.prisma`

Defines the structure of your database tables:

- **Course** - The main course (e.g., "La Cultura del Jazz")
- **Chapter** - Sections within a course
- **Lesson** - Individual video lessons
- **Attachment** - PDFs attached to lessons
- **Purchase** - Records of who bought what
- **UserProgress** - Tracks completed lessons

#### `seed.ts`

Populates the database with initial data. Run with:

```bash
npm run seed
```

---

## 📁 `/public` - Static Assets

Files in this folder are served directly at the root URL.

```
public/
├── favicon.ico       # Browser tab icon
├── file.svg          # File icon
├── globe.svg         # Globe icon
├── next.svg          # Next.js logo
├── vercel.svg        # Vercel logo
├── window.svg        # Window icon
└── pdfs/
    └── placeholder.pdf   # Sample PDF attachment
```

**Note**: Files here are accessible at `https://yoursite.com/file.svg`

---

## 📁 `/src` - Application Source Code

This is where all the application logic lives.

```
src/
├── app/              # Pages and API routes (Next.js App Router)
├── components/       # Reusable UI components
├── hooks/            # Custom React hooks
├── lib/              # Utility functions and configurations
├── utils/            # Helper functions (Supabase clients)
├── actions/          # Server actions
└── middleware.ts     # Request middleware (runs before routes)
```

---

## 📁 `/src/app` - Pages and API Routes

This folder uses the **Next.js App Router**. The folder structure directly maps to URL routes.

```
src/app/
├── favicon.ico           # Site favicon
├── globals.css           # Global styles (CSS variables)
├── layout.tsx            # Root layout (wraps all pages)
├── page.tsx              # Homepage (/)
│
├── auth/
│   ├── page.tsx          # Login page (/auth)
│   └── callback/
│       └── route.ts      # OAuth callback (/auth/callback)
│
├── dashboard/
│   └── page.tsx          # User dashboard (/dashboard)
│
├── courses/
│   └── [courseId]/
│       └── lessons/
│           └── [lessonId]/
│               └── page.tsx    # Lesson player (/courses/abc/lessons/xyz)
│
└── api/
    ├── checkout/
    │   └── route.ts      # POST /api/checkout
    │
    ├── courses/
    │   └── [courseId]/
    │       └── lessons/
    │           └── [lessonId]/
    │               └── progress/
    │                   └── route.ts    # PUT /api/courses/.../progress
    │
    └── webhooks/
      └── dodo-jazzlms/
        └── route.ts  # POST /api/webhooks/dodo-jazzlms
```

### Understanding the Naming Convention

| File/Folder  | Purpose                                                      |
| ------------ | ------------------------------------------------------------ |
| `page.tsx`   | Defines a page component (creates a route)                   |
| `layout.tsx` | Wraps child pages (shared UI like headers)                   |
| `route.ts`   | Defines an API endpoint                                      |
| `[param]`    | Dynamic route segment (e.g., `[courseId]` matches any value) |

### How Routes Work

```
Folder Structure                    → URL
─────────────────────────────────────────────────────
src/app/page.tsx                    → /
src/app/auth/page.tsx               → /auth
src/app/dashboard/page.tsx          → /dashboard
src/app/courses/[courseId]/lessons/[lessonId]/page.tsx
                                    → /courses/abc123/lessons/xyz789
src/app/api/checkout/route.ts       → POST /api/checkout
```

---

## 📁 `/src/components` - UI Components

Reusable React components organized by feature.

```
src/components/
├── course/
│   ├── course-player.tsx       # Main video player with controls
│   ├── course-sidebar.tsx      # Navigation sidebar showing chapters
│   └── course-sidebar-item.tsx # Individual chapter in sidebar
│
├── landing/
│   ├── hero.tsx               # Hero section with CTA button
│   ├── benefits.tsx           # Features/benefits section
│   └── press.tsx              # Press mentions section
│
├── layout/
│   ├── header.tsx             # Site header with navigation
│   ├── user-nav.tsx           # User dropdown menu
│   └── logout-button.tsx      # Logout button component
│
└── ui/
    ├── avatar.tsx             # User avatar component
    ├── button.tsx             # Styled button component
    ├── dropdown-menu.tsx      # Dropdown menu component
    └── separator.tsx          # Visual separator line
```

### Component Organization Philosophy

1. **By Feature**: Components are grouped by what feature they belong to (`course/`, `landing/`)
2. **UI Library**: Generic, reusable components go in `ui/` (following shadcn/ui pattern)
3. **Layout**: Components that appear on every page go in `layout/`

---

## 📁 `/src/hooks` - Custom React Hooks

Custom hooks encapsulate reusable logic.

```
src/hooks/
└── use-confetti-store.ts    # Zustand store for confetti animation state
```

### `use-confetti-store.ts`

A global state store using Zustand:

```typescript
// Open confetti animation
confetti.onOpen();

// Check if it's open
if (confetti.isOpen) { ... }

// Close it
confetti.onClose();
```

---

## 📁 `/src/lib` - Library Code

Configuration and utility functions.

```
src/lib/
├── db.ts           # Prisma client singleton
├── dodo-jazzlms.ts # Dodo Payments client configuration
└── utils.ts        # Utility functions (cn for classnames)
```

### Key Files

#### `db.ts` - Database Client

```typescript
// Singleton pattern prevents multiple Prisma instances in development
export const db = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
```

#### `dodo-jazzlms.ts` - Dodo Payments Client

```typescript
export function isDodoConfigured() {
  return Boolean(
    process.env.DODO_PAYMENTS_API_KEY?.trim() &&
    process.env.DODO_PRODUCT_ID?.trim(),
  );
}
```

#### `utils.ts` - Utility Functions

```typescript
// Combines class names conditionally (from shadcn/ui)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 📁 `/src/utils` - Helper Utilities

Helper functions, primarily for Supabase integration.

```
src/utils/
└── supabase/
    ├── client.ts       # Browser-side Supabase client
    ├── server.ts       # Server-side Supabase client
    └── middleware.ts   # Session refresh middleware
```

### Why Two Clients?

| Client      | When to Use                       | Can Access          |
| ----------- | --------------------------------- | ------------------- |
| `client.ts` | In `'use client'` components      | Browser cookies     |
| `server.ts` | In Server Components & API routes | Server-side cookies |

---

## 📁 `/src/actions` - Server Actions

Server-side functions that can be called from components.

```
src/actions/
└── get-progress.ts    # Calculate user's course progress percentage
```

### `get-progress.ts`

Calculates what percentage of the course a user has completed:

```typescript
export const getProgress = async (
  userId: string,
  courseId: string,
): Promise<number> => {
  // Count completed lessons / total lessons * 100
  return progressPercentage;
};
```

---

## 📄 Root Configuration Files

### `package.json`

Defines dependencies and npm scripts:

```json
{
  "scripts": {
    "dev": "next dev", // Start development server
    "build": "next build", // Build for production
    "start": "next start", // Start production server
    "seed": "ts-node prisma/seed.ts", // Seed database
    "postinstall": "prisma generate" // Generate Prisma client
  }
}
```

### `tailwind.config.ts`

Configures Tailwind CSS with custom colors, fonts, and animations.

### `tsconfig.json`

TypeScript configuration with path aliases:

```json
{
  "paths": {
    "@/*": ["./src/*"] // Import with @/components/... instead of ../../../
  }
}
```

### `middleware.ts`

Runs before every request to refresh Supabase session cookies:

```typescript
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}
```

---

## File Naming Conventions

| Convention | Example                 | Purpose                 |
| ---------- | ----------------------- | ----------------------- |
| kebab-case | `course-player.tsx`     | Component files         |
| PascalCase | `CoursePlayer`          | Component names         |
| camelCase  | `getProgress`           | Function names          |
| `use-*.ts` | `use-confetti-store.ts` | Custom hooks            |
| `*.d.ts`   | `next-env.d.ts`         | TypeScript declarations |

---

## Import Aliases

The project uses TypeScript path aliases for cleaner imports:

```typescript
// Instead of this:
import { Button } from "../../../components/ui/button";

// You can write this:
import { Button } from "@/components/ui/button";
```

The `@/` alias points to the `src/` folder.

---

## Summary

```
┌────────────────────────────────────────────────────┐
│                   jazz-lms/                        │
├────────────────────────────────────────────────────┤
│  prisma/         → Database schema & seeds         │
│  public/         → Static files (images, PDFs)     │
│  src/app/        → Pages & API routes              │
│  src/components/ → Reusable UI components          │
│  src/hooks/      → Custom React hooks              │
│  src/lib/        → Config & utilities              │
│  src/utils/      → Helper functions                │
│  src/actions/    → Server-side functions           │
│  docs/           → Documentation                   │
└────────────────────────────────────────────────────┘
```

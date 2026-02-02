# Database Documentation

This document explains the database schema, data models, relationships, and how to work with the database using Prisma.

---

## Overview

The Jazz LMS uses **PostgreSQL** as its database, hosted on **Supabase**. We interact with it using **Prisma**, an ORM (Object-Relational Mapper) that lets us use TypeScript instead of raw SQL.

---

## Database Schema Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           COURSE                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ id          │ title       │ description │ price │ isPublished│   │
│  │ (uuid)      │ (string)    │ (string?)   │ (float)│ (boolean) │   │
│  └──────────────────────────────────────────────────────────────┘   │
│         │                                                 │          │
│         │ 1:many                                          │ 1:many   │
│         ▼                                                 ▼          │
│  ┌─────────────────┐                           ┌──────────────────┐  │
│  │    CHAPTER      │                           │    PURCHASE      │  │
│  │ id, title,      │                           │ id, userId,      │  │
│  │ position        │                           │ courseId         │  │
│  └─────────────────┘                           └──────────────────┘  │
│         │                                                            │
│         │ 1:many                                                     │
│         ▼                                                            │
│  ┌─────────────────┐                                                 │
│  │    LESSON       │                                                 │
│  │ id, title,      │                                                 │
│  │ videoUrl,       │                                                 │
│  │ position        │                                                 │
│  └─────────────────┘                                                 │
│         │                    │                                       │
│         │ 1:many             │ 1:many                                │
│         ▼                    ▼                                       │
│  ┌─────────────────┐  ┌──────────────────┐                          │
│  │  ATTACHMENT     │  │  USERPROGRESS    │                          │
│  │ id, name, url   │  │ id, userId,      │                          │
│  │ lessonId        │  │ lessonId,        │                          │
│  │                 │  │ isCompleted      │                          │
│  └─────────────────┘  └──────────────────┘                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Models Explained

### 1. Course

**Purpose**: Represents a purchasable course.

```prisma
model Course {
  id          String     @id @default(uuid())
  title       String
  description String?
  imageUrl    String?
  price       Float?
  isPublished Boolean    @default(false)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  // Relations
  chapters    Chapter[]
  purchases   Purchase[]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier (auto-generated) |
| `title` | String | Course name (e.g., "La Cultura del Jazz") |
| `description` | String? | Course description (optional) |
| `imageUrl` | String? | Cover image URL (optional) |
| `price` | Float? | Price in dollars (e.g., 99.99) |
| `isPublished` | Boolean | Whether course is visible to users |
| `createdAt` | DateTime | When created |
| `updatedAt` | DateTime | When last modified (auto-updated) |

**Relationships**:
- One Course has many Chapters
- One Course has many Purchases

---

### 2. Chapter

**Purpose**: Groups lessons into sections (like a book's chapters).

```prisma
model Chapter {
  id          String   @id @default(uuid())
  title       String
  description String?
  position    Int
  isPublished Boolean  @default(false)
  courseId    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessons     Lesson[]

  @@unique([courseId, position])
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `title` | String | Chapter title (e.g., "Introduction") |
| `description` | String? | Chapter description |
| `position` | Int | Order in the course (1, 2, 3...) |
| `isPublished` | Boolean | Whether chapter is visible |
| `courseId` | String | Foreign key to Course |

**Special Constraints**:
- `@@unique([courseId, position])` - No two chapters in the same course can have the same position

**Cascade Delete**: When a Course is deleted, all its Chapters are automatically deleted.

---

### 3. Lesson

**Purpose**: Individual video lessons within a chapter.

```prisma
model Lesson {
  id           String         @id @default(uuid())
  title        String
  description  String?
  videoUrl     String?
  position     Int
  isPublished  Boolean        @default(false)
  chapterId    String
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  
  // Relations
  attachments  Attachment[]
  chapter      Chapter        @relation(fields: [chapterId], references: [id], onDelete: Cascade)
  userProgress UserProgress[]

  @@unique([chapterId, position])
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `title` | String | Lesson title |
| `description` | String? | Lesson description |
| `videoUrl` | String? | Mux playback ID for the video |
| `position` | Int | Order within the chapter |
| `isPublished` | Boolean | Whether lesson is visible |
| `chapterId` | String | Foreign key to Chapter |

**Note**: `videoUrl` stores the Mux playback ID, not a full URL.

---

### 4. Attachment

**Purpose**: Downloadable files (PDFs) attached to lessons.

```prisma
model Attachment {
  id        String   @id @default(uuid())
  name      String
  url       String
  lessonId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relation
  lesson    Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@index([lessonId])
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `name` | String | Display name (e.g., "Lesson PDF") |
| `url` | String | Path to file (e.g., "/pdfs/lesson1.pdf") |
| `lessonId` | String | Foreign key to Lesson |

**Index**: `@@index([lessonId])` - Makes lookups by lessonId faster.

---

### 5. Purchase

**Purpose**: Records that a user has bought a course.

```prisma
model Purchase {
  id        String   @id @default(uuid())
  userId    String
  courseId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relation
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([userId, courseId])
  @@index([courseId])
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `userId` | String | User ID from Supabase Auth |
| `courseId` | String | Foreign key to Course |

**Special Constraints**:
- `@@unique([userId, courseId])` - A user can only purchase a course once

**Note**: `userId` references Supabase Auth, not a User table in Prisma. This is a common pattern when using external auth providers.

---

### 6. UserProgress

**Purpose**: Tracks which lessons a user has completed.

```prisma
model UserProgress {
  id          String   @id @default(uuid())
  userId      String
  lessonId    String
  isCompleted Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relation
  lesson      Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@unique([userId, lessonId])
  @@index([lessonId])
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `userId` | String | User ID from Supabase Auth |
| `lessonId` | String | Foreign key to Lesson |
| `isCompleted` | Boolean | Whether user completed this lesson |

**Special Constraints**:
- `@@unique([userId, lessonId])` - One progress record per user per lesson

---

## Prisma Client Usage

### The Database Client

```typescript
// src/lib/db.ts

import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const db = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = db;
```

**Why this pattern?**  
In development, Next.js hot-reloads often. Without this singleton pattern, you'd create a new database connection on every reload, eventually running out of connections.

### Common Queries

#### Find a course with all its data:
```typescript
const course = await db.course.findUnique({
  where: { id: courseId },
  include: {
    chapters: {
      orderBy: { position: 'asc' },
      include: {
        lessons: {
          orderBy: { position: 'asc' },
          include: {
            attachments: true,
          },
        },
      },
    },
  },
});
```

#### Find user's purchases:
```typescript
const purchases = await db.purchase.findMany({
  where: { userId: user.id },
  include: {
    course: true,
  },
});
```

#### Create a purchase:
```typescript
await db.purchase.create({
  data: {
    courseId: courseId,
    userId: userId,
  },
});
```

#### Update or create progress (Upsert):
```typescript
const progress = await db.userProgress.upsert({
  where: {
    userId_lessonId: {
      userId: user.id,
      lessonId: lessonId,
    },
  },
  update: {
    isCompleted: true,
  },
  create: {
    userId: user.id,
    lessonId: lessonId,
    isCompleted: true,
  },
});
```

#### Count completed lessons:
```typescript
const completedCount = await db.userProgress.count({
  where: {
    userId: userId,
    lessonId: { in: lessonIds },
    isCompleted: true,
  },
});
```

---

## Database Commands

### Generate Prisma Client
After changing `schema.prisma`, regenerate the client:
```bash
npx prisma generate
```

### Push Schema Changes
Apply schema changes to the database (development):
```bash
npx prisma db push
```

### Create Migration (Production)
Create a migration file for production:
```bash
npx prisma migrate dev --name "description_of_change"
```

### Seed Database
Run the seed script:
```bash
npm run seed
```

### Open Prisma Studio
Visual database browser:
```bash
npx prisma studio
```

---

## Seeding the Database

The seed script (`prisma/seed.ts`) populates the database with initial data:

```typescript
// Example structure from seed.ts
await database.course.create({
  data: {
    title: 'La Cultura del Jazz',
    description: 'Curso Online con Enric Vazquez Ramonich',
    price: 99.99,
    chapters: {
      create: [
        {
          title: 'Introducción',
          position: 1,
          lessons: {
            create: [
              {
                title: 'Introducción a la Cultura del Jazz',
                position: 1,
                videoUrl: 'YOUR_MUX_VIDEO_ID',
                attachments: {
                  create: [
                    {
                      name: 'Lesson PDF',
                      url: '/pdfs/placeholder.pdf',
                    },
                  ],
                },
              },
            ],
          },
        },
        // ... more chapters
      ],
    },
  },
});
```

**How nested creates work**: Prisma allows creating related records in a single query. This creates a Course, its Chapters, the Lessons in those Chapters, and the Attachments for those Lessons - all at once!

---

## Relationship Types

### One-to-Many (1:N)
```
Course ─────1:N───── Chapter
Chapter ────1:N───── Lesson
Lesson ─────1:N───── Attachment
Lesson ─────1:N───── UserProgress
Course ─────1:N───── Purchase
```

### How to define in Prisma:

```prisma
// On the "one" side (Course):
model Course {
  chapters Chapter[]  // Array of chapters
}

// On the "many" side (Chapter):
model Chapter {
  courseId String     // Foreign key
  course   Course     @relation(fields: [courseId], references: [id])
}
```

---

## Constraints and Indexes

### Unique Constraints
Prevent duplicate data:
```prisma
@@unique([userId, courseId])      // One purchase per user per course
@@unique([userId, lessonId])      // One progress per user per lesson
@@unique([courseId, position])    // Unique position per chapter
@@unique([chapterId, position])   // Unique position per lesson
```

### Indexes
Speed up queries:
```prisma
@@index([lessonId])   // Fast lookup by lessonId
@@index([courseId])   // Fast lookup by courseId
```

---

## Cascade Deletes

When a parent is deleted, children are automatically deleted:

```prisma
@relation(fields: [courseId], references: [id], onDelete: Cascade)
```

**Delete chain**:
```
Delete Course
    └── Deletes all Chapters
        └── Deletes all Lessons
            └── Deletes all Attachments
            └── Deletes all UserProgress
    └── Deletes all Purchases
```

**Warning**: This is powerful but dangerous. Be careful when deleting courses!

---

## Environment Variables

The database connection is configured in `.env`:

```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
```

For Supabase, this looks like:
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

---

## Best Practices

### 1. Always use `orderBy` for ordered data
```typescript
// Good
chapters: { orderBy: { position: 'asc' } }

// Bad - order not guaranteed
chapters: true
```

### 2. Use `include` sparingly
Only include relations you need:
```typescript
// Good - only include what's needed
include: { chapters: true }

// Bad - loads everything (slow)
include: { chapters: { include: { lessons: { include: { attachments: true, userProgress: true } } } } }
```

### 3. Use transactions for multiple operations
```typescript
await db.$transaction([
  db.userProgress.updateMany({ ... }),
  db.purchase.create({ ... }),
]);
```

### 4. Handle errors gracefully
```typescript
try {
  const course = await db.course.findUnique({ ... });
  if (!course) {
    // Handle not found
  }
} catch (error) {
  console.error('[DB_ERROR]', error);
}
```


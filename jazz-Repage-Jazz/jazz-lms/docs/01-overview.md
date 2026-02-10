# Jazz LMS - Project Overview

## What is this project?

**Jazz LMS** (Learning Management System) is a web application that allows users to purchase and watch video courses online. Think of it like a custom-built version of Udemy or Coursera, specifically designed for "La Cultura del Jazz" - a Jazz culture course by Enric Vazquez Ramonich.

## What does it do?

The platform provides the following core features:

1. **Landing Page** - A beautiful homepage that showcases the course and encourages visitors to enroll
2. **User Authentication** - Users can sign up and log in using their GitHub account (or email)
3. **Payment Processing** - Users can purchase courses using credit cards via Stripe
4. **Video Streaming** - Premium video content is streamed securely using Mux
5. **Progress Tracking** - Users can track their progress through the course
6. **Dashboard** - Users can see all their purchased courses and completion status

## How does it work? (Bird's Eye View)

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER JOURNEY                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User visits website ──► Landing Page loads                  │
│                                                                  │
│  2. User clicks "Enroll" ──► Redirected to Auth (if not logged) │
│                                                                  │
│  3. User logs in via GitHub ──► Supabase handles authentication │
│                                                                  │
│  4. User proceeds to checkout ──► Stripe payment page           │
│                                                                  │
│  5. Payment successful ──► Stripe webhook notifies our server   │
│                                                                  │
│  6. Server creates Purchase record in database                  │
│                                                                  │
│  7. User can now access course videos ──► Mux streams video     │
│                                                                  │
│  8. User completes lessons ──► Progress saved to database       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## The Tech Stack (Technologies Used)

| Technology | Purpose | Why it's used |
|------------|---------|---------------|
| **Next.js** | Web framework | Handles both frontend (what users see) and backend (server logic) |
| **React** | UI library | Creates interactive user interfaces |
| **TypeScript** | Programming language | JavaScript with type safety, catches bugs early |
| **Tailwind CSS** | Styling | Makes it easy to design beautiful interfaces |
| **Supabase** | Authentication & Database hosting | Handles user login and hosts our PostgreSQL database |
| **Prisma** | Database ORM | Makes it easy to interact with the database using TypeScript |
| **Mux** | Video hosting & streaming | Professional video delivery without buffering issues |
| **Stripe** | Payment processing | Secure credit card payments |
| **Vercel** | Hosting platform | Where the website lives on the internet |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  (What users see and interact with)                             │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Landing   │  │    Auth     │  │  Dashboard  │              │
│  │    Page     │  │    Page     │  │    Page     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                  │
│  ┌─────────────────────────────────────────────┐                │
│  │           Course Player Component            │                │
│  │  ┌─────────────┐  ┌─────────────────────┐   │                │
│  │  │   Sidebar   │  │    Video Player     │   │                │
│  │  │  (Lessons)  │  │       (Mux)         │   │                │
│  │  └─────────────┘  └─────────────────────┘   │                │
│  └─────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│  (Server-side logic - API Routes)                               │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  /checkout  │  │  /progress  │  │  /webhooks  │              │
│  │   (Stripe)  │  │  (Save)     │  │  (Stripe)   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Supabase   │  │    Stripe   │  │     Mux     │              │
│  │  (Auth +    │  │  (Payments) │  │  (Videos)   │              │
│  │  Database)  │  │             │  │             │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

## Key Concepts for Beginners

### Server-Side Rendering (SSR)
Next.js can render pages on the server before sending them to the browser. This means:
- Faster initial page loads
- Better SEO (search engines can read the content)
- Data is fetched on the server, keeping API keys secret

### Client Components vs Server Components
- **Server Components** (default): Run on the server, can access database directly, can't use browser features
- **Client Components** (marked with `'use client'`): Run in the browser, can handle user interactions, can use React hooks

### API Routes
These are backend endpoints built into Next.js. They live in `/app/api/` folder and handle things like:
- Creating checkout sessions
- Receiving webhook notifications
- Updating user progress

### Webhooks
A way for external services (like Stripe) to notify your application when something happens. For example, when a payment is completed, Stripe sends a POST request to your webhook URL.

## File Structure Summary

```
jazz-lms/
├── prisma/           # Database schema and seed data
├── public/           # Static files (images, PDFs)
├── src/
│   ├── app/          # Pages and API routes (Next.js App Router)
│   ├── components/   # Reusable UI components
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utility functions and configurations
│   ├── utils/        # Helper functions (Supabase client)
│   └── actions/      # Server actions
└── docs/             # This documentation
```

## Next Steps

After reading this overview, continue with:
1. [Technologies](./02-technologies.md) - Deep dive into each technology
2. [Project Structure](./03-project-structure.md) - Understand the folder organization
3. [Components](./04-components.md) - Learn about UI components
4. [API Routes](./05-api-routes.md) - Understand the backend endpoints
5. [Database](./06-database.md) - Learn about the data model
6. [Authentication](./07-authentication.md) - Understand how login works
7. [Next Steps & TODOs](./08-next-steps.md) - Future improvements and things to watch out for


# Technologies Deep Dive

This document explains each technology used in the Jazz LMS project, why it was chosen, and how it fits into the overall architecture.

---

## 1. Next.js (v14.2.5)

### What is it?
Next.js is a **React framework** that makes building web applications easier. It's built on top of React and adds powerful features like server-side rendering, routing, and API routes.

### Why use it?
- **All-in-one solution**: Both frontend and backend in one project
- **File-based routing**: Create a file in `/app/courses/page.tsx` and you automatically get a `/courses` route
- **Server Components**: Fetch data on the server, keeping your code fast and secure
- **Automatic optimization**: Images, fonts, and scripts are optimized automatically

### How it's used in this project

```
src/app/
├── page.tsx              # Homepage (/)
├── layout.tsx            # Root layout (wraps all pages)
├── auth/page.tsx         # Auth page (/auth)
├── dashboard/page.tsx    # Dashboard (/dashboard)
├── courses/[courseId]/   # Dynamic route for courses
└── api/                  # Backend API routes
```

### Key Concepts

#### App Router (New in Next.js 13+)
The project uses the new App Router which uses the `/app` directory. Each folder can have:
- `page.tsx` - The page component (what users see)
- `layout.tsx` - A wrapper around pages (shared UI)
- `route.ts` - An API endpoint

#### Server vs Client Components
```tsx
// Server Component (default) - can fetch data directly
export default async function DashboardPage() {
  const data = await db.course.findMany(); // Direct database access!
  return <div>{data.map(...)}</div>;
}

// Client Component - for interactivity
'use client';
export const Button = () => {
  const [count, setCount] = useState(0); // Uses React hooks
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
};
```

---

## 2. React (v18.3.1)

### What is it?
React is a **JavaScript library** for building user interfaces. It lets you create reusable UI components that update efficiently when data changes.

### Core Concepts

#### Components
Everything in React is a component - a reusable piece of UI:
```tsx
// A simple component
const Button = ({ text }) => {
  return <button className="bg-blue-500">{text}</button>;
};

// Using it
<Button text="Click me!" />
```

#### Props
Data passed from parent to child components:
```tsx
// Parent passes data
<Hero course={courseData} />

// Child receives it
const Hero = ({ course }) => {
  return <h1>{course.title}</h1>;
};
```

#### Hooks
Special functions that let you use React features in functional components:
- `useState` - Manage component state
- `useEffect` - Perform side effects
- `useRouter` - Access Next.js router

---

## 3. TypeScript (v5.5.4)

### What is it?
TypeScript is **JavaScript with types**. It adds optional static typing, which helps catch errors before your code runs.

### Why use it?
- **Catch bugs early**: TypeScript tells you about errors while you're coding
- **Better autocomplete**: Your editor knows what properties and methods are available
- **Self-documenting code**: Types serve as documentation

### Example from this project

```typescript
// Without TypeScript - what does course have?
function Hero({ course }) {
  return <h1>{course.title}</h1>;
}

// With TypeScript - crystal clear!
interface Course {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
}

function Hero({ course }: { course: Course | null }) {
  return <h1>{course?.title || 'Welcome'}</h1>;
}
```

---

## 4. Tailwind CSS (v4.0.0-beta)

### What is it?
Tailwind is a **utility-first CSS framework**. Instead of writing custom CSS, you apply pre-built classes directly in your HTML.

### Why use it?
- **Fast development**: No need to switch between files
- **Consistent design**: Use predefined spacing, colors, etc.
- **No CSS conflicts**: Classes are scoped to elements
- **Small bundle size**: Only used classes are included

### Example
```tsx
// Traditional CSS approach
<div className="hero-container">
  <h1 className="hero-title">Hello</h1>
</div>

// Tailwind approach
<div className="flex items-center justify-center h-screen">
  <h1 className="text-4xl font-bold text-gray-900">Hello</h1>
</div>
```

### How it's configured
Check `tailwind.config.ts` for custom colors and themes that use CSS variables:
```typescript
colors: {
  primary: {
    DEFAULT: 'hsl(var(--primary))',
    foreground: 'hsl(var(--primary-foreground))',
  },
  // ...
}
```

---

## 5. Supabase

### What is it?
Supabase is an **open-source Firebase alternative**. It provides:
- Authentication (login/signup)
- PostgreSQL database
- Real-time subscriptions
- Storage for files

### Why use it?
- **Easy authentication**: Google, GitHub, email login out of the box
- **PostgreSQL**: Industry-standard database
- **Free tier**: Generous free tier for small projects
- **Real-time**: Changes sync instantly (though not used in this project)

### How it's used in this project

#### Authentication
```typescript
// Get current user
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();

// Sign out
await supabase.auth.signOut();
```

#### Database Hosting
The PostgreSQL database is hosted on Supabase. We connect to it using Prisma with the `DATABASE_URL` environment variable.

### Important Files
- `src/utils/supabase/client.ts` - Browser-side Supabase client
- `src/utils/supabase/server.ts` - Server-side Supabase client  
- `src/utils/supabase/middleware.ts` - Session management

---

## 6. Prisma (v5.17.0)

### What is it?
Prisma is an **ORM (Object-Relational Mapper)**. It lets you interact with your database using TypeScript instead of raw SQL.

### Why use it?
- **Type safety**: Database queries are type-safe
- **Auto-generated types**: Prisma generates TypeScript types from your schema
- **Easy migrations**: Change your schema and Prisma updates the database
- **Intuitive API**: Queries read like English

### Example

```typescript
// Find a course with its chapters and lessons
const course = await db.course.findUnique({
  where: { id: courseId },
  include: {
    chapters: {
      orderBy: { position: 'asc' },
      include: {
        lessons: {
          orderBy: { position: 'asc' }
        }
      }
    }
  }
});

// Create a purchase
await db.purchase.create({
  data: {
    courseId: course.id,
    userId: user.id,
  }
});
```

### Important Files
- `prisma/schema.prisma` - Database schema definition
- `prisma/seed.ts` - Initial data for the database
- `src/lib/db.ts` - Prisma client singleton

---

## 7. Mux

### What is it?
Mux is a **video infrastructure platform**. It handles video uploading, encoding, and streaming.

### Why use it?
- **Professional streaming**: Adaptive bitrate streaming (adjusts quality based on connection)
- **Global CDN**: Videos load fast anywhere in the world
- **Easy integration**: Simple React player component
- **DRM support**: Protect your content from piracy

### How it works

1. Upload videos to Mux
2. Get a `playbackId` for each video
3. Store the `playbackId` in your database (in `lesson.videoUrl`)
4. Use the Mux Player to display the video

```tsx
import MuxPlayer from '@mux/mux-player-react';

<MuxPlayer
  playbackId={lesson.videoUrl}  // e.g., "a4nOgmxGWg00R5VLg9w6Vx01gH3cPYnZ"
  accentColor="#d4af37"          // Player accent color
  onEnded={onEnded}              // Called when video ends
  autoPlay
/>
```

### Why not just use YouTube embeds?
- **Control**: You own the player experience
- **Analytics**: Detailed viewing statistics
- **No ads**: YouTube might show competitor ads
- **Professional**: No YouTube branding

---

## 8. Stripe (v16.2.0)

### What is it?
Stripe is a **payment processing platform**. It handles credit card payments, subscriptions, and more.

### Why use it?
- **Security**: Stripe handles sensitive payment data (PCI compliance)
- **Easy integration**: Well-documented APIs and libraries
- **Checkout**: Pre-built checkout pages
- **Webhooks**: Get notified when payments complete

### How it works in this project

```
User clicks "Enroll" 
    ↓
App creates a Checkout Session
    ↓
User is redirected to Stripe's checkout page
    ↓
User enters payment info
    ↓
Stripe processes payment
    ↓
Stripe sends webhook to /api/webhooks/stripe
    ↓
App creates Purchase record in database
    ↓
User can now access the course
```

### Important Concepts

#### Checkout Session
A temporary object that represents the customer's intent to pay:
```typescript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{ ... }],
  mode: 'payment',
  success_url: 'https://yoursite.com/success',
  cancel_url: 'https://yoursite.com/cancel',
  metadata: { courseId, userId }, // Custom data
});
```

#### Webhooks
Stripe sends events to your server. You must verify the signature:
```typescript
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

### Important Files
- `src/lib/stripe.ts` - Stripe client configuration
- `src/app/api/checkout/route.ts` - Create checkout sessions
- `src/app/api/webhooks/stripe/route.ts` - Handle Stripe events

---

## 9. Vercel

### What is it?
Vercel is a **cloud platform** for deploying web applications. It was created by the same team that makes Next.js.

### Why use it?
- **Optimized for Next.js**: Perfect integration
- **Zero configuration**: Just push to Git and it deploys
- **Global CDN**: Fast worldwide
- **Serverless functions**: API routes run as serverless functions
- **Free tier**: Great for small projects

### Deployment Process

```
Push to GitHub 
    ↓
Vercel detects changes
    ↓
Builds the Next.js app
    ↓
Deploys to global CDN
    ↓
Your site is live!
```

### Environment Variables
Set these in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

---

## 10. Supporting Libraries

### Zustand (v5.0.8)
A minimal state management library. Used for the confetti store:
```typescript
const useConfettiStore = create((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));
```

### Lucide React (v0.414.0)
Beautiful icon library:
```tsx
import { PlayCircle, CheckCircle, Download } from 'lucide-react';

<PlayCircle className="h-4 w-4" />
```

### Axios (v1.7.2)
HTTP client for making API requests:
```typescript
const response = await axios.post('/api/checkout', { courseId });
```

### Sonner (v2.0.7)
Toast notifications:
```typescript
import { toast } from 'sonner';

toast.success('Lesson completed!');
toast.error('Something went wrong');
```

### Radix UI
Accessible, unstyled UI components:
- `@radix-ui/react-avatar` - User avatars
- `@radix-ui/react-dropdown-menu` - Dropdown menus
- `@radix-ui/react-separator` - Visual separators

---

## Technology Decision Summary

| Decision | Why |
|----------|-----|
| Next.js over plain React | Need SSR, API routes, and easy deployment |
| TypeScript over JavaScript | Type safety prevents bugs |
| Supabase over Firebase | Open-source, PostgreSQL, great auth |
| Prisma over raw SQL | Type-safe queries, easy migrations |
| Mux over YouTube | Professional streaming, no ads |
| Stripe over PayPal | Better developer experience, more features |
| Vercel over AWS | Simpler deployment, optimized for Next.js |
| Tailwind over CSS-in-JS | Faster development, smaller bundle |


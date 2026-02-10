# Components Documentation

This document explains each UI component in the project, its purpose, how it works, and when to use it.

---

## Overview

Components are organized into four categories:

```
src/components/
├── course/      # Components for the course player experience
├── landing/     # Components for the landing/marketing page
├── layout/      # Components that appear on every page
└── ui/          # Generic, reusable UI building blocks
```

---

## 🎬 Course Components (`/components/course/`)

These components power the video learning experience.

### `course-player.tsx`

**Purpose**: The main video player page with video, sidebar, and controls.

**Type**: Client Component (`'use client'`)

**Features**:
- Displays video using Mux Player
- Shows lesson title and description
- Download PDF button for attachments
- "Mark as Complete" button
- Triggers confetti on completion
- Sidebar for navigation

**Key Code Explained**:

```tsx
'use client'; // This needs to run in the browser for interactivity

import MuxPlayer from '@mux/mux-player-react';

export const CoursePlayer = ({ course, lesson, lessonId }) => {
  const [isReady, setIsReady] = useState(false);  // Track if video loaded
  const confetti = useConfettiStore();            // For celebration animation
  const router = useRouter();                     // For refreshing page

  // Called when video finishes playing
  const onEnded = async () => {
    // Save progress to database via API
    await axios.put(`/api/courses/${course.id}/lessons/${lesson.id}/progress`, {
      isCompleted: true,
    });
    
    confetti.onOpen();                // Show confetti! 🎉
    toast.success('Lesson completed!');
    router.refresh();                 // Refresh to show updated progress
  };

  return (
    <div className="flex h-[calc(100vh-80px)]">
      <CourseSidebar course={course} lessonId={lessonId} />
      <div className="flex-1 flex flex-col">
        <MuxPlayer
          playbackId={lesson.videoUrl}  // Mux video ID
          accentColor="#d4af37"          // Gold accent color
          onCanPlay={() => setIsReady(true)}
          onEnded={onEnded}
          autoPlay
        />
        {/* ... buttons and title ... */}
      </div>
    </div>
  );
};
```

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `course` | Course with chapters and lessons | Full course data |
| `lesson` | Lesson with attachments | Current lesson data |
| `lessonId` | string | ID of current lesson |

---

### `course-sidebar.tsx`

**Purpose**: Navigation sidebar showing all chapters and lessons.

**Type**: Server Component (default)

**Features**:
- Displays course title
- Lists all chapters
- Each chapter shows its lessons

**Key Code Explained**:

```tsx
export const CourseSidebar = ({ course, lessonId }) => {
  return (
    <div className="h-full border-r w-80 overflow-y-auto">
      <div className="p-8 border-b">
        <h1 className="font-semibold">{course.title}</h1>
      </div>
      <div className="flex flex-col">
        {course.chapters.map((chapter) => (
          <CourseSidebarItem
            key={chapter.id}
            label={chapter.title}
            lessons={chapter.lessons}
            courseId={course.id}
            lessonId={lessonId}  // To highlight current lesson
          />
        ))}
      </div>
    </div>
  );
};
```

**Why no `'use client'`?**  
This component doesn't need browser features (no useState, no onClick). It just displays data.

---

### `course-sidebar-item.tsx`

**Purpose**: Individual chapter with its lessons in the sidebar.

**Type**: Client Component (`'use client'`)

**Features**:
- Shows chapter title
- Lists lessons with play icons
- Highlights currently active lesson
- Links to each lesson

**Key Code Explained**:

```tsx
'use client';

import { cn } from '@/lib/utils';  // Utility for conditional classes
import Link from 'next/link';

export const CourseSidebarItem = ({ label, lessons, courseId, lessonId }) => {
  return (
    <div>
      <div className="px-8 py-4">
        <p className="font-semibold">{label}</p>  {/* Chapter title */}
      </div>
      {lessons.map((lesson) => (
        <Link href={`/courses/${courseId}/lessons/${lesson.id}`}>
          <div className={cn(
            'flex items-center pl-8 hover:bg-slate-300/20',
            // Highlight if this is the current lesson
            lesson.id === lessonId && 'bg-slate-200/60'
          )}>
            <PlayCircle size={16} />
            <span>{lesson.title}</span>
          </div>
        </Link>
      ))}
    </div>
  );
};
```

**The `cn()` function**:
This is a utility that merges class names conditionally:
```tsx
cn('base-class', condition && 'conditional-class')
// If condition is true: "base-class conditional-class"
// If condition is false: "base-class"
```

---

## 🏠 Landing Components (`/components/landing/`)

These components build the marketing homepage.

### `hero.tsx`

**Purpose**: The main hero section with course title, description, and enrollment button.

**Type**: Client Component (`'use client'`)

**Features**:
- Displays course title and description
- "Enroll Now" button that initiates checkout
- Handles null course gracefully

**Key Code Explained**:

```tsx
'use client';

export const Hero = ({ course }: { course: Course | null }) => {
  // Checkout flow
  const handleCheckout = async () => {
    if (!course) return;

    // Get current user
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('User not logged in');
      return;  // Could redirect to /auth here
    }

    // Create Stripe checkout session
    const response = await axios.post('/api/checkout', {
      courseId: course.id,
    });

    // Redirect to Stripe checkout page
    window.location.href = response.data.url;
  };

  return (
    <div className="text-center py-32">
      <h1 className="text-4xl font-bold font-serif">
        {course?.title || 'Welcome to Jazz LMS'}
      </h1>
      <p className="mt-6 text-muted-foreground">
        {course?.description || 'Check back soon for new content!'}
      </p>
      {course ? (
        <Button onClick={handleCheckout}>Inscríbete ahora</Button>
      ) : (
        <p>No courses available yet</p>
      )}
    </div>
  );
};
```

**Why check for null course?**  
The database might be empty or the query might fail. Always handle edge cases!

---

### `benefits.tsx`

**Purpose**: Shows the benefits/features of enrolling in the course.

**Type**: Server Component

**Features**:
- Lists features with icons
- Static content (no interactivity)

**Pattern Used - Data Array**:

```tsx
// Define data as an array of objects
const features = [
  {
    name: 'Acceso de por vida',
    description: 'Lorem ipsum...',
    icon: BookOpen,
  },
  // ... more features
];

// Render with map
export const Benefits = () => {
  return (
    <div>
      {features.map((feature) => (
        <div key={feature.name}>
          <feature.icon className="h-6 w-6" />  {/* Dynamic icon */}
          <dt>{feature.name}</dt>
          <dd>{feature.description}</dd>
        </div>
      ))}
    </div>
  );
};
```

**Why this pattern?**  
It separates data from presentation. Easy to add/remove features without touching the render logic.

---

### `press.tsx`

**Purpose**: Shows press mentions and logos.

**Type**: Server Component

**Structure**: Simple static content showing publication names.

---

## 📐 Layout Components (`/components/layout/`)

These components appear on every page.

### `header.tsx`

**Purpose**: Site header with logo and user navigation.

**Type**: Server Component (can fetch user data)

**Key Code**:

```tsx
import Link from 'next/link';
import { UserNav } from './user-nav';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center">
        <Link href="/" className="font-bold">
          La Cultura del Jazz
        </Link>
        <div className="flex-1" />  {/* Spacer */}
        <UserNav />
      </div>
    </header>
  );
};
```

**CSS Classes Explained**:
- `sticky top-0` - Stays at top when scrolling
- `z-50` - Appears above other content
- `backdrop-blur` - Blurs content behind (glassmorphism effect)
- `bg-background/95` - 95% opacity background

---

### `user-nav.tsx`

**Purpose**: User dropdown menu or login button.

**Type**: Server Component (async - fetches user)

**Features**:
- Shows Login button if not authenticated
- Shows user avatar and dropdown if authenticated
- Dropdown contains user info and logout

**Key Code**:

```tsx
export const UserNav = async () => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Not logged in? Show login button
  if (!user) {
    return (
      <Link href="/auth">
        <Button>Login</Button>
      </Link>
    );
  }

  // Logged in? Show dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarImage src={user.user_metadata.avatar_url} />
          <AvatarFallback>
            {user.email?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>
          <p>{user.user_metadata.full_name}</p>
          <p>{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogoutButton />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

**Why is this a Server Component?**  
It's `async` and fetches user data directly. No client-side state needed.

---

### `logout-button.tsx`

**Purpose**: Button that signs the user out.

**Type**: Client Component (`'use client'`)

**Why Client Component?**  
Uses `onClick` handler and `useRouter` hook.

```tsx
'use client';

export const LogoutButton = () => {
  const router = useRouter();
  const supabase = createClient();  // Browser client

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();  // Refresh to update UI
  };

  return (
    <button onClick={handleLogout}>
      <LogOut className="mr-2 h-4 w-4" />
      Log out
    </button>
  );
};
```

---

## 🧱 UI Components (`/components/ui/`)

These are generic, reusable building blocks from [shadcn/ui](https://ui.shadcn.com/).

### `button.tsx`

**Purpose**: Styled button with variants.

**Features**:
- Multiple variants (default, destructive, outline, ghost)
- Multiple sizes (default, sm, lg, icon)
- Accessible

**Usage**:
```tsx
<Button>Default</Button>
<Button variant="outline">Outline</Button>
<Button size="sm">Small</Button>
```

**How it works**:
Uses `class-variance-authority` (CVA) to manage variant classes:

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md",  // Base classes
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline: "border border-input bg-background",
        // ...
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

---

### `avatar.tsx`

**Purpose**: Displays user profile pictures with fallback.

**Components**:
- `Avatar` - Container
- `AvatarImage` - The actual image
- `AvatarFallback` - Shown while image loads or if it fails

**Usage**:
```tsx
<Avatar>
  <AvatarImage src="/profile.jpg" alt="User" />
  <AvatarFallback>JD</AvatarFallback>  {/* Shows initials */}
</Avatar>
```

---

### `dropdown-menu.tsx`

**Purpose**: Accessible dropdown menu.

**Components**:
- `DropdownMenu` - Root container
- `DropdownMenuTrigger` - Element that opens the menu
- `DropdownMenuContent` - The dropdown panel
- `DropdownMenuItem` - Individual items
- `DropdownMenuLabel` - Non-clickable label
- `DropdownMenuSeparator` - Divider line

**Usage**:
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>Open Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
    <DropdownMenuItem>Logout</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### `separator.tsx`

**Purpose**: Visual divider line.

**Usage**:
```tsx
<Separator />                       {/* Horizontal line */}
<Separator orientation="vertical" /> {/* Vertical line */}
```

---

## Component Patterns Summary

### 1. Server vs Client Components

```tsx
// Server Component (default) - CAN:
// ✅ Fetch data directly from database
// ✅ Access server-only resources
// ❌ Use hooks (useState, useEffect)
// ❌ Add event handlers (onClick)

// Client Component ('use client') - CAN:
// ✅ Use hooks
// ✅ Add interactivity
// ❌ Directly fetch from database
// ✅ Call API routes
```

### 2. Prop Drilling

Data flows down through props:
```
CourseSidebar
  └── course prop
      └── CourseSidebarItem
          └── lessons prop from course.chapters
```

### 3. Conditional Rendering

```tsx
{condition && <Component />}           // Show if true
{condition ? <A /> : <B />}            // Show A or B
{items.map(item => <Item key={item.id} />)}  // Lists
```

### 4. Styling with Tailwind + cn()

```tsx
<div className={cn(
  'base-styles',
  isActive && 'active-styles',
  isDisabled && 'disabled-styles'
)} />
```

---

## Adding New Components

1. Create file in appropriate folder
2. Use naming convention: `component-name.tsx` (kebab-case)
3. Export as named export: `export const ComponentName = ...`
4. Add `'use client'` only if you need hooks or event handlers
5. Type your props with TypeScript interfaces


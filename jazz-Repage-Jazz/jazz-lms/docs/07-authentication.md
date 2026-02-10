# Authentication Documentation

This document explains how authentication works in the Jazz LMS project using Supabase Auth.

---

## Overview

The Jazz LMS uses **Supabase Authentication** to handle user login and signup. This provides:

- Email/password authentication
- OAuth providers (GitHub, Google, etc.)
- Session management
- Secure token handling

---

## Authentication Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION FLOW                                │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. User clicks "Login"                                                │
│         │                                                               │
│         ▼                                                               │
│  2. Redirected to /auth page                                           │
│         │                                                               │
│         ▼                                                               │
│  3. Supabase Auth UI displays login options                            │
│         │                                                               │
│         ├──────────────────────────────────────────────────────┐       │
│         │                                                       │       │
│         ▼                                                       ▼       │
│  4a. Email/Password                              4b. GitHub OAuth       │
│      User enters credentials                         User clicks GitHub │
│         │                                                       │       │
│         │                                                       ▼       │
│         │                                           Redirected to GitHub│
│         │                                           User authorizes     │
│         │                                                       │       │
│         ▼                                                       ▼       │
│  5. Supabase validates credentials                GitHub sends code    │
│         │                                                       │       │
│         │                                                       ▼       │
│         │                                        Redirected to callback │
│         │                                        /auth/callback?code=.. │
│         │                                                       │       │
│         │                                                       ▼       │
│         │                                        Exchange code for      │
│         │                                        session tokens         │
│         │                                                       │       │
│         ├───────────────────────────────────────────────────────┘       │
│         │                                                               │
│         ▼                                                               │
│  6. Session tokens stored in cookies                                   │
│         │                                                               │
│         ▼                                                               │
│  7. Redirected to /dashboard                                           │
│         │                                                               │
│         ▼                                                               │
│  8. Middleware refreshes session on each request                       │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/app/auth/page.tsx` | Login/signup UI |
| `src/app/auth/callback/route.ts` | OAuth callback handler |
| `src/utils/supabase/client.ts` | Browser-side Supabase client |
| `src/utils/supabase/server.ts` | Server-side Supabase client |
| `src/utils/supabase/middleware.ts` | Session refresh middleware |
| `src/middleware.ts` | Next.js middleware configuration |

---

## 1. Auth Page (`/auth`)

**File**: `src/app/auth/page.tsx`

This page uses Supabase's pre-built Auth UI component:

```tsx
'use client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/utils/supabase/client';

export default function AuthPage() {
  const supabase = createClient();  // Browser client
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-lg">
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}  // Pre-built theme
          providers={['github']}              // OAuth providers
        />
      </div>
    </div>
  );
}
```

### What happens when you submit:

1. **Email/Password**: Supabase validates credentials, creates session
2. **GitHub**: Redirects to GitHub → GitHub redirects back to `/auth/callback`

### Customization Options:

```tsx
<Auth
  supabaseClient={supabase}
  appearance={{ 
    theme: ThemeSupa,
    variables: {
      default: {
        colors: {
          brand: '#d4af37',        // Custom brand color
          brandAccent: '#c9a030',
        },
      },
    },
  }}
  providers={['github', 'google']}  // Add more providers
  redirectTo="http://localhost:3000/auth/callback"  // Custom redirect
/>
```

---

## 2. OAuth Callback (`/auth/callback`)

**File**: `src/app/auth/callback/route.ts`

When GitHub (or another OAuth provider) authenticates the user, it redirects back with a `code` parameter. This route exchanges the code for session tokens:

```typescript
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = createClient()
    // Exchange temporary code for permanent session tokens
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to dashboard
  return NextResponse.redirect(`${origin}/dashboard`)
}
```

### What's happening:

1. GitHub redirects to: `/auth/callback?code=abc123xyz`
2. Our route extracts the code
3. Calls `exchangeCodeForSession(code)` - Supabase validates with GitHub
4. Session tokens are automatically stored in cookies
5. User is redirected to `/dashboard`

---

## 3. Supabase Clients

### Why Two Clients?

| Context | Client | Why |
|---------|--------|-----|
| Browser (Client Components) | `client.ts` | Uses browser cookies, works with JavaScript |
| Server (Server Components, API Routes) | `server.ts` | Uses server-side cookies, works with Next.js headers |

### Browser Client (`client.ts`)

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**When to use**: In components with `'use client'` directive

```tsx
'use client';
import { createClient } from '@/utils/supabase/client';

function MyComponent() {
  const supabase = createClient();
  // Use supabase...
}
```

### Server Client (`server.ts`)

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await cookieStore).get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            (await cookieStore).set({ name, value, ...options })
          } catch (_) {
            // Ignored in Server Components (middleware handles it)
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            (await cookieStore).set({ name, value: '', ...options })
          } catch (_) {
            // Ignored in Server Components
          }
        },
      },
    }
  )
}
```

**When to use**: In Server Components and API Routes

```typescript
// Server Component (no 'use client')
import { createClient } from '@/utils/supabase/server';

async function MyServerComponent() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // ...
}
```

---

## 4. Middleware (Session Refresh)

**File**: `src/middleware.ts` + `src/utils/supabase/middleware.ts`

### What is Middleware?

Middleware runs **before every request**. It's perfect for:
- Checking authentication
- Refreshing session tokens
- Redirecting unauthenticated users

### Configuration (`src/middleware.ts`)

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Run on all routes except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### Session Update Logic (`middleware.ts`)

```typescript
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Update both request and response cookies
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          // Clear cookies from both
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // This refreshes the session if needed
  await supabase.auth.getUser()

  return response
}
```

### Why is this needed?

Supabase uses **JWT tokens** that expire. The middleware:
1. Checks if the token is expired or about to expire
2. Automatically refreshes it
3. Updates the cookies with the new token

Without this, users would be logged out when their tokens expire!

---

## 5. Getting the Current User

### In Server Components

```typescript
import { createClient } from '@/utils/supabase/server';

async function MyPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');  // Not logged in
  }

  return <div>Hello, {user.email}</div>;
}
```

### In Client Components

```typescript
'use client';
import { createClient } from '@/utils/supabase/client';

function MyComponent() {
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  return user ? <div>Hello, {user.email}</div> : <div>Not logged in</div>;
}
```

### In API Routes

```typescript
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Proceed with authenticated request...
}
```

---

## 6. Logging Out

```typescript
'use client';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();  // Refresh to update UI
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

**Important**: After signing out, call `router.refresh()` to re-run Server Components and update the UI.

---

## 7. Protecting Routes

### Server Component Protection

```typescript
// src/app/dashboard/page.tsx
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If not logged in, redirect to auth
  if (!user) {
    return redirect('/auth');
  }

  // User is authenticated, render dashboard
  return <div>Welcome to your dashboard!</div>;
}
```

### API Route Protection

```typescript
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Protected logic here...
}
```

---

## 8. User Data

The user object contains useful information:

```typescript
const { data: { user } } = await supabase.auth.getUser();

// Available properties:
user.id                        // Unique user ID
user.email                     // User's email
user.user_metadata.full_name   // Display name (from OAuth)
user.user_metadata.avatar_url  // Profile picture (from OAuth)
user.created_at               // When account was created
```

---

## Setting Up Authentication

### 1. Supabase Dashboard

1. Go to your Supabase project
2. Navigate to **Authentication** → **Providers**
3. Enable desired providers (GitHub, Google, etc.)
4. For OAuth providers, add Client ID and Secret from the provider

### 2. OAuth Redirect URLs

In your OAuth provider settings (e.g., GitHub), add:
- **Development**: `http://localhost:3000/auth/callback`
- **Production**: `https://your-domain.com/auth/callback`

### 3. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Security Considerations

### 1. Use `getUser()` not `getSession()`

```typescript
// ✅ Good - validates with server
const { data: { user } } = await supabase.auth.getUser();

// ❌ Bad - can be spoofed on client
const { data: { session } } = await supabase.auth.getSession();
```

### 2. Always check auth in API routes

```typescript
// Always do this:
if (!user) {
  return new NextResponse('Unauthorized', { status: 401 });
}
```

### 3. Don't expose sensitive data

```typescript
// Only return what's needed
return NextResponse.json({
  id: user.id,
  email: user.email,
  // Don't include: tokens, metadata, etc.
});
```

### 4. Use HTTPS in production

OAuth callbacks require HTTPS. Vercel handles this automatically.

---

## Troubleshooting

### "User is null even after login"
- Check that middleware is running
- Verify cookies are being set
- Check browser dev tools for cookie errors

### "OAuth redirect not working"
- Verify redirect URL in provider settings
- Check that URL matches exactly (including http vs https)

### "Session expired immediately"
- Middleware might not be configured correctly
- Check `matcher` in middleware config

### "PKCE flow error"
- Ensure you're using the SSR package (`@supabase/ssr`)
- Make sure callback route uses `exchangeCodeForSession`


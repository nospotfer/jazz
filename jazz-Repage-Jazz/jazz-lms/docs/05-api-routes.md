# API Routes Documentation

This document explains all the backend API endpoints in the Jazz LMS project, what they do, how they work, and how to use them.

---

## What are API Routes?

In Next.js, **API Routes** are server-side endpoints that handle HTTP requests. They run on the server, not in the browser, which means they can:

- Access environment variables securely (like API keys)
- Connect directly to databases
- Process sensitive data (like payments)
- Receive webhooks from external services

API routes live in the `/app/api/` folder. Each `route.ts` file defines the endpoint.

---

## Overview of All Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/checkout` | POST | Create a Stripe checkout session |
| `/api/courses/[courseId]/lessons/[lessonId]/progress` | PUT | Update lesson completion status |
| `/api/webhooks/stripe` | POST | Receive Stripe payment notifications |

---

## 1. Checkout Endpoint

**File**: `src/app/api/checkout/route.ts`

**URL**: `POST /api/checkout`

**Purpose**: Creates a Stripe checkout session and returns the URL to redirect the user.

### How it works

```
Frontend                          Backend                         Stripe
   │                                │                               │
   │  POST /api/checkout            │                               │
   │  { courseId: "abc123" }        │                               │
   ├───────────────────────────────►│                               │
   │                                │                               │
   │                                │  Verify user is logged in     │
   │                                │  Get course from database     │
   │                                │                               │
   │                                │  Create checkout session      │
   │                                ├──────────────────────────────►│
   │                                │◄──────────────────────────────┤
   │                                │  Session URL returned         │
   │                                │                               │
   │  { url: "https://checkout..."}│                               │
   │◄───────────────────────────────┤                               │
   │                                │                               │
   │  Redirect to Stripe            │                               │
   ├───────────────────────────────────────────────────────────────►│
```

### Code Breakdown

```typescript
// src/app/api/checkout/route.ts

import { createClient } from '@/utils/supabase/server';
import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    // Step 1: Get the current user
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Step 2: Check if user is logged in
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Step 3: Get courseId from request body
    const { courseId } = await req.json();

    if (!courseId) {
      return new NextResponse('Bad Request', { status: 400 });
    }

    // Step 4: Get course from database
    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Step 5: Create line items for Stripe
    const line_items = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: course.title,
          },
          unit_amount: Math.round((course.price || 0) * 100), // Stripe uses cents
        },
        quantity: 1,
      },
    ];

    // Step 6: Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',  // One-time payment (not subscription)
      allow_promotion_codes: true,  // Allow discount codes
      success_url: `${req.headers.get('origin')}/courses/${courseId}?success=true`,
      cancel_url: `${req.headers.get('origin')}/courses/${courseId}?canceled=true`,
      metadata: {
        courseId: course.id,
        userId: user.id,  // Important! Used in webhook to create purchase
      },
    });

    // Step 7: Return session URL
    return NextResponse.json({ url: session.url });
    
  } catch (error) {
    console.log('[CHECKOUT_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
```

### Request/Response

**Request**:
```json
POST /api/checkout
Content-Type: application/json

{
  "courseId": "clxyz123..."
}
```

**Response (Success)**:
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

**Response (Error)**:
- `401 Unauthorized` - User not logged in
- `400 Bad Request` - Missing courseId
- `404 Not Found` - Course doesn't exist
- `500 Internal Server Error` - Something went wrong

### Key Concepts

#### Why `unit_amount` in cents?
Stripe expects amounts in the smallest currency unit. For USD, that's cents:
- $99.99 → 9999 cents
- `Math.round((course.price || 0) * 100)`

#### Why store `userId` and `courseId` in metadata?
When Stripe sends the webhook after payment, we need to know:
- Who paid (userId)
- What they paid for (courseId)

Metadata is passed through the entire checkout flow.

---

## 2. Progress Endpoint

**File**: `src/app/api/courses/[courseId]/lessons/[lessonId]/progress/route.ts`

**URL**: `PUT /api/courses/:courseId/lessons/:lessonId/progress`

**Purpose**: Marks a lesson as completed (or uncompleted) for the current user.

### How it works

```
Frontend                          Backend
   │                                │
   │  PUT /api/.../progress         │
   │  { isCompleted: true }         │
   ├───────────────────────────────►│
   │                                │
   │                                │  1. Verify user is logged in
   │                                │  2. Upsert UserProgress record
   │                                │     (create if doesn't exist,
   │                                │      update if it does)
   │                                │
   │  { id, isCompleted, ... }      │
   │◄───────────────────────────────┤
```

### Code Breakdown

```typescript
// src/app/api/courses/[courseId]/lessons/[lessonId]/progress/route.ts

export async function PUT(
  req: Request,
  { params }: { params: { courseId: string; lessonId: string } }
) {
  try {
    // Step 1: Get current user
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { isCompleted } = await req.json();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Step 2: Upsert (update or insert) progress
    const userProgress = await db.userProgress.upsert({
      where: {
        // Compound unique key
        userId_lessonId: {
          userId: user.id,
          lessonId: params.lessonId,
        },
      },
      update: {
        isCompleted,  // Update existing record
      },
      create: {
        userId: user.id,
        lessonId: params.lessonId,
        isCompleted,  // Create new record
      },
    });

    return NextResponse.json(userProgress);
  } catch (error) {
    console.log('[LESSON_PROGRESS_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
```

### Request/Response

**Request**:
```json
PUT /api/courses/abc123/lessons/xyz789/progress
Content-Type: application/json

{
  "isCompleted": true
}
```

**Response**:
```json
{
  "id": "progress123",
  "userId": "user456",
  "lessonId": "xyz789",
  "isCompleted": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Key Concepts

#### Dynamic Route Parameters
The folder structure `[courseId]` and `[lessonId]` creates dynamic URL segments:
- `/api/courses/abc/lessons/xyz/progress`
- `params.courseId` = "abc"
- `params.lessonId` = "xyz"

#### Upsert Pattern
`upsert` = "update or insert":
- If a record exists with that `userId_lessonId` combo → update it
- If no record exists → create it

This prevents errors when marking a lesson complete for the first time.

---

## 3. Stripe Webhook Endpoint

**File**: `src/app/api/webhooks/stripe/route.ts`

**URL**: `POST /api/webhooks/stripe`

**Purpose**: Receives notifications from Stripe when events happen (like successful payments).

### Why Webhooks?

```
Without webhooks (Bad):
  User pays → Redirect to success page → Hope user doesn't close browser
                                         Hope network doesn't fail
                                         
With webhooks (Good):
  User pays → Stripe notifies YOUR SERVER → Server creates purchase
                                            100% reliable
```

### How it works

```
Stripe                            Backend                       Database
   │                                │                              │
   │  POST /api/webhooks/stripe     │                              │
   │  (signed payload)              │                              │
   ├───────────────────────────────►│                              │
   │                                │                              │
   │                                │  1. Verify signature         │
   │                                │  2. Parse event              │
   │                                │  3. Check event type         │
   │                                │                              │
   │                                │  If checkout.session.completed:
   │                                │  Extract userId & courseId   │
   │                                │  from metadata               │
   │                                │                              │
   │                                │  CREATE Purchase             │
   │                                ├─────────────────────────────►│
   │                                │                              │
   │  200 OK                        │                              │
   │◄───────────────────────────────┤                              │
```

### Code Breakdown

```typescript
// src/app/api/webhooks/stripe/route.ts

export async function POST(req: Request) {
  // Step 1: Get raw body and signature
  const body = await req.text();  // Must be raw text, not JSON
  const signature = (await headers()).get('Stripe-Signature') as string;

  let event: Stripe.Event;

  // Step 2: Verify the webhook is really from Stripe
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!  // Secret from Stripe dashboard
    );
  } catch (error: unknown) {
    // Invalid signature = not from Stripe (could be an attack)
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  // Step 3: Get session data
  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session?.metadata?.userId;
  const courseId = session?.metadata?.courseId;

  // Step 4: Handle the event
  if (event.type === 'checkout.session.completed') {
    if (!userId || !courseId) {
      return new NextResponse('Missing metadata', { status: 400 });
    }

    // Step 5: Create purchase record
    await db.purchase.create({
      data: {
        courseId: courseId,
        userId: userId,
      },
    });
  } else {
    // Unknown event type - just acknowledge it
    return new NextResponse(`Unhandled event type ${event.type}`, { status: 200 });
  }

  // Step 6: Return success
  return new NextResponse(null, { status: 200 });
}
```

### Why Verify the Signature?

Anyone could send a POST request to your webhook URL. Without verification, an attacker could:
1. Send fake "payment completed" events
2. Get free access to courses

The signature proves the request came from Stripe.

### Request/Response

**Request** (from Stripe):
```
POST /api/webhooks/stripe
Stripe-Signature: t=1704120000,v1=abc123...
Content-Type: application/json

{
  "id": "evt_1234",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_1234",
      "metadata": {
        "userId": "user-abc",
        "courseId": "course-xyz"
      }
    }
  }
}
```

**Response**:
- `200 OK` - Event processed successfully
- `400 Bad Request` - Invalid signature or missing data

### Testing Webhooks Locally

Use the Stripe CLI:
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In another terminal, trigger test events
stripe trigger checkout.session.completed
```

---

## HTTP Methods Reference

| Method | Purpose | Body |
|--------|---------|------|
| GET | Retrieve data | No body |
| POST | Create new resource | JSON body |
| PUT | Update existing resource | JSON body |
| DELETE | Remove resource | Usually no body |

---

## Error Handling Pattern

All API routes follow this pattern:

```typescript
export async function POST(req: Request) {
  try {
    // 1. Authenticate
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. Validate input
    if (!requiredField) {
      return new NextResponse('Bad Request', { status: 400 });
    }

    // 3. Check resource exists
    if (!resource) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // 4. Do the thing
    const result = await doSomething();

    // 5. Return success
    return NextResponse.json(result);

  } catch (error) {
    // 6. Log and return error
    console.log('[ENDPOINT_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
```

---

## Security Considerations

### 1. Always Authenticate
Check `user` before doing anything sensitive:
```typescript
if (!user) {
  return new NextResponse('Unauthorized', { status: 401 });
}
```

### 2. Validate Input
Never trust user input:
```typescript
const { courseId } = await req.json();
if (!courseId) {
  return new NextResponse('Bad Request', { status: 400 });
}
```

### 3. Use Environment Variables
Never hardcode secrets:
```typescript
// ❌ Bad
const stripe = new Stripe('sk_live_abc123');

// ✅ Good
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
```

### 4. Verify Webhook Signatures
Always verify webhooks are from who they claim:
```typescript
const event = stripe.webhooks.constructEvent(body, signature, secret);
```

---

## Adding New API Routes

1. Create folder structure matching URL:
   - `/api/users/[userId]/settings` → `/app/api/users/[userId]/settings/route.ts`

2. Export functions for HTTP methods:
   ```typescript
   export async function GET(req: Request) { ... }
   export async function POST(req: Request) { ... }
   export async function PUT(req: Request) { ... }
   export async function DELETE(req: Request) { ... }
   ```

3. Follow the error handling pattern

4. Always authenticate when needed

5. Return appropriate status codes


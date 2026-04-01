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

| Endpoint                                              | Method | Purpose                                          |
| ----------------------------------------------------- | ------ | ------------------------------------------------ |
| `/api/checkout`                                       | POST   | Create a Dodo Payments checkout URL              |
| `/api/contact`                                        | POST   | Send contact form submission as email via Resend |
| `/api/mux/promo-playback`                             | GET    | Return promo playbackId and signed Mux tokens    |
| `/api/courses/[courseId]/lessons/[lessonId]/progress` | PUT    | Update lesson completion status                  |
| `/api/webhooks/dodo-jazzlms`                          | POST   | Receive Dodo Payments payment notifications      |

---

## 1. Checkout Endpoint

**File**: `src/app/api/checkout/route.ts`

**URL**: `POST /api/checkout`

**Purpose**: Creates a Dodo Payments checkout URL and returns it for redirect.

### How it works

```
Frontend                          Backend                  Dodo Payments
   │                                │                               │
   │  POST /api/checkout            │                               │
   │  { courseId: "abc123" }        │                               │
   ├───────────────────────────────►│                               │
   │                                │                               │
   │                                │  Verify user is logged in     │
   │                                │  Get course from database     │
   │                                │                               │
  │                                │  Create checkout URL          │
   │                                ├──────────────────────────────►│
   │                                │◄──────────────────────────────┤
   │                                │  Session URL returned         │
   │                                │                               │
   │  { url: "https://checkout..."}│                               │
   │◄───────────────────────────────┤                               │
   │                                │                               │
  │  Redirect to hosted checkout   │                               │
   ├───────────────────────────────────────────────────────────────►│
```

### Code Breakdown

```typescript
// src/app/api/checkout/route.ts

import { createClient } from "@/utils/supabase/server";
import { createDodoCheckout } from "@/lib/dodo-jazzlms";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    // Step 1: Get the current user
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Step 2: Check if user is logged in
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Step 3: Get courseId from request body
    const { courseId } = await req.json();

    if (!courseId) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    // Step 4: Get course from database
    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Step 5: Create Dodo checkout URL
    const checkoutUrl = await createDodoCheckout({
      productId: process.env.DODO_PRODUCT_ID!,
      email: user.email!,
      returnUrl: `${req.headers.get("origin")}/courses/${courseId}?success=true`,
      metadata: {
        courseId: course.id,
        userId: user.id,
      },
    });

    // Step 6: Return checkout URL
    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.log("[CHECKOUT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
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
  "url": "https://checkout.dodopayments.com/checkout/..."
}
```

**Response (Error)**:

- `401 Unauthorized` - User not logged in
- `400 Bad Request` - Missing courseId
- `404 Not Found` - Course doesn't exist
- `500 Internal Server Error` - Something went wrong

### Key Concepts

#### Why return a hosted checkout URL?

The backend keeps credentials secure and the frontend only receives a safe redirect URL.

#### Admin checkout testing behavior

When an authenticated admin user already has a purchase record for the same course, the checkout route allows the flow to continue (admin bypass) instead of returning `already purchased`. This is intended to support payment-flow testing from admin accounts.

#### Why store `userId` and `courseId` in metadata?

When Dodo sends the webhook after payment, we need to know:

- Who paid (userId)
- What they paid for (courseId)

Metadata is passed through the entire checkout flow.

---

## 1.1 Promo Mux Playback Endpoint

**File**: `src/app/api/mux/promo-playback/route.ts`

**URL**: `GET /api/mux/promo-playback`

**Purpose**: Returns the promo `playbackId` and signed tokens required by Mux Player.

### Security and Consistency Validation

The route validates generated JWT payloads before returning them:

- `playbackToken` must have `aud: "v"` and `sub` equal to the promo playbackId.
- `thumbnailToken` must have `aud: "t"` and matching `sub`.
- `storyboardToken` must have `aud: "s"` and matching `sub`.

If validation fails (for example, signing key mismatch during rotation), the route logs the error and returns fallback payload with `tokenMode: "none"`.

### Response Modes

**Signed mode**:

```json
{
  "playbackId": "...",
  "tokenMode": "signed",
  "playbackToken": "...",
  "thumbnailToken": "...",
  "storyboardToken": "...",
  "expiresAt": 1712345678
}
```

**Fallback mode**:

```json
{
  "playbackId": "...",
  "playbackToken": "",
  "thumbnailToken": "",
  "storyboardToken": "",
  "tokenMode": "none"
}
```

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
  { params }: { params: { courseId: string; lessonId: string } },
) {
  try {
    // Step 1: Get current user
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { isCompleted } = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
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
        isCompleted, // Update existing record
      },
      create: {
        userId: user.id,
        lessonId: params.lessonId,
        isCompleted, // Create new record
      },
    });

    return NextResponse.json(userProgress);
  } catch (error) {
    console.log("[LESSON_PROGRESS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
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

## 3. Dodo Payments Webhook Endpoint

**File**: `src/app/api/webhooks/dodo-jazzlms/route.ts`

**URL**: `POST /api/webhooks/dodo-jazzlms`

**Purpose**: Receives notifications from Dodo Payments when events happen (like paid/refunded orders).

### Why Webhooks?

```
Without webhooks (Bad):
  User pays → Redirect to success page → Hope user doesn't close browser
                                         Hope network doesn't fail

With webhooks (Good):
  User pays → Dodo Payments notifies YOUR SERVER → Server creates purchase
                                                    100% reliable
```

### How it works

```
Dodo Payments                     Backend                       Database
   │                                │                              │
  │  POST /api/webhooks/dodo-jazzlms│                            │
   │  (signed payload)              │                              │
   ├───────────────────────────────►│                              │
   │                                │                              │
   │                                │  1. Verify signature         │
   │                                │  2. Parse event              │
   │                                │  3. Check event type         │
   │                                │                              │
  │                                │  If order_created:
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
// src/app/api/webhooks/dodo-jazzlms/route.ts

export async function POST(req: Request) {
  // Step 1: Get raw body and signature
  const body = await req.text(); // Must be raw text, not JSON
  const signature = (await headers()).get("x-signature") as string;

  let payload: Record<string, unknown>;

  // Step 2: Verify the webhook is really from Dodo Payments
  try {
    payload = JSON.parse(body);
  } catch (error: unknown) {
    // Invalid signature = not from provider (could be an attack)
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  // Step 3: Get session data
  const eventName = (payload.meta as any)?.event_name;
  const userId = (payload.meta as any)?.custom_data?.userId;
  const courseId = (payload.meta as any)?.custom_data?.courseId;

  // Step 4: Handle the event
  if (eventName === "order_created") {
    if (!userId || !courseId) {
      return new NextResponse("Missing metadata", { status: 400 });
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
    return new NextResponse(`Unhandled event type ${event.type}`, {
      status: 200,
    });
  }

  // Step 6: Return success
  return new NextResponse(null, { status: 200 });
}
```

### Why Verify the Signature?

Anyone could send a POST request to your webhook URL. Without verification, an attacker could:

1. Send fake "payment completed" events
2. Get free access to courses

The signature proves the request came from Dodo Payments.

### Request/Response

**Request** (from Dodo Payments):

```
POST /api/webhooks/dodo-jazzlms
x-signature: abc123...
Content-Type: application/json

{
  "id": "evt_1234",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "order_1234",
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

Use your local webhook forwarding setup:

```bash
# See docs/10-dodo-local-setup.md
# Forward events to /api/webhooks/dodo-jazzlms
```

---

## HTTP Methods Reference

| Method | Purpose                  | Body            |
| ------ | ------------------------ | --------------- |
| GET    | Retrieve data            | No body         |
| POST   | Create new resource      | JSON body       |
| PUT    | Update existing resource | JSON body       |
| DELETE | Remove resource          | Usually no body |

---

## Error Handling Pattern

All API routes follow this pattern:

```typescript
export async function POST(req: Request) {
  try {
    // 1. Authenticate
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Validate input
    if (!requiredField) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    // 3. Check resource exists
    if (!resource) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // 4. Do the thing
    const result = await doSomething();

    // 5. Return success
    return NextResponse.json(result);
  } catch (error) {
    // 6. Log and return error
    console.log("[ENDPOINT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
```

---

## Security Considerations

### 1. Always Authenticate

Check `user` before doing anything sensitive:

```typescript
if (!user) {
  return new NextResponse("Unauthorized", { status: 401 });
}
```

### 2. Validate Input

Never trust user input:

```typescript
const { courseId } = await req.json();
if (!courseId) {
  return new NextResponse("Bad Request", { status: 400 });
}
```

### 3. Use Environment Variables

Never hardcode secrets:

```typescript
// ❌ Bad
const apiKey = "YOUR_DODO_PAYMENTS_API_KEY";

// ✅ Good
const apiKey = process.env.DODO_PAYMENTS_API_KEY!;
```

### 4. Verify Webhook Signatures

Always verify webhooks are from who they claim:

```typescript
const isValid = verifyDodoSignature(body, signature);
```

---

## 3. Contact Form Endpoint

**File**: `src/app/api/contact/route.ts`

**URL**: `POST /api/contact`

**Purpose**: Sends contact form submissions as emails to the support team via Resend.

### How it works

```
Frontend (Home Page)          API Handler              Resend              Email
   │                              │                      │                │
   │  User fills contact form      │                      │                │
   │  Clicks "Enviar mensaje"      │                      │                │
   │                              │                      │                │
   │  POST /api/contact            │                      │                │
   │  { messageType, message,      │                      │                │
   │    email }                    │                      │                │
   ├──────────────────────────────►│                      │                │
   │                              │                      │                │
   │                              │ Validate input       │                │
   │                              │ Format HTML email    │                │
   │                              │                      │                │
   │                              │ Send via Resend      │                │
   │                              ├─────────────────────►│                │
   │                              │                      │ Send to admin   │
   │                              │                      ├───────────────►│
   │                              │◄─────────────────────┤                │
   │                              │ Email ID returned    │                │
   │                              │                      │                │
   │  { success: true }            │                      │                │
   │◄──────────────────────────────┤                      │                │
   │                              │                      │                │
   │ Show success message          │                      │                │
   │ Close modal after 2s          │                      │                │
```

### Code Breakdown

```typescript
// src/app/api/contact/route.ts

import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    // Step 1: Parse and validate request
    const body = await request.json();

    if (!body.messageType || !body.message || !body.email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Step 2: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Step 3: Validate message length
    if (body.message.length > 1000) {
      return NextResponse.json(
        { error: "Message exceeds maximum length" },
        { status: 400 },
      );
    }

    // Step 4: Get Resend API key
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("[contact] RESEND_API_KEY not configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 },
      );
    }

    // Step 5: Create Resend client and send email
    const resend = new Resend(apiKey);
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "admin@neurofactory.net",
      subject: `Nuevo mensaje de contacto de ${body.email}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Nuevo mensaje de contacto</h2>
          <p><strong>Tipo:</strong> ${body.messageType}</p>
          <p><strong>Email:</strong> ${body.email}</p>
          <hr>
          <p><strong>Mensaje:</strong></p>
          <p>${body.message}</p>
        </div>
      `,
      replyTo: body.email,
    });

    // Step 6: Return response
    if (response.error) {
      throw response.error;
    }

    return NextResponse.json(
      { success: true, messageId: response.data?.id },
      { status: 200 },
    );
  } catch (error) {
    console.error("[contact] Error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
```

### Request/Response

**Request**:

```json
POST /api/contact
Content-Type: application/json

{
  "messageType": "question",
  "message": "Tengo una pregunta sobre el curso...",
  "email": "usuario@email.com"
}
```

**Response (Success)**:

```json
{
  "success": true,
  "messageId": "abc123..."
}
```

**Response (Error)**:

- `400 Bad Request` - Invalid email format or missing fields
- `500 Internal Server Error` - Resend API key not configured or email send failed

### Key Features

- ✅ Multilingual support (es, en, fr, pt) - text handled by frontend
- ✅ Validates email format and message length
- ✅ Reply-to set to user email for easy response
- ✅ Detailed error logging for debugging
- ✅ HTML formatted emails for better readability

### Environment Variables Required

```env
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_SUPPORT_EMAIL=admin@neurofactory.net
```

---

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

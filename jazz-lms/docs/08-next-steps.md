# Next Steps, TODOs & Things to Be Careful With

This document outlines potential improvements, future features, and important considerations when working with the Jazz LMS project.

---

## 🚀 Possible Next Steps

### High Priority

#### 1. Add Course Access Verification
Currently, the lesson page doesn't verify if the user has purchased the course.

**Current State**:
```typescript
// src/app/courses/[courseId]/lessons/[lessonId]/page.tsx
// Only checks if user is logged in, not if they purchased the course!
if (!user) {
  return redirect('/auth');
}
```

**Recommended Fix**:
```typescript
// Check for purchase
const purchase = await db.purchase.findUnique({
  where: {
    userId_courseId: {
      userId: user.id,
      courseId: params.courseId,
    },
  },
});

if (!purchase) {
  return redirect('/');  // or show "Purchase required" page
}
```

#### 2. Add Email Confirmation Flow
For email/password signups, users should confirm their email.

**Steps**:
1. Enable email confirmation in Supabase dashboard
2. Create a confirmation page at `/auth/confirm`
3. Handle the confirmation token

#### 3. Implement Confetti Animation
The confetti store exists but the animation isn't rendered anywhere!

**Add to layout or course player**:
```tsx
import Confetti from 'react-confetti';
import { useConfettiStore } from '@/hooks/use-confetti-store';

function ConfettiProvider() {
  const { isOpen, onClose } = useConfettiStore();
  
  if (!isOpen) return null;
  
  return (
    <Confetti
      recycle={false}
      numberOfPieces={500}
      onConfettiComplete={onClose}
    />
  );
}
```

#### 4. Add Loading States
Add loading indicators for better UX:

```tsx
// Example for checkout button
const [isLoading, setIsLoading] = useState(false);

const handleCheckout = async () => {
  setIsLoading(true);
  try {
    // ... checkout logic
  } finally {
    setIsLoading(false);
  }
};

<Button disabled={isLoading}>
  {isLoading ? 'Processing...' : 'Enroll Now'}
</Button>
```

---

### Medium Priority

#### 5. Add Progress Display in Sidebar
Show completion status in the course sidebar:

```tsx
// Fetch user progress
const progress = await db.userProgress.findMany({
  where: { userId: user.id, lessonId: { in: lessonIds } }
});

// In sidebar item, show checkmark for completed lessons
{lesson.isCompleted && <CheckCircle className="text-green-500" />}
```

#### 6. Add Course Catalog Page
Create a `/courses` page to display all available courses:

```tsx
// src/app/courses/page.tsx
export default async function CoursesPage() {
  const courses = await db.course.findMany({
    where: { isPublished: true },
    include: { chapters: { include: { lessons: true } } }
  });
  
  return (
    <div className="grid gap-4">
      {courses.map(course => <CourseCard key={course.id} course={course} />)}
    </div>
  );
}
```

#### 7. Add Search and Filtering
Allow users to search courses and filter by category.

#### 8. Implement Video Progress Tracking
Track where users left off in videos:

```typescript
// Save progress periodically
const onTimeUpdate = (currentTime: number) => {
  // Save to database or localStorage
};

<MuxPlayer onTimeUpdate={onTimeUpdate} />
```

#### 9. Add Admin Dashboard
Create an admin panel to manage courses, chapters, and lessons without touching the database directly.

**Suggested routes**:
- `/admin/courses` - List and manage courses
- `/admin/courses/[courseId]` - Edit course details
- `/admin/courses/[courseId]/chapters` - Manage chapters
- `/admin/analytics` - View sales and engagement metrics

---

### Low Priority (Nice to Have)

#### 10. Add Course Reviews/Ratings
Let students leave reviews after completing a course.

#### 11. Add Certificates
Generate PDF certificates when a user completes a course.

#### 12. Add Multiple Payment Options
Support PayPal, Apple Pay, or local payment methods.

#### 13. Add Coupons/Discounts
Beyond Stripe's promotion codes, implement custom discount logic.

#### 14. Add Notifications
Email notifications for:
- Purchase confirmation
- Course completion
- New lessons added

#### 15. Add Mobile App
Consider React Native or a PWA for mobile users.

---

## ⚠️ Things to Be Careful With

### Security

#### 1. Always Verify Purchases Server-Side
**Never** trust client-side checks. Always verify on the server:

```typescript
// ❌ Bad - client can manipulate
if (hasPurchased) {
  showVideo();
}

// ✅ Good - server verification
const purchase = await db.purchase.findUnique({ ... });
if (!purchase) {
  return new NextResponse('Forbidden', { status: 403 });
}
```

#### 2. Protect Video URLs
Mux playback IDs are technically public. For sensitive content, consider:
- Signed URLs (Mux feature)
- Token-based authentication
- Domain restrictions

#### 3. Validate Stripe Webhook Signatures
Always verify webhooks come from Stripe:

```typescript
// Always do this!
const event = stripe.webhooks.constructEvent(body, signature, secret);
```

#### 4. Rate Limit API Routes
Prevent abuse by adding rate limiting:

```typescript
// Consider using @upstash/ratelimit or similar
import { Ratelimit } from '@upstash/ratelimit';
```

#### 5. Sanitize User Input
Even though Prisma helps prevent SQL injection, always validate input:

```typescript
import { z } from 'zod';

const schema = z.object({
  courseId: z.string().uuid(),
});

const { courseId } = schema.parse(await req.json());
```

---

### Performance

#### 1. Avoid N+1 Queries
Use `include` instead of multiple queries:

```typescript
// ❌ Bad - N+1 problem
const courses = await db.course.findMany();
for (const course of courses) {
  const chapters = await db.chapter.findMany({ where: { courseId: course.id } });
}

// ✅ Good - single query with include
const courses = await db.course.findMany({
  include: { chapters: true }
});
```

#### 2. Use Caching for Static Data
Course content doesn't change often. Consider caching:

```typescript
// Next.js fetch caching
const data = await fetch(url, { next: { revalidate: 3600 } });

// Or use React cache
import { cache } from 'react';
const getCourse = cache(async (id) => { ... });
```

#### 3. Optimize Images
Use Next.js Image component for automatic optimization:

```tsx
import Image from 'next/image';

<Image src={course.imageUrl} width={400} height={300} alt={course.title} />
```

#### 4. Lazy Load Heavy Components
Don't load the video player until needed:

```tsx
import dynamic from 'next/dynamic';

const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), {
  loading: () => <div>Loading player...</div>,
  ssr: false,
});
```

---

### Database

#### 1. Back Up Your Database
Set up regular backups in Supabase dashboard.

#### 2. Use Migrations in Production
Don't use `db push` in production. Use migrations:

```bash
# Development
npx prisma db push

# Production
npx prisma migrate deploy
```

#### 3. Monitor Database Connections
The singleton pattern in `db.ts` helps, but monitor for connection leaks.

#### 4. Index Frequently Queried Fields
Add indexes for fields you query often:

```prisma
model Purchase {
  @@index([userId])  // If you often query by userId
}
```

---

### Stripe

#### 1. Test with Test Mode First
Always use Stripe test mode during development:
- Test card: `4242 4242 4242 4242`
- Any future expiry date
- Any CVC

#### 2. Handle Webhook Failures
Stripe retries failed webhooks. Make your handler idempotent:

```typescript
// Check if purchase already exists
const existingPurchase = await db.purchase.findUnique({
  where: { userId_courseId: { userId, courseId } }
});

if (existingPurchase) {
  return new NextResponse(null, { status: 200 });  // Already processed
}
```

#### 3. Set Up Webhook Endpoint in Production
Don't forget to configure the webhook URL in Stripe dashboard for production.

---

### Environment Variables

#### 1. Never Commit `.env` Files
Ensure `.env` is in `.gitignore`.

#### 2. Use Different Keys for Production
Development and production should use different:
- Supabase projects
- Stripe accounts (test vs live)
- Database instances

#### 3. Validate Environment Variables
Add validation at startup:

```typescript
// lib/env.ts
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}
```

---

## 📋 Development Checklist

### Before Going Live

- [ ] Verify all environment variables are set in Vercel
- [ ] Set up Stripe webhook for production URL
- [ ] Configure OAuth redirect URLs for production domain
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Test complete purchase flow with Stripe test mode
- [ ] Seed production database with real course content
- [ ] Update Mux video IDs in database
- [ ] Remove placeholder content (Lorem ipsum, etc.)
- [ ] Test on mobile devices
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Set up analytics (Vercel Analytics, Google Analytics)
- [ ] Review and test all authentication flows
- [ ] Check for console errors in browser
- [ ] Verify emails are being sent (Supabase email templates)

### Ongoing Maintenance

- [ ] Monitor error logs
- [ ] Check Stripe dashboard for failed payments
- [ ] Back up database regularly
- [ ] Keep dependencies updated
- [ ] Monitor for security advisories
- [ ] Review user feedback

---

## 🐛 Known Issues & Limitations

### Current Limitations

1. **Single Course Focus**: The current UI is optimized for a single course. Multiple courses would need UI updates.

2. **No Video Upload**: Videos must be uploaded to Mux separately and IDs added to the database manually.

3. **No Refund Handling**: Stripe refunds aren't automatically reflected in the database.

4. **No Subscription Support**: Only one-time payments are implemented.

5. **No Offline Support**: Videos can't be downloaded for offline viewing.

### Potential Issues

1. **Middleware on Edge**: If using Edge runtime, some features might not work.

2. **Large Course Data**: Very large courses might cause slow page loads. Consider pagination.

3. **Concurrent Sessions**: Same user on multiple devices might have session issues.

---

## 📚 Learning Resources

### Technologies Used

- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **Prisma**: [prisma.io/docs](https://www.prisma.io/docs)
- **Stripe**: [stripe.com/docs](https://stripe.com/docs)
- **Mux**: [docs.mux.com](https://docs.mux.com)
- **Tailwind CSS**: [tailwindcss.com/docs](https://tailwindcss.com/docs)

### Recommended Tutorials

- [Next.js App Router Tutorial](https://nextjs.org/learn)
- [Supabase Auth Tutorial](https://supabase.com/docs/guides/auth)
- [Stripe Checkout Integration](https://stripe.com/docs/checkout/quickstart)

---

## 📞 Getting Help

1. Check the documentation files in this `/docs` folder
2. Review the README.md for setup instructions
3. Check existing code for patterns to follow
4. Search the issues on the respective library's GitHub
5. Ask in the community Discord/forums for each technology

Remember: When in doubt, read the code! The best documentation is often the code itself.


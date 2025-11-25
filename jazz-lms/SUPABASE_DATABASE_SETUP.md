# Supabase Database Setup Guide

## Overview
Since Prisma migrations can't connect from your local machine to Supabase, you need to create the database tables manually using the Supabase SQL Editor.

---

## Step-by-Step Instructions

### 1. Access Supabase SQL Editor

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New query"**

### 2. Run the Migration SQL

1. Open the file `supabase-migration.sql` in this project
2. Copy ALL the SQL code from that file
3. Paste it into the Supabase SQL Editor
4. Click **"Run"** (or press Ctrl+Enter / Cmd+Enter)

The SQL will create:
- ✅ 6 tables: Course, Chapter, Lesson, Attachment, Purchase, UserProgress
- ✅ All foreign key relationships
- ✅ All indexes for performance
- ✅ Triggers to auto-update `updatedAt` timestamps
- ✅ UUID extension for generating IDs

### 3. Verify Tables Were Created

After running the SQL, you should see a result at the bottom showing all 6 tables:

```
tablename       | schemaname
----------------|------------
Attachment      | public
Chapter         | public
Course          | public
Lesson          | public
Purchase        | public
UserProgress    | public
```

You can also check:
1. Click on **"Table Editor"** in the left sidebar
2. You should see all 6 tables listed

---

## Alternative: Use Supabase CLI (Optional)

If you have Supabase CLI installed locally, you can also run:

```bash
cd /home/gabriel/git/jazz/jazz-lms
supabase db push
```

But the SQL Editor method is simpler and doesn't require CLI setup.

---

## What About Prisma Migrations?

The challenge with Prisma migrations and Supabase:
- Supabase databases might have network restrictions
- Connection pooling (port 6543) doesn't support migrations
- Direct connection (port 5432) might be blocked from your location

### Solution: Use the SQL file
The `supabase-migration.sql` file I created is essentially what Prisma would generate, but you run it directly in Supabase.

---

## After Creating Tables

### Option 1: Seed Some Sample Data (Recommended for Testing)

Create a new query in Supabase SQL Editor and run:

```sql
-- Insert a sample course
INSERT INTO "Course" ("id", "title", "description", "imageUrl", "price", "isPublished")
VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'Introduction to Jazz Music', 'Learn the fundamentals of jazz music theory and history', 'https://images.unsplash.com/photo-1511192336575-5a79af67a629', 49.99, true);

-- Insert a chapter
INSERT INTO "Chapter" ("id", "title", "description", "position", "isPublished", "courseId")
VALUES 
    ('550e8400-e29b-41d4-a716-446655440002', 'Chapter 1: Basics', 'Introduction to jazz basics', 1, true, '550e8400-e29b-41d4-a716-446655440001');

-- Insert a lesson
INSERT INTO "Lesson" ("id", "title", "description", "videoUrl", "position", "isPublished", "chapterId")
VALUES 
    ('550e8400-e29b-41d4-a716-446655440003', 'What is Jazz?', 'An introduction to jazz music', 'your-mux-video-id-here', 1, true, '550e8400-e29b-41d4-a716-446655440002');
```

### Option 2: Use the Seed Script (After Fixing Connection)

Once you can connect from your machine, you can run:
```bash
npm run seed
```

---

## Troubleshooting

### If tables already exist:
The SQL uses `IF NOT EXISTS` so it won't error if you run it multiple times.

### If you need to reset the database:
Run this in Supabase SQL Editor to drop all tables:

```sql
DROP TABLE IF EXISTS "UserProgress" CASCADE;
DROP TABLE IF EXISTS "Purchase" CASCADE;
DROP TABLE IF EXISTS "Attachment" CASCADE;
DROP TABLE IF EXISTS "Lesson" CASCADE;
DROP TABLE IF EXISTS "Chapter" CASCADE;
DROP TABLE IF EXISTS "Course" CASCADE;
```

Then run the `supabase-migration.sql` again.

### Connection Issues from Local Machine:
If you still can't connect from your local machine:
1. Check if your IP is allowed in Supabase settings (Database → Settings → Connection Pooling)
2. Some networks/ISPs block port 5432
3. Try using a VPN or different network

---

## Next Steps

After creating the tables:
1. ✅ Tables are created in Supabase
2. ✅ You can deploy to Vercel (make sure environment variables are set!)
3. ✅ Your application should work on Vercel
4. ⚠️ For local development, you may need to adjust network settings or use Supabase's connection pooling

---

## Important Notes

- **Do this BEFORE deploying to Vercel** - Vercel needs the tables to exist
- **The SQL file is version controlled** - It's safe to commit
- **This is a one-time setup** - You don't need to run it again unless you reset the database
- **For schema changes in the future** - You can generate SQL from Prisma or write it manually

---

**Ready? Open Supabase SQL Editor and run the migration!** 🚀


# Jazz LMS Documentation

Welcome to the Jazz LMS documentation! This guide is designed for junior developers who are just starting to learn web development. It explains the project from a bird's eye view, breaking down each technology and component into digestible pieces.

---

## 📖 Documentation Index

| Document | Description |
|----------|-------------|
| [01. Overview](./01-overview.md) | What the project is, what it does, and how it all fits together |
| [02. Technologies](./02-technologies.md) | Deep dive into each technology: Next.js, Supabase, Prisma, Mux, Stripe, Vercel |
| [03. Project Structure](./03-project-structure.md) | How the folders and files are organized |
| [04. Components](./04-components.md) | All UI components explained with code examples |
| [05. API Routes](./05-api-routes.md) | Backend endpoints: checkout, progress, webhooks |
| [06. Database](./06-database.md) | Database schema, models, and Prisma queries |
| [07. Authentication](./07-authentication.md) | How login/signup works with Supabase |
| [08. Next Steps & TODOs](./08-next-steps.md) | Future improvements and things to watch out for |

---

## 🚀 Quick Start

### For Reading
Start with [01. Overview](./01-overview.md) to understand the big picture, then explore other documents based on what you're working on.

### For Development
1. Read the [README.md](../README.md) for setup instructions
2. Check [03. Project Structure](./03-project-structure.md) to know where files go
3. Reference specific docs as needed

---

## 🎯 Document Purposes

| If you want to... | Read... |
|-------------------|---------|
| Understand the project | [01. Overview](./01-overview.md) |
| Learn about a technology | [02. Technologies](./02-technologies.md) |
| Find where to put code | [03. Project Structure](./03-project-structure.md) |
| Create a new component | [04. Components](./04-components.md) |
| Create a new API endpoint | [05. API Routes](./05-api-routes.md) |
| Work with the database | [06. Database](./06-database.md) |
| Fix auth issues | [07. Authentication](./07-authentication.md) |
| Plan new features | [08. Next Steps & TODOs](./08-next-steps.md) |

---

## 📝 Glossary

| Term | Definition |
|------|------------|
| **API** | Application Programming Interface - how programs talk to each other |
| **Client Component** | React component that runs in the browser (has `'use client'`) |
| **Server Component** | React component that runs on the server (default in Next.js) |
| **ORM** | Object-Relational Mapper - lets you use code instead of SQL |
| **OAuth** | Open Authorization - login with Google, GitHub, etc. |
| **Webhook** | A URL that receives notifications from external services |
| **JWT** | JSON Web Token - a secure way to store session data |
| **CDN** | Content Delivery Network - delivers content from servers near users |
| **SSR** | Server-Side Rendering - generating HTML on the server |
| **Middleware** | Code that runs before a request is handled |

---

## 🔧 Common Tasks Quick Reference

### Start Development Server
```bash
npm run dev
```

### Seed Database
```bash
npm run seed
```

### Update Database Schema
```bash
npx prisma db push
npx prisma generate
```

### Open Database GUI
```bash
npx prisma studio
```

### Test Stripe Webhooks Locally
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## 📁 Key Files Quick Reference

| Task | File |
|------|------|
| Main layout | `src/app/layout.tsx` |
| Homepage | `src/app/page.tsx` |
| Database schema | `prisma/schema.prisma` |
| Database client | `src/lib/db.ts` |
| Auth page | `src/app/auth/page.tsx` |
| Checkout API | `src/app/api/checkout/route.ts` |
| Stripe webhook | `src/app/api/webhooks/stripe/route.ts` |
| Environment variables | `.env` (not in git) |

---

Happy coding! 🎵🎷


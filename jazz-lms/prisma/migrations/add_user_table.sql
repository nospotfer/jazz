-- CreateEnum for UserRole (SQLite doesn't support enums, so we'll use CHECK constraint)
-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_role_check" CHECK ("role" IN ('USER', 'ADMIN'))
);

-- Create unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- Opcional: Criar o primeiro usuário admin (substitua o email abaixo pelo seu)
-- INSERT INTO "User" ("id", "email", "role", "updatedAt") 
-- VALUES ('admin-id', 'seu-email@exemplo.com', 'ADMIN', CURRENT_TIMESTAMP)
-- ON CONFLICT("email") DO UPDATE SET "role" = 'ADMIN';

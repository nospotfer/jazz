import { db } from '@/lib/db';

export async function ensureMessagingTables() {
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS MessageThread (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      studentEmail TEXT NOT NULL,
      studentName TEXT,
      subject TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS Message (
      id TEXT PRIMARY KEY,
      threadId TEXT NOT NULL,
      senderId TEXT NOT NULL,
      senderEmail TEXT NOT NULL,
      senderName TEXT,
      senderRole TEXT NOT NULL,
      body TEXT NOT NULL,
      unreadByStudent INTEGER NOT NULL DEFAULT 0,
      unreadByProfessor INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (threadId) REFERENCES MessageThread(id) ON DELETE CASCADE
    )
  `);

  await db.$executeRawUnsafe(
    'ALTER TABLE Message ADD COLUMN unreadByStudent INTEGER NOT NULL DEFAULT 0'
  ).catch(() => undefined);

  await db.$executeRawUnsafe(
    'ALTER TABLE Message ADD COLUMN unreadByProfessor INTEGER NOT NULL DEFAULT 0'
  ).catch(() => undefined);

  await db.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS idx_message_thread_studentId ON MessageThread(studentId)'
  );
  await db.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS idx_message_thread_updatedAt ON MessageThread(updatedAt)'
  );
  await db.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS idx_message_threadId_createdAt ON Message(threadId, createdAt)'
  );
}

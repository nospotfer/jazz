-- Explicit PostgreSQL setup for the existing messaging schema.
-- Review before applying. Production application requires user approval.
-- Existing unquoted tables/columns are lowercase; do not rename or recreate them.
BEGIN;

CREATE TABLE IF NOT EXISTS messagethread (
  id TEXT PRIMARY KEY,
  studentid TEXT NOT NULL,
  studentemail TEXT NOT NULL,
  studentname TEXT,
  subject TEXT NOT NULL,
  createdat TEXT NOT NULL,
  updatedat TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS message (
  id TEXT PRIMARY KEY,
  threadid TEXT NOT NULL REFERENCES messagethread(id) ON DELETE CASCADE,
  senderid TEXT NOT NULL,
  senderemail TEXT NOT NULL,
  sendername TEXT,
  senderrole TEXT NOT NULL,
  body TEXT NOT NULL,
  unreadbystudent INTEGER NOT NULL DEFAULT 0,
  unreadbyprofessor INTEGER NOT NULL DEFAULT 0,
  createdat TEXT NOT NULL
);

ALTER TABLE message ADD COLUMN IF NOT EXISTS unreadbystudent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE message ADD COLUMN IF NOT EXISTS unreadbyprofessor INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_message_thread_studentid ON messagethread(studentid);
CREATE INDEX IF NOT EXISTS idx_message_thread_updatedat ON messagethread(updatedat);
CREATE INDEX IF NOT EXISTS idx_message_threadid_createdat ON message(threadid, createdat);

COMMIT;

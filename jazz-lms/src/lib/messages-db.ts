import { db } from '@/lib/db';

export async function ensureMessagingTables() {
  // The legacy unquoted PostgreSQL identifiers are lowercase. Runtime requests
  // validate that schema, while explicit setup SQL handles approved DDL.
  try {
    await db.$queryRawUnsafe(`
      SELECT id, studentid, studentemail, studentname, subject, createdat, updatedat
      FROM messagethread LIMIT 0
    `);
    await db.$queryRawUnsafe(`
      SELECT id, threadid, senderid, senderemail, sendername, senderrole, body,
             unreadbystudent, unreadbyprofessor, createdat
      FROM message LIMIT 0
    `);
  } catch (cause) {
    const error = new Error('Messaging temporarily unavailable', { cause });
    error.name = 'MessagingSchemaUnavailableError';
    throw error;
  }
}

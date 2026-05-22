import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
const envText = fs.readFileSync('.env.local', 'utf8');
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}
const db = new PrismaClient();
(async () => {
  const rows = await db.attachment.findMany({ select: { name: true, url: true } });
  const unique = [...new Set(rows.map(r => r.name))].sort();
  for (const n of unique) console.log(n);
  await db.$disconnect();
})();

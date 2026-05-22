// Diagnostic: dump all bucket filenames and all DB attachment names
import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

try {
  const content = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
} catch {}

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET!;

async function main() {
  // bucket
  const { data } = await supabase.storage
    .from(BUCKET)
    .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });

  console.log("=== BUCKET FILES ===");
  for (const obj of data ?? []) console.log(obj.name);

  console.log("\n=== DB ATTACHMENTS ===");
  const attachments = await prisma.attachment.findMany({
    select: {
      id: true,
      name: true,
      url: true,
      language: true,
      kind: true,
      documentKey: true,
      lessonId: true,
    },
    orderBy: [{ language: "asc" }, { name: "asc" }],
  });
  for (const a of attachments) {
    console.log(
      `${a.language}\t${a.kind}\t${a.documentKey}\t${a.name}\tlesson=${a.lessonId}`,
    );
  }
}

main().finally(() => prisma.$disconnect());

// Remap DB attachments to the new bucket filenames after bulk upload.
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
const APPLY = process.argv.includes("--apply");

type Lang = "es" | "en" | "fr" | "pt";
type Kind = "CLASS" | "AUXILIARY";
type Key = `${Lang}|${Kind}|${number}`;

function toAttachmentDisplayName(bucketFile: string) {
  return bucketFile.replace(/(?:\.docx)?\.pdf$/i, "");
}

// Determine language + class number from a bucket filename.
function classifyBucketName(
  name: string,
): { lang: Lang; kind: Kind; num: number } | null {
  // Try CLASS prefixes (each language)
  const classPatterns: { re: RegExp; lang: Lang }[] = [
    { re: /^Clase\s+(\d+)[_\s-]/i, lang: "es" },
    { re: /^Lesson\s+(\d+)[_\s-]/i, lang: "en" },
    { re: /^Class\s+(\d+)[_\s-]/i, lang: "en" },
    { re: /^Lecon\s+(\d+)[_\s-]/i, lang: "fr" },
    { re: /^Leçon\s+(\d+)[_\s-]/i, lang: "fr" },
    { re: /^Cours\s+(\d+)[_\s-]/i, lang: "fr" },
    { re: /^Aula\s+(\d+)[_\s-]/i, lang: "pt" },
  ];
  for (const { re, lang } of classPatterns) {
    const m = name.match(re);
    if (m) return { lang, kind: "CLASS", num: Number(m[1]) };
  }

  // AUX prefixes
  const auxPatterns: { re: RegExp; lang: Lang }[] = [
    { re: /^Apuntes\s+Auxiliares\s+(\d+)\b/i, lang: "es" },
    { re: /^Apontamentos\s+Auxiliares\s+(\d+)\b/i, lang: "pt" },
    { re: /^Auxiliary\s+(?:Notes|Information)\s+(\d+)\b/i, lang: "en" },
    { re: /^Notes\s+auxiliaires\s+(\d+)\b/i, lang: "fr" },
    { re: /^Information\s+auxiliaire\s+(\d+)\b/i, lang: "fr" },
  ];
  for (const { re, lang } of auxPatterns) {
    const m = name.match(re);
    if (m) return { lang, kind: "AUXILIARY", num: Number(m[1]) };
  }

  return null;
}

// Determine class number from a DB attachment name.
function classifyAttachmentName(
  name: string,
  language: Lang,
  documentKey: string,
  kind: Kind,
): { num: number } | null {
  if (kind === "AUXILIARY") {
    // Use documentKey 'aux-1' / 'aux-2'
    const m = documentKey.match(/aux-(\d+)/i);
    if (m) return { num: Number(m[1]) };
    // Fallback: extract from name
    const m2 = name.match(/\b(\d+)\b/);
    if (m2) return { num: Number(m2[1]) };
    return null;
  }

  // CLASS: extract first integer after the language prefix
  const re =
    language === "es"
      ? /^Clase\s+(\d+)(?=[_\s-])/i
      : language === "en"
        ? /^(?:Class|Lesson)\s+(\d+)(?=[_\s-])/i
        : language === "fr"
          ? /^(?:Cours|Lecon|Leçon)\s+(\d+)(?=[_\s-])/i
          : /^Aula\s+(\d+)(?=[_\s-])/i;
  const m = name.match(re);
  if (m) return { num: Number(m[1]) };
  return null;
}

async function main() {
  // 1. Read bucket
  const { data: bucketObjs, error: listError } = await supabase.storage
    .from(BUCKET)
    .list("", { limit: 1000 });
  if (listError) throw listError;

  const bucketMap = new Map<Key, string>();
  for (const obj of bucketObjs ?? []) {
    if (!obj.name.toLowerCase().endsWith(".pdf")) continue;
    const c = classifyBucketName(obj.name);
    if (!c) {
      console.warn("Unclassified bucket file:", obj.name);
      continue;
    }
    const key: Key = `${c.lang}|${c.kind}|${c.num}`;
    if (bucketMap.has(key)) {
      console.warn(
        `Duplicate bucket key ${key}: have "${bucketMap.get(key)}", got "${obj.name}"`,
      );
    }
    bucketMap.set(key, obj.name);
  }
  console.log(`Indexed ${bucketMap.size} bucket files.`);

  // 2. Read DB attachments
  const attachments = await prisma.attachment.findMany({
    select: {
      id: true,
      name: true,
      url: true,
      language: true,
      kind: true,
      documentKey: true,
    },
  });

  const updates: Array<{
    id: string;
    oldName: string;
    newName: string;
    oldUrl: string;
    newUrl: string;
  }> = [];
  const unmatched: Array<{ id: string; name: string; reason: string }> = [];

  for (const att of attachments) {
    const lang = att.language as Lang;
    const kind = att.kind as Kind;
    const c = classifyAttachmentName(att.name, lang, att.documentKey, kind);
    if (!c) {
      unmatched.push({ id: att.id, name: att.name, reason: "no-class-num" });
      continue;
    }
    const key: Key = `${lang}|${kind}|${c.num}`;
    const bucketFile = bucketMap.get(key);
    if (!bucketFile) {
      unmatched.push({
        id: att.id,
        name: att.name,
        reason: `no-bucket-match-for-${key}`,
      });
      continue;
    }
    const newName = toAttachmentDisplayName(bucketFile);
    if (att.name !== newName || att.url !== bucketFile) {
      updates.push({
        id: att.id,
        oldName: att.name,
        newName,
        oldUrl: att.url,
        newUrl: bucketFile,
      });
    }
  }

  console.log(
    `\n${updates.length} attachments to update, ${unmatched.length} unmatched.`,
  );

  if (unmatched.length) {
    console.log("\nUnmatched attachments:");
    for (const u of unmatched) console.log(" -", JSON.stringify(u));
  }

  console.log("\nUpdates (first 80):");
  for (const u of updates.slice(0, 80)) {
    console.log(`  [${u.id}]`);
    console.log(`    name: "${u.oldName}"`);
    console.log(`       -> "${u.newName}"`);
    console.log(`    url:  "${u.oldUrl}"`);
    console.log(`       -> "${u.newUrl}"`);
  }

  if (!APPLY) {
    console.log("\nDRY-RUN. Re-run with --apply to write changes.");
    return;
  }

  // 3. Apply updates
  let ok = 0;
  for (const u of updates) {
    await prisma.attachment.update({
      where: { id: u.id },
      data: { name: u.newName, url: u.newUrl },
    });
    ok++;
  }
  console.log(`\nApplied ${ok}/${updates.length} updates.`);
}

main().finally(() => prisma.$disconnect());

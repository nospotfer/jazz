// One-off diagnostic: compare DB attachment paths against actual bucket contents.
import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

// Minimal .env.local loader (no dotenv dep required)
try {
  const envPath = resolve(process.cwd(), ".env.local");
  const content = readFileSync(envPath, "utf8");
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
} catch (err) {
  console.error("Failed to load .env.local:", err);
}

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET!;

const extractStoragePath = (value: string, bucketName: string) => {
  const rawValue = (value ?? "").trim();
  if (!rawValue) return "";
  if (!rawValue.startsWith("http")) return rawValue;
  try {
    const url = new URL(rawValue);
    const pathSegments = url.pathname
      .split("/")
      .map((segment) => decodeURIComponent(segment));
    const objectSignIndex = pathSegments.findIndex((s) => s === "sign");
    const objectPublicIndex = pathSegments.findIndex((s) => s === "public");
    const markerIndex =
      objectSignIndex >= 0 ? objectSignIndex : objectPublicIndex;
    if (markerIndex >= 0 && pathSegments[markerIndex + 1] === bucketName) {
      return pathSegments.slice(markerIndex + 2).join("/");
    }
    const directPrefix = `${bucketName}/`;
    const decodedPath = decodeURIComponent(url.pathname);
    const prefixIndex = decodedPath.indexOf(directPrefix);
    if (prefixIndex >= 0) {
      return decodedPath.slice(prefixIndex + directPrefix.length);
    }
    const fileName = pathSegments[pathSegments.length - 1];
    if (fileName?.toLowerCase().endsWith(".pdf")) return fileName;
  } catch {
    return rawValue;
  }
  return rawValue;
};

async function listBucketRoot(): Promise<Set<string>> {
  const names = new Set<string>();
  // Supabase paginates: list with offset
  let offset = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list("", { limit: pageSize, offset, sortBy: { column: "name", order: "asc" } });
    if (error) {
      console.error("Bucket list error:", error);
      break;
    }
    if (!data || data.length === 0) break;
    for (const obj of data) names.add(obj.name);
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return names;
}

async function main() {
  console.log("Bucket:", BUCKET);
  const bucketNames = await listBucketRoot();
  console.log("Files in bucket root:", bucketNames.size);

  const attachments = await prisma.attachment.findMany({
    select: { id: true, name: true, url: true, lessonId: true, language: true },
  });
  console.log("Attachments in DB:", attachments.length);

  let okCount = 0;
  const missing: { id: string; name: string; storagePath: string }[] = [];

  for (const att of attachments) {
    const sp = extractStoragePath(att.url, BUCKET);
    // Only compare root-level entries
    const top = sp.split("/")[0];
    if (bucketNames.has(top) || bucketNames.has(sp)) okCount++;
    else missing.push({ id: att.id, name: att.name, storagePath: sp });
  }

  console.log(`OK: ${okCount}/${attachments.length}`);
  console.log("MISSING:", missing.length);
  for (const m of missing.slice(0, 30)) {
    console.log(" -", JSON.stringify(m));
  }

  // Print first 10 bucket entries for reference
  console.log("\nFirst 20 bucket files:");
  for (const name of Array.from(bucketNames).slice(0, 20)) {
    console.log("  ", name);
  }
}

main().finally(() => prisma.$disconnect());

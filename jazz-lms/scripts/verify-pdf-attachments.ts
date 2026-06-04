import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

for (const envFile of [".env.local", ".env"]) {
  try {
    const content = readFileSync(resolve(process.cwd(), envFile), "utf8");
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
}

const prisma = new PrismaClient();

const bucket = process.env.SUPABASE_STORAGE_BUCKET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!bucket || !supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing SUPABASE_STORAGE_BUCKET, NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY",
  );
}

const storageBucket = bucket;

const supabase = createClient(supabaseUrl, serviceRoleKey);

const extractStoragePath = (value: string, bucketName: string) => {
  const rawValue = (value ?? "").trim();
  if (!rawValue) return "";
  if (!rawValue.startsWith("http")) return rawValue;

  try {
    const url = new URL(rawValue);
    const pathSegments = url.pathname
      .split("/")
      .map((segment) => decodeURIComponent(segment));
    const objectSignIndex = pathSegments.findIndex((segment) => segment === "sign");
    const objectPublicIndex = pathSegments.findIndex((segment) => segment === "public");
    const markerIndex = objectSignIndex >= 0 ? objectSignIndex : objectPublicIndex;

    if (markerIndex >= 0 && pathSegments[markerIndex + 1] === bucketName) {
      return pathSegments.slice(markerIndex + 2).join("/");
    }

    const directPrefix = `${bucketName}/`;
    const decodedPath = decodeURIComponent(url.pathname);
    const prefixIndex = decodedPath.indexOf(directPrefix);
    if (prefixIndex >= 0) {
      return decodedPath.slice(prefixIndex + directPrefix.length);
    }
  } catch {}

  return rawValue;
};

async function main() {
  const attachments = await prisma.attachment.findMany({
    select: {
      id: true,
      name: true,
      url: true,
      language: true,
      kind: true,
    },
    orderBy: [{ language: "asc" }, { name: "asc" }],
  });

  let okCount = 0;
  let totalBytes = 0;
  const failures: Array<{
    id: string;
    name: string;
    url: string;
    error?: string;
    bytes?: number;
    magic?: string;
  }> = [];

  for (const attachment of attachments) {
    const storagePath = extractStoragePath(attachment.url, storageBucket);
    const { data, error } = await supabase.storage.from(storageBucket).download(storagePath);

    if (error || !data) {
      failures.push({
        id: attachment.id,
        name: attachment.name,
        url: storagePath,
        error: error?.message ?? "missing data",
      });
      continue;
    }

    const bytes = new Uint8Array(await data.arrayBuffer());
    const magic = Buffer.from(bytes.slice(0, 5)).toString("utf8");
    totalBytes += bytes.length;

    if (magic !== "%PDF-" || bytes.length < 1000) {
      failures.push({
        id: attachment.id,
        name: attachment.name,
        url: storagePath,
        bytes: bytes.length,
        magic,
      });
      continue;
    }

    okCount += 1;
  }

  console.log(`PDF_DOWNLOAD_OK:${okCount}/${attachments.length}`);
  console.log(`PDF_TOTAL_BYTES:${totalBytes}`);
  console.log(`PDF_FAILURES:${failures.length}`);

  for (const failure of failures.slice(0, 30)) {
    console.log(JSON.stringify(failure));
  }

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().finally(() => prisma.$disconnect());

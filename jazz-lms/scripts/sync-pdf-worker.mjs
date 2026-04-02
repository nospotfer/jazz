import { access, copyFile, mkdir } from "fs/promises";
import { basename, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = resolve(__dirname, "..");
const workerCandidates = [
  "node_modules/pdfjs-dist/build/pdf.worker.min.js",
  "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
].map((relativePath) => resolve(projectRoot, relativePath));

const targets = [
  resolve(projectRoot, "public/pdf.worker.min.js"),
  resolve(projectRoot, "public/pdf.worker.min.mjs"),
];

async function resolveSourceWorker() {
  for (const candidate of workerCandidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Continue searching candidates.
    }
  }

  throw new Error(
    `Could not find pdf.worker file. Checked: ${workerCandidates.join(", ")}`,
  );
}

async function main() {
  const source = await resolveSourceWorker();

  for (const target of targets) {
    await mkdir(dirname(target), { recursive: true });
    await copyFile(source, target);
  }

  console.log(
    `PDF worker synced from ${basename(source)} to public/pdf.worker.min.js and public/pdf.worker.min.mjs`,
  );
}

main().catch((error) => {
  console.error("Failed to sync PDF worker:", error);
  process.exit(1);
});

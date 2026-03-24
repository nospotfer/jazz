import { copyFile, mkdir } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = resolve(__dirname, "..");
const source = resolve(
  projectRoot,
  "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
);
const target = resolve(projectRoot, "public/pdf.worker.min.mjs");

async function main() {
  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
  console.log("PDF worker synced to public/pdf.worker.min.mjs");
}

main().catch((error) => {
  console.error("Failed to sync PDF worker:", error);
  process.exit(1);
});

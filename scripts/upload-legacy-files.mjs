// Run only after reviewing the generated Storage manifest. Never put it in public/.
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";
const [manifestPath, sourceRoot, flag] = process.argv.slice(2);
if (!manifestPath || !sourceRoot)
  throw new Error(
    "Usage: node --env-file=.env.local scripts/upload-legacy-files.mjs manifest.json legacy-source-root [--apply]",
  );
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const root = path.resolve(sourceRoot);
for (const item of manifest) {
  const file = path.resolve(root, item.local_path);
  if (!file.startsWith(root + path.sep))
    throw new Error("File escapes source directory");
  if (!["directory-images", "health-records", "avatars"].includes(item.bucket))
    throw new Error("Unknown bucket");
  if (item.path.includes("..") || item.path.startsWith("/"))
    throw new Error("Invalid Storage path");
  const bytes = await readFile(file);
  if (bytes.length > 3 * 1024 * 1024)
    throw new Error("File exceeds 3 MB: " + item.local_path);
}
if (flag !== "--apply") {
  console.log(
    `Validated ${manifest.length} files. Pass --apply to upload them.`,
  );
  process.exit(0);
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
for (const item of manifest) {
  const bytes = await readFile(path.resolve(root, item.local_path));
  const ext = path.extname(item.path).toLowerCase();
  const contentType = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
  }[ext];
  if (!contentType) throw new Error("Unsupported file type");
  const { error } = await db.storage
    .from(item.bucket)
    .upload(item.path, bytes, { contentType, upsert: false });
  if (error) {
    if (String(error.statusCode) === "409") {
      console.log("Already exists: " + item.path);
      continue;
    }
    throw error;
  }
  console.log("Uploaded " + item.path);
}

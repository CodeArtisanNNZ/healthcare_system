import "server-only";
import { supabase } from "./supabase/server";
export async function upload(
  file: File,
  bucket: "health-records" | "avatars" | "directory-images",
  owner: string,
) {
  const allowed =
    bucket === "health-records"
      ? ["application/pdf", "image/jpeg", "image/png"]
      : ["image/jpeg", "image/png"];
  if (
    !allowed.includes(file.type) ||
    file.size > 3 * 1024 * 1024 ||
    file.size === 0
  )
    throw new Error(
      "Choose a PNG/JPEG image" +
        (bucket === "health-records" ? " or PDF" : "") +
        " up to 3 MB.",
    );
  const bytes = new Uint8Array(await file.arrayBuffer());
  const valid =
    file.type === "application/pdf"
      ? String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-"
      : file.type === "image/png"
        ? bytes.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10"
        : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (!valid)
    throw new Error("File contents do not match the selected file type.");
  const ext =
    file.type === "application/pdf"
      ? "pdf"
      : file.type === "image/png"
        ? "png"
        : "jpg";
  const path = `${owner}/${crypto.randomUUID()}.${ext}`;
  const db = await supabase();
  const { error } = await db.storage
    .from(bucket)
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (error) throw new Error("Upload failed: " + error.message);
  return path;
}
export async function removeFile(bucket: string, path: string) {
  const db = await supabase();
  const { error } = await db.storage.from(bucket).remove([path]);
  if (error) throw new Error("File removal failed: " + error.message);
}
export async function fileUrl(bucket: string, path: string | null | undefined) {
  if (!path) return null;
  const db = await supabase();
  if (bucket === "directory-images")
    return db.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  const { data, error } = await db.storage
    .from(bucket)
    .createSignedUrl(path, 300);
  if (error) return null;
  return data.signedUrl;
}

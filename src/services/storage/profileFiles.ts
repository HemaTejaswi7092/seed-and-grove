import { supabase } from "../../lib/supabase";

// Matches the buckets' own file_size_limit/allowed_mime_types (see
// supabase/candidate_settings.sql) — checked here too so a rejected file
// never round-trips to the network first.
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const MAX_RESUME_BYTES = 10 * 1024 * 1024;
const AVATAR_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const RESUME_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function validateAvatarFile(file: File): string | null {
  if (!AVATAR_MIME_TYPES.includes(file.type)) {
    return "Please upload a PNG, JPEG, WEBP, or GIF image.";
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return "Image must be under 5MB.";
  }
  return null;
}

export function validateResumeFile(file: File): string | null {
  if (!RESUME_MIME_TYPES.includes(file.type)) {
    return "Please upload a PDF or Word document (.pdf, .doc, .docx).";
  }
  if (file.size > MAX_RESUME_BYTES) {
    return "File must be under 10MB.";
  }
  return null;
}

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot);
}

// Always uploads to `${userId}/...` — the Storage RLS policies on both
// buckets only allow a user to write under their own id, and this is the
// only place that ever calls .storage.upload(), so that invariant can't
// be bypassed from anywhere else in the app. `upsert: true` + a fresh
// timestamped filename means a re-upload doesn't need a separate delete
// step first, and old files are simply orphaned (harmless, small, and out
// of scope to garbage-collect for this phase).
async function uploadProfileFile(
  bucket: "avatars" | "resumes",
  userId: string,
  file: File,
): Promise<string> {
  const prefix = bucket === "avatars" ? "avatar" : "resume";
  const path = `${userId}/${prefix}-${Date.now()}${extensionOf(file.name)}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  return uploadProfileFile("avatars", userId, file);
}

export async function uploadResume(userId: string, file: File): Promise<string> {
  return uploadProfileFile("resumes", userId, file);
}

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { uploadAvatar, validateAvatarFile } from "../../services/storage/profileFiles";
import { getInitials } from "../../lib/initials";

interface AvatarUploadFieldProps {
  userId: string;
  displayName: string;
  value: string;
  onChange: (url: string) => void;
}

// Uploads straight to Supabase Storage (the `avatars` bucket — see
// supabase/candidate_settings.sql) and writes the resulting public URL
// into the draft; nothing is saved to candidate_profiles until the
// section's own Save button is pressed, same as every other field here.
export default function AvatarUploadField({
  userId,
  displayName,
  value,
  onChange,
}: AvatarUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateAvatarFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const url = await uploadAvatar(userId, file);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't upload that image.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      {value ? (
        <img
          src={value}
          alt=""
          className="h-16 w-16 shrink-0 rounded-full border border-border object-cover"
        />
      ) : (
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-ink text-lg font-semibold text-white">
          {getInitials(displayName)}
        </span>
      )}
      <div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload className="h-3.5 w-3.5" strokeWidth={2} />
            {uploading ? "Uploading…" : value ? "Change photo" : "Upload photo"}
          </button>
          {value && !uploading && (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Remove photo"
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          )}
        </div>
        <p className="mt-1.5 text-xs text-ink-faint">PNG, JPEG, WEBP, or GIF. Up to 5MB.</p>
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFileSelected}
        className="hidden"
      />
    </div>
  );
}

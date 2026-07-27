import { useRef, useState } from "react";
import { Upload, X, FileText } from "lucide-react";
import { uploadResume, validateResumeFile } from "../../services/storage/profileFiles";

interface ResumeUploadFieldProps {
  userId: string;
  value: string;
  onChange: (url: string) => void;
}

// Same pattern as AvatarUploadField — uploads to the `resumes` bucket,
// writes the resulting URL into the draft only. Visibility (whether
// recruiters can see this URL at all) is a separate toggle the caller
// renders next to this — see PublicLinksSection.tsx.
export default function ResumeUploadField({ userId, value, onChange }: ResumeUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateResumeFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const url = await uploadResume(userId, file);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't upload that file.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {value && (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
          >
            <FileText className="h-3.5 w-3.5" strokeWidth={2} />
            View current resume
          </a>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Upload className="h-3.5 w-3.5" strokeWidth={2} />
          {uploading ? "Uploading…" : value ? "Replace resume" : "Upload resume"}
        </button>
        {value && !uploading && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Remove resume"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        )}
      </div>
      <p className="mt-1.5 text-xs text-ink-faint">PDF or Word document. Up to 10MB.</p>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileSelected}
        className="hidden"
      />
    </div>
  );
}

import { useEffect, useState } from "react";
import { parseCommaList } from "../../recruiter/parseCommaList";

interface CommaListInputProps {
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

// A plain text input backed by its OWN local string buffer, synced to
// the parent's string[] only on blur — not a controlled input whose
// value is re-derived (split/trim/rejoin) from that array on every
// keystroke. That derived-value approach silently eats commas and
// trailing spaces as you type (each intermediate render trims away the
// half-typed delimiter before you can finish the next word) — this is
// the same fix RecruiterJobForm.tsx already uses for required/preferred
// skills, just extracted so both call sites here share it.
export default function CommaListInput({
  value,
  onChange,
  placeholder,
  className,
}: CommaListInputProps) {
  const [text, setText] = useState(value.join(", "));

  // Keeps the buffer in sync when the array changes for a reason OTHER
  // than this input's own typing — e.g. the section reloading after a
  // save elsewhere resets `value` to the freshly-saved data. Deferred via
  // .then() so setText is never called synchronously in the effect body
  // (same fix used throughout this codebase — see e.g.
  // useRecruiterProfile.ts).
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setText(value.join(", "));
    });
    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <input
      className={className}
      placeholder={placeholder}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onChange(parseCommaList(text))}
    />
  );
}

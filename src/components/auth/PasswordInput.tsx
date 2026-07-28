import { useRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

const inputClasses =
  "w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 pr-10 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none";

// className here is applied to the wrapper (for the mt-2/mt-1.5 spacing
// every call site already used) — the input's own visual style is fixed
// above so the show/hide icon's padding never has to be remembered
// per call site. Everything else (id, value, onChange, placeholder,
// required, minLength, autoComplete...) passes straight through to the
// underlying <input>.
type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

// Shared password field — every password/confirm-password input in the
// app (Sign In, Sign Up, Recruiter Sign Up, Change Password) renders
// through this one component, so the show/hide toggle looks and behaves
// identically everywhere instead of being reimplemented per form. Icon
// button styling mirrors GlobalSearchBar.tsx's clear button (same
// right-3/h-6 w-6/h-3.5 w-3.5 proportions) — the one existing
// icon-inside-input pattern in this codebase.
export default function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function toggleVisible() {
    setVisible((v) => !v);
    // Activating the button (mouse or keyboard) moves focus to it by
    // default — send focus back to the field itself so typing/review can
    // continue without an extra click or Tab.
    inputRef.current?.focus();
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <input
        {...props}
        ref={inputRef}
        type={visible ? "text" : "password"}
        className={inputClasses}
      />
      <button
        type="button"
        onClick={toggleVisible}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute top-1/2 right-3 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-accent-soft hover:text-ink focus-visible:bg-accent-soft focus-visible:text-ink focus-visible:outline-none"
      >
        {visible ? (
          <EyeOff className="h-3.5 w-3.5" strokeWidth={2} />
        ) : (
          <Eye className="h-3.5 w-3.5" strokeWidth={2} />
        )}
      </button>
    </div>
  );
}

const inputClasses =
  "w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none";

export interface CompanyExtrasValues {
  companyLogoUrl: string;
  // Comma-separated raw text — parsed into text[] at submit time (see
  // parseCommaList in RecruiterSignUp.tsx/RecruiterProfile.tsx). No tag
  // input yet; simplest thing that fits the hiring_locations/hiring_roles
  // text[] columns without a new dependency.
  hiringLocations: string;
  hiringRoles: string;
}

interface CompanyExtrasFormProps {
  values: CompanyExtrasValues;
  onChange: (values: CompanyExtrasValues) => void;
}

// Optional company fields (signup Step 3) — same reuse shape as
// CompanyInfoForm: controlled fields only, no form/submit of its own.
export default function CompanyExtrasForm({ values, onChange }: CompanyExtrasFormProps) {
  function set<K extends keyof CompanyExtrasValues>(key: K, value: string) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="company-logo" className="block text-sm font-medium text-ink">
          Company logo URL{" "}
          <span className="text-ink-faint">(optional)</span>
        </label>
        <input
          id="company-logo"
          type="url"
          value={values.companyLogoUrl}
          onChange={(event) => set("companyLogoUrl", event.target.value)}
          placeholder="https://acme.com/logo.png"
          className={`mt-2 ${inputClasses}`}
        />
      </div>

      <div>
        <label htmlFor="hiring-locations" className="block text-sm font-medium text-ink">
          Hiring locations{" "}
          <span className="text-ink-faint">(optional, comma-separated)</span>
        </label>
        <input
          id="hiring-locations"
          type="text"
          value={values.hiringLocations}
          onChange={(event) => set("hiringLocations", event.target.value)}
          placeholder="Remote, New York, London"
          className={`mt-2 ${inputClasses}`}
        />
      </div>

      <div>
        <label htmlFor="hiring-roles" className="block text-sm font-medium text-ink">
          Hiring roles{" "}
          <span className="text-ink-faint">(optional, comma-separated)</span>
        </label>
        <input
          id="hiring-roles"
          type="text"
          value={values.hiringRoles}
          onChange={(event) => set("hiringRoles", event.target.value)}
          placeholder="Backend Engineer, ML Engineer"
          className={`mt-2 ${inputClasses}`}
        />
      </div>
    </div>
  );
}

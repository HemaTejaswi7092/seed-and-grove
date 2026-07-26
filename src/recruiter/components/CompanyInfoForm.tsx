const inputClasses =
  "w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none";

export interface CompanyInfoValues {
  companyName: string;
  jobTitle: string;
  companyWebsite: string;
  companyLocation: string;
}

interface CompanyInfoFormProps {
  values: CompanyInfoValues;
  onChange: (values: CompanyInfoValues) => void;
}

// Required company fields (signup Step 2). Deliberately just the
// controlled fields, no form/submit of its own — reused as-is by
// RecruiterSignUp.tsx's wizard AND RecruiterProfile.tsx's editor, which
// each own their own submit handling around it.
export default function CompanyInfoForm({ values, onChange }: CompanyInfoFormProps) {
  function set<K extends keyof CompanyInfoValues>(key: K, value: string) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="company-name" className="block text-sm font-medium text-ink">
          Company name
        </label>
        <input
          id="company-name"
          type="text"
          required
          value={values.companyName}
          onChange={(event) => set("companyName", event.target.value)}
          placeholder="Acme Inc."
          className={`mt-2 ${inputClasses}`}
        />
      </div>

      <div>
        <label htmlFor="job-title" className="block text-sm font-medium text-ink">
          Your job title
        </label>
        <input
          id="job-title"
          type="text"
          required
          value={values.jobTitle}
          onChange={(event) => set("jobTitle", event.target.value)}
          placeholder="Technical Recruiter"
          className={`mt-2 ${inputClasses}`}
        />
      </div>

      <div>
        <label htmlFor="company-website" className="block text-sm font-medium text-ink">
          Company website
        </label>
        <input
          id="company-website"
          type="url"
          value={values.companyWebsite}
          onChange={(event) => set("companyWebsite", event.target.value)}
          placeholder="https://acme.com"
          className={`mt-2 ${inputClasses}`}
        />
      </div>

      <div>
        <label htmlFor="company-location" className="block text-sm font-medium text-ink">
          Company location
        </label>
        <input
          id="company-location"
          type="text"
          value={values.companyLocation}
          onChange={(event) => set("companyLocation", event.target.value)}
          placeholder="San Francisco, CA"
          className={`mt-2 ${inputClasses}`}
        />
      </div>
    </div>
  );
}

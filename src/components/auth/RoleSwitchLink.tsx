import { Link } from "react-router-dom";

interface RoleSwitchLinkProps {
  prompt: string;
  linkLabel: string;
  to: string;
}

// Lets a user switch between the candidate and recruiter auth flows
// without first going back to the landing page.
export default function RoleSwitchLink({ prompt, linkLabel, to }: RoleSwitchLinkProps) {
  return (
    <p className="mt-3 text-center text-sm text-ink-soft">
      {prompt}{" "}
      <Link to={to} className="font-medium text-accent-dark hover:text-accent">
        {linkLabel}
      </Link>
    </p>
  );
}

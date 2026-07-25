import LandingNav from "../components/landing/LandingNav";
import Hero from "../components/landing/Hero";
import WhatIsSeed from "../components/landing/WhatIsSeed";
import WhatIsGrove from "../components/landing/WhatIsGrove";
import HowItWorks from "../components/landing/HowItWorks";
import Comparison from "../components/landing/Comparison";
import FinalCTA from "../components/landing/FinalCTA";
import LandingFooter from "../components/landing/LandingFooter";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <div id="features">
          <WhatIsSeed />
          <WhatIsGrove />
        </div>
        <HowItWorks />
        <Comparison />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}

import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/sections/Hero";
import { Trap } from "@/components/sections/Trap";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { ImageBand } from "@/components/sections/ImageBand";
import { PerPartyView } from "@/components/sections/PerPartyView";
import { TrustBoundary } from "@/components/sections/TrustBoundary";
import { Settlement } from "@/components/sections/Settlement";
import { WhyOnLedger } from "@/components/sections/WhyOnLedger";
import { FinalCTA } from "@/components/sections/FinalCTA";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Trap />
        <HowItWorks />
        <ImageBand
          src="/moment.webp"
          alt="Two beams of blue light crossing at a single bright point, standing for two sealed prices meeting"
          line="The only number that leaves the round is the price both sides agreed to."
        />
        <PerPartyView />
        <TrustBoundary />
        <Settlement />
        <WhyOnLedger />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}

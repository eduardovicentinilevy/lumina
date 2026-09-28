import { Navbar } from "../components/marketing/Navbar";
import { Hero } from "../components/marketing/Hero";
import { SplitPaymentSection } from "../components/marketing/SplitPaymentSection";
import { Modules } from "../components/marketing/Modules";
import { Trust } from "../components/marketing/Trust";
import { GoToMarket } from "../components/marketing/GoToMarket";
import { Pricing } from "../components/marketing/Pricing";
import { CTA } from "../components/marketing/CTA";
import { Footer } from "../components/marketing/Footer";

export default function Landing() {
  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Hero />
        <SplitPaymentSection />
        <Modules />
        <Trust />
        <GoToMarket />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  );
}

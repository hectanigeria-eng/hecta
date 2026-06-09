import { Benefits } from "@/components/landing/benefits";
import { Cta } from "@/components/landing/cta";
import { DoMore } from "@/components/landing/do-more";
import { Earn } from "@/components/landing/earn";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Reviews } from "@/components/landing/reviews";
import { Safe } from "@/components/landing/safe";
import { SmoothScroll } from "@/components/landing/smooth-scroll";
import { Waitlist } from "@/components/landing/waitlist";

export default function Home() {
  return (
    <main className="bg-paper">
      <SmoothScroll />
      <div id="top" className="relative scroll-mt-0">
        <Header />
        <Hero />
      </div>
      <div id="how-it-works" className="scroll-mt-20">
        <DoMore />
      </div>
      <div id="for-landlords" className="scroll-mt-20">
        <Earn />
      </div>
      <div id="features" className="scroll-mt-20">
        <Features />
      </div>
      <div id="benefits" className="scroll-mt-20">
        <Benefits />
      </div>
      <div id="security" className="scroll-mt-20">
        <Safe />
      </div>
      <div id="reviews" className="scroll-mt-20">
        <Reviews />
      </div>
      <div id="get-started" className="scroll-mt-20">
        <Cta />
      </div>
      <Footer />
      <Waitlist />
    </main>
  );
}

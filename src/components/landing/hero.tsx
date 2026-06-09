"use client";

import Image from "next/image";
import { useI18n } from "@/lib/i18n";
import { Star } from "./icons";
import { Reveal } from "./reveal";
import { SavingsCalculator } from "./savings-calculator";

function Rating({
  logo,
  alt,
  score,
  store,
  reviews,
  on,
}: {
  logo: string;
  alt: string;
  score: string;
  store: string;
  reviews: string;
  on: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[15px]">
      <Image src={logo} alt={alt} width={20} height={20} className="h-5 w-5" />
      <span className="font-medium text-paper">{score}</span>
      <Star className="h-3.5 w-3.5 text-paper" />
      <span className="text-paper/90">
        {on} {store}
      </span>
      <span className="text-white/45">{reviews}</span>
    </div>
  );
}

export function Hero() {
  const { t } = useI18n();
  return (
    <section className="relative isolate overflow-hidden bg-[#123121]">
      <Image
        src="/images/hecta-img-6.webp"
        alt="A residential street in Lagos at golden hour"
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover object-center"
      />
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-[#0a2413]/85 via-[#0a2413]/35 to-transparent" />
      <div className="absolute inset-0 -z-10 bg-linear-to-t from-[#0a2413]/70 via-transparent to-[#0a2413]/20" />

      <div className="mx-auto grid min-h-[760px] max-w-[1440px] grid-cols-1 items-center gap-12 px-6 pb-12 pt-[150px] md:px-12 lg:grid-cols-[1fr_auto] lg:pb-16">
        <div className="max-w-[640px]">
          <Reveal
            as="h1"
            className="text-balance text-[clamp(2.75rem,6vw,5.25rem)] font-medium leading-[1.04] tracking-[-0.02em] text-white"
          >
            {t.hero.title}
          </Reveal>
          <Reveal delay={120}>
            <button
              type="button"
              data-waitlist
              className="mt-9 inline-flex items-center rounded-full bg-mint px-6 py-3 text-[15px] font-semibold text-ink transition-transform hover:scale-[1.03]"
            >
              {t.hero.browse}
            </button>
          </Reveal>
        </div>

        {/* Savings calculator */}
        <Reveal delay={220} className="w-full max-w-[488px] justify-self-end">
          <SavingsCalculator />
        </Reveal>
      </div>

      <div className="relative z-10 mx-auto -mt-2 flex max-w-[1440px] flex-wrap items-center gap-x-8 gap-y-3 px-6 pb-10 md:px-12">
        <Rating
          logo="/figma/googleplay.png"
          alt="Google Play"
          score="4.8"
          store="Google Play"
          reviews="179K reviews"
          on={t.rating.on}
        />
        <Rating
          logo="/figma/appstore.png"
          alt="App Store"
          score="4.7"
          store="App Store"
          reviews="11K reviews"
          on={t.rating.on}
        />
      </div>
    </section>
  );
}

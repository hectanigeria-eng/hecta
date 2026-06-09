"use client";

import Image from "next/image";
import { useI18n } from "@/lib/i18n";
import { Star } from "./icons";
import { Reveal } from "./reveal";

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
      <span className="text-paper/45">{reviews}</span>
    </div>
  );
}

export function Cta() {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-[1440px] px-6 py-8 md:px-12">
      <Reveal className="overflow-hidden rounded-[40px] bg-deep px-6 py-16 text-center md:py-20">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
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

        <h2 className="mx-auto mt-8 max-w-[760px] text-[clamp(2.25rem,5vw,4rem)] font-medium leading-[1.05] tracking-[-0.02em]">
          <span className="text-mint">{t.cta.line1}</span>{" "}
          <span className="text-white">{t.cta.line2}</span>
        </h2>

        <button
          type="button"
          data-waitlist
          className="mt-9 inline-flex items-center rounded-full bg-mint px-7 py-3.5 text-[15px] font-semibold text-ink transition-transform hover:scale-[1.04]"
        >
          {t.cta.button}
        </button>
      </Reveal>
    </section>
  );
}

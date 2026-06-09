"use client";

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ArrowRight, Check } from "./icons";
import { Reveal } from "./reveal";

function BenefitList({
  items,
  tone,
}: {
  items: string[];
  tone: "light" | "dark";
}) {
  return (
    <ul className="mt-7 space-y-4">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span
            className={cn(
              "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full",
              tone === "light"
                ? "bg-primary-500/12 text-primary-600"
                : "bg-mint/20 text-mint",
            )}
          >
            <Check className="h-3.5 w-3.5" />
          </span>
          <span
            className={cn(
              "text-[16px] leading-relaxed",
              tone === "light" ? "text-ink/80" : "text-paper/80",
            )}
          >
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Benefits() {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-[1440px] px-6 py-20 md:px-12 md:py-28">
      <Reveal className="mx-auto max-w-[680px] text-center">
        <p className="text-[15px] font-medium text-primary-600">
          {t.benefits.eyebrow}
        </p>
        <h2 className="mt-3 text-[clamp(2rem,4vw,3.4rem)] font-medium leading-[1.08] tracking-[-0.02em] text-ink">
          {t.benefits.heading}
        </h2>
        <p className="mt-4 text-[18px] leading-relaxed text-ink/70">
          {t.benefits.sub}
        </p>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Seekers */}
        <Reveal className="flex flex-col rounded-[40px] border-2 border-paper bg-white p-8 md:p-10">
          <span className="w-fit rounded-full bg-primary-500/10 px-4 py-1.5 text-[14px] font-semibold text-primary-600">
            {t.benefits.seekerTag}
          </span>
          <h3 className="mt-5 text-[clamp(1.6rem,2.4vw,2.2rem)] font-medium tracking-tight text-ink">
            {t.benefits.seekerTitle}
          </h3>
          <BenefitList items={t.benefits.seekerItems} tone="light" />
          <button
            type="button"
            data-waitlist
            className="group mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-mint px-6 py-3 text-[15px] font-semibold text-ink transition-transform hover:scale-[1.03]"
          >
            {t.benefits.seekerCta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </Reveal>

        {/* Landlords */}
        <Reveal
          delay={120}
          className="flex flex-col rounded-[40px] bg-deep p-8 text-paper md:p-10"
        >
          <span className="w-fit rounded-full bg-mint/15 px-4 py-1.5 text-[14px] font-semibold text-mint">
            {t.benefits.landlordTag}
          </span>
          <h3 className="mt-5 text-[clamp(1.6rem,2.4vw,2.2rem)] font-medium tracking-tight text-white">
            {t.benefits.landlordTitle}
          </h3>
          <BenefitList items={t.benefits.landlordItems} tone="dark" />
          <button
            type="button"
            data-waitlist
            className="group mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-mint px-6 py-3 text-[15px] font-semibold text-ink transition-transform hover:scale-[1.03]"
          >
            {t.benefits.landlordCta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </Reveal>
      </div>
    </section>
  );
}

"use client";

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Star } from "./icons";
import { Reveal } from "./reveal";

const statValues = ["₦2B+", "12,000+", "50,000+", "4.8/5"];

const reviews = [
  {
    quote:
      "I rented my flat in Lekki without paying a single agent. Saved almost ₦400k in fees and the landlord was actually verified.",
    name: "Adaeze O.",
    role: "tenant" as const,
    loc: "Lekki",
    initials: "AO",
    tone: "green" as const,
  },
  {
    quote:
      "As a landlord, the demand pool is gold. I listed on a Sunday and had three verified tenants by Tuesday.",
    name: "Chinedu E.",
    role: "landlord" as const,
    loc: "Ikeja",
    initials: "CE",
    tone: "amber" as const,
  },
  {
    quote:
      "The tenancy agreement was generated and signed in minutes. No lawyer, no stress, no surprise clauses.",
    name: "Funke A.",
    role: "tenant" as const,
    loc: "Yaba",
    initials: "FA",
    tone: "amber" as const,
  },
  {
    quote:
      "Every listing I saw was real. After months of fake apartments on other sites, Hecta felt like a relief.",
    name: "Tunde B.",
    role: "buyer" as const,
    loc: "Ajah",
    initials: "TB",
    tone: "green" as const,
  },
  {
    quote:
      "I manage all my chats from WhatsApp. No new app to learn and tenants are already screened before they reach me.",
    name: "Ngozi K.",
    role: "landlord" as const,
    loc: "Surulere",
    initials: "NK",
    tone: "green" as const,
  },
  {
    quote:
      "Filtered by serviced, pet-friendly and my budget, found a place in a day, and moved in the same week.",
    name: "Seyi M.",
    role: "tenant" as const,
    loc: "Victoria Island",
    initials: "SM",
    tone: "amber" as const,
  },
];

function Stars() {
  return (
    <div
      className="flex gap-0.5 text-mint"
      role="img"
      aria-label="5 out of 5 stars"
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} className="h-4 w-4" />
      ))}
    </div>
  );
}

export function Reviews() {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-[1440px] px-6 py-20 md:px-12 md:py-28">
      <Reveal className="mx-auto max-w-[680px] text-center">
        <p className="text-[15px] font-medium text-primary-600">
          {t.reviews.eyebrow}
        </p>
        <h2 className="mt-3 text-[clamp(2rem,4vw,3.4rem)] font-medium leading-[1.08] tracking-[-0.02em] text-ink">
          {t.reviews.heading}
        </h2>
      </Reveal>

      {/* Stats */}
      <Reveal
        delay={80}
        className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-[28px] border border-ink/10 bg-ink/10 md:grid-cols-4"
      >
        {statValues.map((value, i) => (
          <div key={value} className="bg-paper px-6 py-8 text-center">
            <p className="text-[clamp(1.8rem,3vw,2.6rem)] font-semibold tracking-tight text-ink">
              {value}
            </p>
            <p className="mt-1 text-[14px] leading-snug text-ink/60">
              {t.reviews.statLabels[i]}
            </p>
          </div>
        ))}
      </Reveal>

      {/* Review cards */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review, i) => (
          <Reveal
            key={review.name}
            delay={(i % 3) * 100}
            className="flex flex-col rounded-[28px] border-2 border-paper bg-white p-7"
          >
            <Stars />
            <p className="mt-4 flex-1 text-[17px] leading-relaxed text-ink/85">
              “{review.quote}”
            </p>
            <div className="mt-6 flex items-center gap-3">
              <span
                className={cn(
                  "grid h-11 w-11 place-items-center rounded-full text-[15px] font-semibold",
                  review.tone === "green"
                    ? "bg-primary-500/12 text-primary-600"
                    : "bg-secondary-500/20 text-secondary-700",
                )}
              >
                {review.initials}
              </span>
              <div>
                <p className="text-[15px] font-medium text-ink">
                  {review.name}
                </p>
                <p className="text-[14px] text-ink/55">
                  {t.reviews.roles[review.role]} · {review.loc}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

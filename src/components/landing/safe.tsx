"use client";

import Image from "next/image";
import { useI18n } from "@/lib/i18n";
import { Reveal } from "./reveal";

const images = [
  "/images/hecta-img-13.webp",
  "/images/hecta-img-4.webp",
  "/images/hecta-img-14.webp",
];

export function Safe() {
  const { t } = useI18n();
  const cards = t.safe.cards.map((card, i) => ({ ...card, img: images[i] }));
  return (
    <section className="mx-auto max-w-[1440px] px-6 py-20 md:px-12 md:py-28">
      <Reveal className="flex flex-col items-center text-center">
        <span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-white shadow-sm">
          <Image
            src="/assets/logo/hecta-logo-5.webp"
            alt="Hecta"
            width={48}
            height={42}
            className="h-9 w-auto"
          />
        </span>
        <h2 className="mt-6 text-[clamp(2rem,4vw,3.4rem)] font-medium leading-[1.08] tracking-[-0.02em] text-ink">
          {t.safe.heading}
        </h2>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {cards.map((card, i) => (
          <Reveal
            key={card.title}
            delay={i * 120}
            className="rounded-[40px] bg-white p-4"
          >
            <div className="relative aspect-square overflow-hidden rounded-[32px] bg-paper">
              <Image
                src={card.img}
                alt={card.title}
                fill
                sizes="(max-width: 768px) 100vw, 420px"
                className="object-cover"
              />
            </div>
            <div className="px-3 pb-3 pt-6">
              <h3 className="text-[clamp(1.4rem,2vw,1.9rem)] font-medium tracking-tight text-ink">
                {card.title}
              </h3>
              <p className="mt-3 text-[17px] leading-relaxed text-ink/80">
                {card.body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

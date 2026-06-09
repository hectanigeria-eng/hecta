"use client";

import Image from "next/image";
import { type Messages, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ArrowRight } from "./icons";

function Photo({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-[617/542] overflow-hidden rounded-[32px] bg-paper">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 100vw, 620px"
        className="object-cover"
      />
    </div>
  );
}

type FeatureKey = keyof Omit<Messages["features"], "learnMore">;

type Feature = {
  id: FeatureKey;
  alt: string;
  button?: boolean;
  imageSide: "left" | "right";
  src: string;
};

const features: Feature[] = [
  {
    id: "verified",
    src: "/images/hecta-img-8.webp",
    alt: "Verified homes on a Lagos estate street",
    button: true,
    imageSide: "left",
  },
  {
    id: "search",
    src: "/images/hecta-img-9.webp",
    alt: "A residential neighbourhood in Lagos at golden hour",
    button: true,
    imageSide: "right",
  },
  {
    id: "trust",
    src: "/images/hecta-img-7.webp",
    alt: "A woman receiving keys to her new home",
    button: true,
    imageSide: "left",
  },
  {
    id: "agreements",
    src: "/images/hecta-img-1.webp",
    alt: "Signing a tenancy agreement on a tablet",
    button: true,
    imageSide: "right",
  },
  {
    id: "demand",
    src: "/images/hecta-img-3.webp",
    alt: "A couple celebrating with keys to their new home",
    imageSide: "left",
  },
];

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const { t } = useI18n();
  const copy = t.features[feature.id];
  const text = (
    <div className="flex flex-col justify-center">
      <p className="text-[17px] font-medium text-ink">{copy.eyebrow}</p>
      <h3 className="mt-4 text-[clamp(1.9rem,3.4vw,3.35rem)] font-medium leading-[1.08] tracking-[-0.02em] text-ink">
        {copy.line1}
        <br />
        {copy.line2}
      </h3>
      <p className="mt-5 max-w-[470px] text-[17px] leading-relaxed text-ink/80">
        {copy.body}
      </p>
      {feature.button && (
        <button
          type="button"
          data-waitlist
          className="group mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-mint px-5 py-2.5 text-[15px] font-semibold text-ink transition-transform hover:scale-[1.03]"
        >
          {t.features.learnMore}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      )}
    </div>
  );

  return (
    <div
      className="sticky lg:top-(--card-top)"
      style={{ ["--card-top" as string]: `${96 + index * 18}px` }}
    >
      <div className="grid grid-cols-1 items-stretch gap-8 rounded-[40px] border-2 border-paper bg-white p-6 shadow-[0_24px_60px_-30px_rgba(5,53,53,0.25)] md:p-8 lg:grid-cols-2 lg:gap-12 lg:p-12">
        <div
          className={cn(
            feature.imageSide === "right" ? "lg:order-2" : "lg:order-1",
          )}
        >
          <Photo src={feature.src} alt={feature.alt} />
        </div>
        <div
          className={cn(
            feature.imageSide === "right" ? "lg:order-1" : "lg:order-2",
          )}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section className="mx-auto max-w-[1440px] px-6 py-20 md:px-12 md:py-28">
      <div className="flex flex-col gap-6">
        {features.map((feature, index) => (
          <FeatureCard key={feature.id} feature={feature} index={index} />
        ))}
      </div>
    </section>
  );
}

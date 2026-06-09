"use client";

import Image from "next/image";
import { type ComponentType, type SVGProps, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  ArrowDownTray,
  ArrowRight,
  ArrowUpRight,
  ChartLineUp,
  CreditCard,
  Minus,
  Plus,
} from "./icons";
import { Reveal } from "./reveal";

type ItemKey = "search" | "verify" | "apply" | "moveIn";

const items: { id: ItemKey; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { id: "search", icon: ArrowUpRight },
  { id: "verify", icon: ArrowDownTray },
  { id: "apply", icon: CreditCard },
  { id: "moveIn", icon: ChartLineUp },
];

export function DoMore() {
  const { t } = useI18n();
  const [open, setOpen] = useState<ItemKey>("search");

  return (
    <section className="mx-auto max-w-[1440px] px-6 py-20 md:px-12 md:py-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Reveal
          as="h2"
          className="max-w-[640px] text-[clamp(2rem,4vw,3.4rem)] font-medium leading-[1.08] tracking-[-0.02em] text-ink"
        >
          {t.doMore.heading}
        </Reveal>
        <button
          type="button"
          data-waitlist
          className="group inline-flex items-center gap-2 text-[15px] font-medium text-ink transition-colors hover:text-ink/70"
        >
          {t.doMore.browse}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Reveal className="relative min-h-[440px] overflow-hidden rounded-[16px] bg-white">
          <Image
            src="/images/hecta-img-2.webp"
            alt="A woman relaxing at home with a warm drink"
            fill
            sizes="(max-width: 1024px) 100vw, 640px"
            className="object-cover"
          />
        </Reveal>

        <Reveal delay={120} className="flex flex-col">
          {items.map((item) => {
            const isOpen = open === item.id;
            const Icon = item.icon;
            const copy = t.doMore[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setOpen(item.id)}
                className={cn(
                  "group w-full text-left transition-all",
                  isOpen
                    ? "rounded-[16px] bg-ink-2 p-6 text-paper"
                    : "border-b border-ink/10 px-1 py-6 text-ink",
                )}
              >
                <div className="flex items-center gap-4">
                  <Icon
                    className={cn(
                      "h-6 w-6 shrink-0",
                      isOpen ? "text-mint" : "text-ink",
                    )}
                  />
                  <span className="flex-1 text-[22px] font-medium tracking-tight">
                    {copy.label}
                  </span>
                  {isOpen ? (
                    <Minus className="h-5 w-5 text-paper" />
                  ) : (
                    <Plus className="h-5 w-5 text-ink/60 transition-colors group-hover:text-ink" />
                  )}
                </div>
                <div
                  className={cn(
                    "grid transition-all duration-300",
                    isOpen
                      ? "mt-3 grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0",
                  )}
                >
                  <p className="overflow-hidden text-[17px] leading-relaxed text-paper/85">
                    {copy.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}

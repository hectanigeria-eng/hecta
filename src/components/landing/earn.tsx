"use client";

import Image from "next/image";
import { useI18n } from "@/lib/i18n";
import { ArrowRight } from "./icons";
import { Reveal } from "./reveal";

function InfinityMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 12"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6.2 1.2C3.4 1.2 1.5 3.6 1.5 6s1.9 4.8 4.7 4.8c3.6 0 4.4-4.8 8-4.8 2.8 0 4.3 2.4 4.3 4.8m0-9.6c-3.6 0-4.4 4.8-8 4.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Earn() {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-[1440px] px-6 md:px-12">
      <Reveal className="relative overflow-hidden rounded-[40px] bg-linear-to-b from-[#0f1712] to-[#06140d]">
        {/* glow */}
        <div className="pointer-events-none absolute -right-10 bottom-0 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(228,166,72,0.5)_0%,rgba(120,84,24,0.22)_45%,transparent_70%)] blur-[40px]" />

        <div className="relative grid grid-cols-1 items-center gap-10 p-8 md:p-14 lg:grid-cols-2">
          <div className="max-w-[520px]">
            <InfinityMark className="h-5 w-10 text-mint" />
            <h2 className="mt-5 text-[clamp(2rem,4vw,3.4rem)] font-medium leading-[1.08] tracking-[-0.02em] text-white">
              {t.earn.line1}
              <br />
              {t.earn.line2}
            </h2>
            <p className="mt-5 max-w-[460px] text-[17px] leading-relaxed text-[#b7c0bf]">
              {t.earn.body}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                data-waitlist
                className="rounded-full bg-mint px-6 py-3 text-[15px] font-semibold text-ink transition-transform hover:scale-[1.03]"
              >
                {t.earn.listCta}
              </button>
              <a
                href="#how-it-works"
                className="group inline-flex items-center gap-2 px-2 text-[15px] font-medium text-white transition-colors hover:text-mint"
              >
                {t.earn.seeHow}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="relative aspect-[5/4] w-full max-w-[480px] overflow-hidden rounded-[28px] shadow-2xl ring-1 ring-white/10">
              <Image
                src="/images/hecta-img-15.webp"
                alt="A landlord closing a deal with a verified tenant"
                fill
                sizes="(max-width: 1024px) 100vw, 480px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

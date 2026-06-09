"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { ArrowRight } from "./icons";

const AGENCY_RATE = 0.25;
const LEGAL_RATE = 0.1;

const MIN = 200_000;
const MAX = 20_000_000;
const STEP = 50_000;

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-US")}`;

const short = (n: number) => {
  if (n >= 1_000_000)
    return `₦${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  return `₦${Math.round(n / 1000)}k`;
};

export function SavingsCalculator() {
  const { t } = useI18n();
  const [rent, setRent] = useState(1_000_000);

  const agencyFee = rent * AGENCY_RATE;
  const legalFee = rent * LEGAL_RATE;
  const saved = agencyFee + legalFee;

  return (
    <div className="rounded-[32px] bg-paper/95 p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)] backdrop-blur">
      <p className="text-center text-[15px] font-medium text-ink">
        {t.calc.title}
      </p>
      <p className="mt-1 text-center text-[15px] text-ink/70">{t.calc.sub}</p>

      {/* Annual rent input */}
      <div className="mt-5 rounded-[20px] bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="text-[15px] text-ink/70">{t.calc.annualRent}</p>
          <span className="text-[15px] text-ink/50">{t.calc.perYear}</span>
        </div>
        <p className="mt-1 text-[40px] font-medium leading-none tracking-tight text-ink">
          {naira(rent)}
        </p>
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={rent}
          onChange={(e) => setRent(Number(e.target.value))}
          aria-label={t.calc.annualRent}
          className="mt-4 w-full accent-mint"
        />
        <div className="mt-1 flex justify-between text-[12px] text-ink/45">
          <span>{short(MIN)}</span>
          <span>{short(MAX)}</span>
        </div>
      </div>

      {/* Savings breakdown */}
      <div className="mt-2.5 rounded-[20px] bg-white p-5">
        <div className="flex items-center justify-between text-[15px]">
          <span className="text-ink/70">{t.calc.agency}</span>
          <span className="text-ink/45 line-through">{naira(agencyFee)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[15px]">
          <span className="text-ink/70">{t.calc.legal}</span>
          <span className="text-ink/45 line-through">{naira(legalFee)}</span>
        </div>
        <div className="mt-3 flex items-end justify-between border-t border-ink/10 pt-3">
          <span className="text-[15px] font-medium text-ink">
            {t.calc.youSave}
          </span>
          <span className="text-[32px] font-semibold leading-none tracking-tight text-primary-600">
            {naira(saved)}
          </span>
        </div>
      </div>

      <button
        type="button"
        data-waitlist
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-mint py-3.5 text-[15px] font-semibold text-ink transition-transform hover:scale-[1.01]"
      >
        {t.calc.cta}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

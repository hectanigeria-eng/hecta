"use client";

import Image from "next/image";
import { LANGS, useI18n } from "@/lib/i18n";
import {
  ArrowRight,
  Facebook,
  Instagram,
  LinkedIn,
  Star,
  TikTok,
  XLogo,
  Youtube,
} from "./icons";

const columns = [
  {
    titleKey: "explore",
    links: [
      { key: "rentHome", href: "#features" },
      { key: "buyHome", href: "#features" },
      { key: "listProperty", href: "#for-landlords" },
      { key: "verifiedLandlords", href: "#security" },
    ],
  },
  {
    titleKey: "discover",
    links: [
      { key: "howItWorks", href: "#how-it-works" },
      { key: "whyHecta", href: "#benefits" },
      { key: "reviews", href: "#reviews" },
      { key: "getTheApp", href: "#get-started" },
    ],
  },
] as const;

const socials = [
  { Icon: Facebook, label: "Facebook", href: "https://facebook.com" },
  { Icon: XLogo, label: "X", href: "https://x.com" },
  { Icon: Youtube, label: "YouTube", href: "https://youtube.com" },
  { Icon: LinkedIn, label: "LinkedIn", href: "https://linkedin.com" },
  { Icon: Instagram, label: "Instagram", href: "https://instagram.com" },
  { Icon: TikTok, label: "TikTok", href: "https://tiktok.com" },
];

export function Footer() {
  const { t, lang } = useI18n();
  const langShort = LANGS.find((l) => l.code === lang)?.short ?? "EN";
  return (
    <footer
      id="site-footer"
      className="relative isolate mt-8 scroll-mt-0 overflow-hidden rounded-t-[40px] bg-deep text-paper"
    >
      <div className="mx-auto max-w-[1440px] px-6 pt-16 md:px-12 md:pt-20">
        {/* Top: brand + newsletter | link columns */}
        <div className="grid gap-12 lg:grid-cols-[1.05fr_1.35fr]">
          <div>
            <Image
              src="/assets/logo/hecta-logo-2.webp"
              alt="Hecta"
              width={200}
              height={75}
              className="h-8 w-auto"
            />
            <p className="mt-5 max-w-sm text-[18px] leading-relaxed text-paper/70">
              {t.footer.tagline}
            </p>

            {/* Newsletter */}
            <div className="mt-8 max-w-md">
              <p className="text-[15px] font-medium text-paper">
                {t.footer.newsletter}
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] p-1.5 pl-5 focus-within:border-mint/60">
                <input
                  type="email"
                  placeholder={t.footer.emailPlaceholder}
                  aria-label={t.footer.emailPlaceholder}
                  className="min-w-0 flex-1 bg-transparent text-[15px] text-paper outline-none placeholder:text-paper/45"
                />
                <button
                  type="button"
                  data-waitlist
                  className="flex shrink-0 items-center gap-1.5 rounded-full bg-mint px-5 py-2.5 text-[14px] font-semibold text-ink transition-transform hover:scale-[1.03]"
                >
                  {t.footer.subscribe}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* App download */}
            <div className="mt-8 flex items-center gap-4">
              <div className="grid shrink-0 place-items-center rounded-2xl bg-white p-1.5">
                <Image
                  src="/figma/qr.png"
                  alt={t.footer.getApp}
                  width={92}
                  height={92}
                  className="rounded-xl"
                />
              </div>
              <div>
                <p className="text-[15px] font-medium text-paper">
                  {t.footer.getApp}
                </p>
                <p className="mt-0.5 text-[14px] text-paper/55">
                  {t.footer.scan}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-[13px] text-paper/70">
                  <Star className="h-3.5 w-3.5 text-mint" />
                  4.8 on Google Play
                  <span className="text-paper/30">·</span>
                  <Star className="h-3.5 w-3.5 text-mint" />
                  4.7 on App Store
                </div>
              </div>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:gap-x-12 lg:justify-items-end">
            {columns.map((col) => (
              <div key={col.titleKey}>
                <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-mint">
                  {t.footer[col.titleKey]}
                </p>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.key}>
                      <a
                        href={link.href}
                        className="text-[15px] text-paper/65 transition-colors hover:text-paper"
                      >
                        {t.footer.links[link.key]}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col gap-6 border-t border-white/10 py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            {socials.map(({ Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-paper/80 transition-colors hover:border-mint/50 hover:text-mint"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
          <span className="text-[14px] text-paper/45">
            {langShort} · Lagos, Nigeria
          </span>
        </div>

        {/* Oversized wordmark signature */}
        <div
          aria-hidden="true"
          className="font-heading select-none text-[clamp(4rem,17vw,15rem)] font-bold leading-[0.78] tracking-tight text-white/[0.05]"
        >
          Hecta
        </div>

        {/* Legal */}
        <p className="border-t border-white/10 py-8 text-[13px] leading-6 text-paper/45">
          Copyright © 2025 HECTA. All rights reserved. Hecta is a property
          listings and rentals marketplace operating in Lagos and across
          Nigeria. Hecta verifies landlord identity and ownership documents and
          reviews listings before they go live, but does not own, manage, or
          guarantee any property listed on the platform and is not a party to
          any tenancy or sale agreement between users. Verification reduces risk
          but does not eliminate it — always inspect a property and confirm
          documents before making any payment. Tenancy agreements generated on
          Hecta are provided as templates for convenience and do not constitute
          legal advice; please seek independent counsel where required. All
          trademarks, property names, and images belong to their respective
          owners.
        </p>
      </div>
    </footer>
  );
}

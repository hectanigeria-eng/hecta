"use client";

import Image from "next/image";
import { DropdownMenu } from "radix-ui";
import { LANGS, useI18n } from "@/lib/i18n";
import { Check, Globe } from "./icons";

export function Header() {
  const { t, lang, setLang } = useI18n();

  const navItems = [
    { label: t.nav.rent, href: "#features", active: true },
    { label: t.nav.buy, href: "#features", active: false },
    { label: t.nav.list, href: "#for-landlords", active: false },
  ];

  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-[93px] max-w-[1440px] items-center gap-10 px-6 text-white md:px-12">
        <a href="#top" aria-label="Hecta home" className="flex items-center">
          <Image
            src="/assets/logo/hecta-logo-2.webp"
            alt="Hecta"
            width={160}
            height={60}
            priority
            className="h-7 w-auto"
          />
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="relative flex items-center rounded-full px-3 py-2 text-[15px] font-medium text-white/90 transition-colors hover:text-white"
            >
              {item.label}
              {item.active && (
                <span className="absolute -bottom-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white" />
              )}
            </a>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-6 lg:flex">
          <a
            href="#how-it-works"
            className="text-[15px] font-medium text-white/90 transition-colors hover:text-white"
          >
            {t.nav.howItWorks}
          </a>
          <button
            type="button"
            data-waitlist
            className="rounded-full bg-mint px-5 py-2 text-[15px] font-semibold text-ink transition-transform hover:scale-[1.03]"
          >
            {t.nav.getStarted}
          </button>
          <LanguageMenu current={current.short} lang={lang} setLang={setLang} />
        </div>

        <div className="ml-auto flex items-center gap-3 lg:hidden">
          <LanguageMenu current={current.short} lang={lang} setLang={setLang} />
          <button
            type="button"
            data-waitlist
            className="rounded-full bg-mint px-5 py-2 text-[15px] font-semibold text-ink"
          >
            {t.nav.getStarted}
          </button>
        </div>
      </div>
    </header>
  );
}

function LanguageMenu({
  current,
  lang,
  setLang,
}: {
  current: string;
  lang: string;
  setLang: (code: (typeof LANGS)[number]["code"]) => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Change language"
          className="flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-[14px] font-medium text-white/90 transition-colors hover:border-white/40 hover:text-white focus-visible:outline-none"
        >
          <Globe className="h-4 w-4" />
          {current}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-[110] min-w-[180px] rounded-2xl border border-ink/10 bg-white p-1.5 text-ink shadow-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          {LANGS.map((l) => (
            <DropdownMenu.Item
              key={l.code}
              onSelect={() => setLang(l.code)}
              className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-[15px] outline-none transition-colors data-[highlighted]:bg-paper"
            >
              {l.label}
              {lang === l.code && (
                <Check className="h-4 w-4 text-primary-600" />
              )}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

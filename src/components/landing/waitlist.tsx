"use client";

import { Dialog } from "radix-ui";
import { type FormEvent, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { ArrowRight, Check, X } from "./icons";

const fieldClass =
  "w-full rounded-2xl border border-ink/10 bg-paper-2 px-4 py-3.5 text-[15px] text-ink outline-none transition-colors placeholder:text-ink/45 focus:border-mint focus:ring-2 focus:ring-mint/30";

export function Waitlist() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const textFields = [
    {
      name: "firstName",
      placeholder: t.waitlist.firstName,
      type: "text",
      autoComplete: "given-name",
    },
    {
      name: "lastName",
      placeholder: t.waitlist.lastName,
      type: "text",
      autoComplete: "family-name",
    },
    {
      name: "email",
      placeholder: t.waitlist.email,
      type: "email",
      autoComplete: "email",
    },
    {
      name: "location",
      placeholder: t.waitlist.location,
      type: "text",
      autoComplete: "off",
    },
  ];

  // Any element with a [data-waitlist] attribute opens the modal.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const trigger = (event.target as HTMLElement | null)?.closest(
        "[data-waitlist]",
      );
      if (!trigger) return;
      event.preventDefault();
      setOpen(true);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      // reset after the close animation
      setTimeout(() => setSubmitted(false), 200);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-mint px-6 py-3.5 text-[15px] font-semibold text-ink shadow-[0_12px_30px_-8px_rgba(5,53,53,0.5)] transition-transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 md:bottom-8 md:right-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ink/40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-ink" />
          </span>
          {t.waitlist.floating}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-deep-2/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[101] flex max-h-[92vh] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-[28px] bg-white p-7 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 md:p-8">
          <Dialog.Close className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full text-ink/60 transition-colors hover:bg-paper hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/40">
            <X className="h-5 w-5" />
          </Dialog.Close>

          {submitted ? (
            <div className="flex flex-col items-center py-8 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-primary-500/12 text-primary-600">
                <Check className="h-8 w-8" />
              </span>
              <Dialog.Title className="mt-5 text-[26px] font-medium tracking-tight text-ink">
                {t.waitlist.successTitle}
              </Dialog.Title>
              <Dialog.Description className="mt-2 max-w-xs text-[16px] leading-relaxed text-ink/70">
                {t.waitlist.successBody}
              </Dialog.Description>
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="mt-7 rounded-full bg-mint px-7 py-3 text-[15px] font-semibold text-ink transition-transform hover:scale-[1.03]"
              >
                {t.waitlist.done}
              </button>
            </div>
          ) : (
            <>
              <Dialog.Title className="pr-10 text-[26px] font-medium leading-tight tracking-tight text-ink">
                {t.waitlist.title}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-[16px] leading-relaxed text-ink/65">
                {t.waitlist.desc}
              </Dialog.Description>

              <form
                onSubmit={handleSubmit}
                className="mt-6 flex flex-col gap-3"
              >
                {textFields.map((field) => (
                  <div key={field.name}>
                    <label htmlFor={field.name} className="sr-only">
                      {field.placeholder}
                    </label>
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      placeholder={field.placeholder}
                      autoComplete={field.autoComplete}
                      required
                      className={fieldClass}
                    />
                  </div>
                ))}

                <div>
                  <label htmlFor="budget" className="sr-only">
                    {t.waitlist.budget}
                  </label>
                  <select
                    id="budget"
                    name="budget"
                    required
                    defaultValue=""
                    className={`${fieldClass} appearance-none`}
                  >
                    <option value="" disabled>
                      {t.waitlist.budget}
                    </option>
                    {t.waitlist.budgetOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="timeline" className="sr-only">
                    {t.waitlist.timeline}
                  </label>
                  <select
                    id="timeline"
                    name="timeline"
                    required
                    defaultValue=""
                    className={`${fieldClass} appearance-none`}
                  >
                    <option value="" disabled>
                      {t.waitlist.timeline}
                    </option>
                    {t.waitlist.timelineOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="mt-2 flex items-center justify-center gap-2 rounded-full bg-mint py-4 text-[16px] font-semibold text-ink transition-transform hover:scale-[1.01]"
                >
                  {t.waitlist.submit}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

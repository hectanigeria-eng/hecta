"use client";

import {
  CameraIcon,
  CaretLeftIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useHectaStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type WizardStep = 1 | 2 | 3 | 4;
type VerificationPath = "vnin" | "otp";
type OtpStage = "phone" | "code";
type LivenessStatus = "idle" | "capturing" | "done";

const VNIN_LENGTH = 16;
const OTP_LENGTH = 6;
const PHONE_MIN_DIGITS = 7;
const LIVENESS_DURATION_MS = 1200;
const LIVENESS_TICK_MS = 40;
const LIVENESS_TOTAL_TICKS = LIVENESS_DURATION_MS / LIVENESS_TICK_MS;
const REDIRECT_DELAY_MS = 1500;

const STEP_LABELS: readonly string[] = [
  "Choose method",
  "Verify identity",
  "Liveness check",
  "Done",
];

const vninSchema = z.string().length(VNIN_LENGTH);
const otpDigitSchema = z.string().regex(/^[0-9]$/);
const phoneSchema = z
  .string()
  .refine((value) => value.replace(/\D/g, "").length >= PHONE_MIN_DIGITS, {
    message: "Enter a valid phone number",
  });

interface PathOption {
  value: VerificationPath;
  title: string;
  description: string;
}

const PATH_OPTIONS: readonly PathOption[] = [
  {
    value: "vnin",
    title: "vNIN + selfie",
    description:
      "Verify with your virtual National ID number, then a quick selfie.",
  },
  {
    value: "otp",
    title: "Selfie + OTP",
    description:
      "Confirm your phone number with a one-time code, then a selfie.",
  },
];

export interface IdentityWizardProps {
  /** Already validated same-origin path (see `parseNextPath`) to return to. */
  nextPath: string;
}

/**
 * The mock identity wizard behind `/verify`. Every path always succeeds —
 * this is a demo of the *shape* of KYC, not a real integration — but each
 * step still validates its own input through Zod so malformed values can't
 * silently sail through.
 */
export function IdentityWizard({ nextPath }: IdentityWizardProps) {
  const router = useRouter();
  const completeIdentityVerification = useHectaStore(
    (state) => state.completeIdentityVerification,
  );

  const [step, setStep] = useState<WizardStep>(1);
  const [path, setPath] = useState<VerificationPath | null>(null);

  const [vnin, setVnin] = useState("");

  const [otpStage, setOtpStage] = useState<OtpStage>("phone");
  const [phone, setPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(
    Array.from({ length: OTP_LENGTH }, () => ""),
  );
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [livenessStatus, setLivenessStatus] = useState<LivenessStatus>("idle");
  const [livenessProgress, setLivenessProgress] = useState(0);
  const livenessIntervalRef = useRef<number | undefined>(undefined);

  const hasCompletedRef = useRef(false);

  const vninIdBase = useId();
  const phoneIdBase = useId();
  const otpIdBase = useId();
  const otpBoxIds = useMemo(
    () => Array.from({ length: OTP_LENGTH }, (_, i) => `${otpIdBase}-${i}`),
    [otpIdBase],
  );

  // Clears the liveness "capture" interval on unmount so a mid-animation
  // navigation away from the page never leaves a dangling timer.
  useEffect(() => {
    return () => {
      if (livenessIntervalRef.current !== undefined) {
        window.clearInterval(livenessIntervalRef.current);
      }
    };
  }, []);

  // Marks the active user identity-verified exactly once, the moment the
  // success step is reached — guarded by a ref (not just the `step === 4`
  // check) so React strict-mode's double-invoked effects can't call it twice.
  useEffect(() => {
    if (step === 4 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      completeIdentityVerification();
    }
  }, [step, completeIdentityVerification]);

  // Auto-redirects back to `nextPath` a beat after success, but a visible
  // button (rendered in the step-4 markup below) lets an impatient user skip
  // the wait instead of being forced to sit through it.
  useEffect(() => {
    if (step !== 4) return;
    const timeout = window.setTimeout(() => {
      router.replace(nextPath);
    }, REDIRECT_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [step, nextPath, router]);

  function handleOtpChange(index: number, rawValue: string) {
    const digits = rawValue.replace(/\D/g, "");
    if (digits.length === 0) {
      setOtpDigits((prev) =>
        prev.map((digit, i) => (i === index ? "" : digit)),
      );
      return;
    }
    setOtpDigits((prev) => {
      const next = [...prev];
      let cursor = index;
      for (const char of digits) {
        if (cursor >= OTP_LENGTH) break;
        next[cursor] = char;
        cursor += 1;
      }
      return next;
    });
    const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
    otpRefs.current[nextIndex]?.focus();
  }

  function handleOtpKeyDown(
    index: number,
    event: ReactKeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace" && otpDigits[index] === "" && index > 0) {
      otpRefs.current[index - 1]?.focus();
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      otpRefs.current[index - 1]?.focus();
      return;
    }
    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleSimulateCapture() {
    if (livenessIntervalRef.current !== undefined) {
      window.clearInterval(livenessIntervalRef.current);
    }
    setLivenessStatus("capturing");
    setLivenessProgress(0);
    let tick = 0;
    livenessIntervalRef.current = window.setInterval(() => {
      tick += 1;
      setLivenessProgress(Math.min(100, (tick / LIVENESS_TOTAL_TICKS) * 100));
      if (tick >= LIVENESS_TOTAL_TICKS) {
        if (livenessIntervalRef.current !== undefined) {
          window.clearInterval(livenessIntervalRef.current);
          livenessIntervalRef.current = undefined;
        }
        setLivenessStatus("done");
      }
    }, LIVENESS_TICK_MS);
  }

  const canContinue = (() => {
    if (step === 1) return path !== null;
    if (step === 2) {
      if (path === "vnin") return vninSchema.safeParse(vnin).success;
      if (otpStage === "phone") return phoneSchema.safeParse(phone).success;
      return otpDigits.every(
        (digit) => otpDigitSchema.safeParse(digit).success,
      );
    }
    if (step === 3) return livenessStatus === "done";
    return true;
  })();

  function handleContinue() {
    if (step === 1) {
      if (path === null) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      if (path === "vnin") {
        setStep(3);
        return;
      }
      if (otpStage === "phone") {
        setOtpStage("code");
        return;
      }
      setStep(3);
      return;
    }
    if (step === 3) {
      setStep(4);
    }
  }

  function handleBack() {
    if (step === 2) {
      if (path === "otp" && otpStage === "code") {
        setOtpStage("phone");
        return;
      }
      setStep(1);
      return;
    }
    if (step === 3) {
      setStep(2);
    }
  }

  const continueLabel =
    step === 2 && path === "otp" && otpStage === "phone"
      ? "Send code"
      : "Continue";

  return (
    <div className="flex flex-col gap-6 rounded-3xl bg-card p-6 ring-1 ring-border sm:p-8">
      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-2xl font-bold text-ink">
          Verify your identity
        </h1>
        <Progress
          value={(step / STEP_LABELS.length) * 100}
          aria-hidden
          className="h-1"
        />
        <p
          aria-live="polite"
          aria-atomic="true"
          className="text-xs font-semibold tracking-wide text-primary-700 uppercase"
        >
          Step {step} of {STEP_LABELS.length}: {STEP_LABELS[step - 1]}
        </p>
      </header>

      {step === 1 && (
        <RadioGroup
          value={path ?? ""}
          onValueChange={(value) => setPath(value as VerificationPath)}
          aria-label="Choose a verification method"
        >
          {PATH_OPTIONS.map((option) => {
            const optionId = `verify-path-${option.value}`;
            const isActive = path === option.value;
            return (
              <label
                key={option.value}
                htmlFor={optionId}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors",
                  isActive
                    ? "border-primary-500 bg-primary-50"
                    : "border-border bg-card hover:bg-paper-2",
                )}
              >
                <RadioGroupItem
                  value={option.value}
                  id={optionId}
                  className="mt-0.5"
                />
                <span className="flex flex-col gap-0.5 normal-case">
                  <span className="text-sm font-semibold text-ink">
                    {option.title}
                  </span>
                  <span className="text-xs text-muted-ink">
                    {option.description}
                  </span>
                </span>
              </label>
            );
          })}
        </RadioGroup>
      )}

      {step === 2 && path === "vnin" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={vninIdBase}>vNIN</Label>
          <Input
            id={vninIdBase}
            value={vnin}
            onChange={(event) => setVnin(event.target.value)}
            maxLength={VNIN_LENGTH}
            autoComplete="off"
            placeholder="16-character vNIN"
            aria-describedby={`${vninIdBase}-hint`}
            className="font-mono tracking-widest"
          />
          <p id={`${vninIdBase}-hint`} className="text-xs text-muted-ink">
            Enter all {VNIN_LENGTH} characters of your virtual NIN (
            {vnin.length}/{VNIN_LENGTH}).
          </p>
        </div>
      )}

      {step === 2 && path === "otp" && otpStage === "phone" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={phoneIdBase}>Phone number</Label>
          <Input
            id={phoneIdBase}
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            autoComplete="tel"
            placeholder="080X XXX XXXX"
          />
        </div>
      )}

      {step === 2 && path === "otp" && otpStage === "code" && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-xs font-semibold tracking-wide text-ink uppercase">
            Enter the 6-digit code
          </legend>
          <div className="flex gap-2">
            {otpBoxIds.map((boxId, index) => (
              <Input
                key={boxId}
                ref={(el) => {
                  otpRefs.current[index] = el;
                }}
                value={otpDigits[index]}
                onChange={(event) => handleOtpChange(index, event.target.value)}
                onKeyDown={(event) => handleOtpKeyDown(index, event)}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
                className="h-12 w-12 text-center font-mono text-lg"
              />
            ))}
          </div>
          <p className="text-xs text-muted-ink">
            We sent a 6-digit code to {phone || "your phone"}. This is a demo —
            any 6 digits will do.
          </p>
        </fieldset>
      )}

      {step === 3 && (
        <div className="flex flex-col items-center gap-4 py-2">
          <div
            aria-hidden
            className={cn(
              "flex size-36 items-center justify-center rounded-full border-2 border-dashed",
              livenessStatus === "done"
                ? "border-primary-500"
                : "border-border",
            )}
          >
            {livenessStatus === "done" ? (
              <CheckCircleIcon
                weight="fill"
                className="size-16 text-primary-600"
              />
            ) : (
              <CameraIcon weight="duotone" className="size-14 text-muted-ink" />
            )}
          </div>

          {livenessStatus === "capturing" && (
            <Progress
              value={livenessProgress}
              aria-label="Liveness capture progress"
              className="w-full max-w-56"
            />
          )}

          <Button
            type="button"
            onClick={handleSimulateCapture}
            disabled={livenessStatus === "capturing"}
            className="h-11 rounded-full px-6 text-sm font-semibold tracking-normal normal-case"
          >
            {livenessStatus === "done"
              ? "Capture again"
              : livenessStatus === "capturing"
                ? "Capturing…"
                : "Simulate capture"}
          </Button>

          <p aria-live="polite" className="text-sm text-primary-700">
            {livenessStatus === "done" ? "Liveness check passed." : ""}
          </p>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div
            aria-hidden
            className="flex size-16 items-center justify-center rounded-full bg-primary-100"
          >
            <CheckCircleIcon
              weight="fill"
              className="size-9 text-primary-600"
            />
          </div>
          <h2 className="font-heading text-xl font-bold text-ink">
            You&apos;re verified
          </h2>
          <p className="text-sm text-muted-ink">
            You can now save homes, apply, and message landlords. Taking you
            back…
          </p>
          <Button
            type="button"
            onClick={() => router.replace(nextPath)}
            className="mt-2 h-11 rounded-full px-6 text-sm font-semibold tracking-normal normal-case"
          >
            Continue now
          </Button>
        </div>
      )}

      {step < 4 && (
        <div className="flex items-center justify-between gap-3">
          {step > 1 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              className="h-11 gap-1 rounded-full px-4 text-sm font-semibold tracking-normal text-muted-ink normal-case"
            >
              <CaretLeftIcon className="size-4" />
              Back
            </Button>
          ) : (
            <span />
          )}
          <Button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className="h-11 rounded-full px-6 text-sm font-semibold tracking-normal normal-case"
          >
            {continueLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

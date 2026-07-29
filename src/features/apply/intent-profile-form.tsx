"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useHectaStore } from "@/lib/store";
import type { IntentProfile, PaymentPlan, Timeline } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TimelineOption {
  value: Timeline;
  label: string;
  description: string;
}

const TIMELINE_OPTIONS: readonly TimelineOption[] = [
  {
    value: "immediate",
    label: "Immediate",
    description: "Ready to move right away",
  },
  {
    value: "within_1_month",
    label: "Within 1 month",
    description: "Moving in the next few weeks",
  },
  {
    value: "1_3_months",
    label: "1–3 months",
    description: "Planning ahead for a home",
  },
  {
    value: "exploring",
    label: "Just exploring",
    description: "No fixed move-in date yet",
  },
];

interface PaymentPlanOption {
  value: PaymentPlan;
  label: string;
}

const PAYMENT_PLAN_OPTIONS: readonly PaymentPlanOption[] = [
  { value: "full", label: "Full payment" },
  { value: "mortgage", label: "Mortgage" },
  { value: "instalments", label: "Instalments" },
];

// Budget fields are kept as strings on the form (matching the raw <input>
// value) and only converted to numbers on submit — this keeps the RHF field
// type and the Zod schema's input/output type identical, which is what lets
// `zodResolver` infer cleanly without a separate input/output generic.
interface IntentProfileFormValues {
  timeline: Timeline;
  paymentPlan: PaymentPlan;
  budgetMin: string;
  budgetMax: string;
}

const intentProfileSchema = z
  .object({
    timeline: z.enum([
      "immediate",
      "within_1_month",
      "1_3_months",
      "exploring",
    ]),
    paymentPlan: z.enum(["full", "mortgage", "instalments"]),
    budgetMin: z
      .string()
      .min(1, "Enter a minimum budget")
      .refine(
        (value) => Number(value) > 0,
        "Enter a minimum budget above zero",
      ),
    budgetMax: z
      .string()
      .min(1, "Enter a maximum budget")
      .refine(
        (value) => Number(value) > 0,
        "Enter a maximum budget above zero",
      ),
  })
  .refine((data) => Number(data.budgetMax) >= Number(data.budgetMin), {
    message: "Maximum budget must be at least the minimum budget",
    path: ["budgetMax"],
  });

interface IntentProfileFormProps {
  /** Pre-fills the form when the seeker is editing an existing profile. */
  defaultValues?: IntentProfile;
  /** Called after the profile has been persisted via `setIntentProfile`. */
  onSaved: (profile: IntentProfile) => void;
}

/**
 * Collects the seeker's move timeline, payment plan and budget range — the
 * signal a landlord uses to triage their inbox. Cheap for the seeker (under
 * a minute), so every field is a tap or a single number, not free text.
 */
export function IntentProfileForm({
  defaultValues,
  onSaved,
}: IntentProfileFormProps) {
  const setIntentProfile = useHectaStore((state) => state.setIntentProfile);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IntentProfileFormValues>({
    resolver: zodResolver(intentProfileSchema),
    defaultValues: {
      timeline: defaultValues?.timeline ?? "within_1_month",
      paymentPlan: defaultValues?.paymentPlan ?? "full",
      budgetMin:
        defaultValues?.budgetMin !== undefined
          ? String(defaultValues.budgetMin)
          : "",
      budgetMax:
        defaultValues?.budgetMax !== undefined
          ? String(defaultValues.budgetMax)
          : "",
    },
  });

  function onSubmit(values: IntentProfileFormValues) {
    const profile: IntentProfile = {
      timeline: values.timeline,
      paymentPlan: values.paymentPlan,
      budgetMin: Number(values.budgetMin),
      budgetMax: Number(values.budgetMax),
    };
    setIntentProfile(profile);
    onSaved(profile);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-6"
    >
      <Controller
        control={control}
        name="timeline"
        render={({ field }) => (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs font-semibold tracking-wide text-ink uppercase">
              When are you looking to move?
            </legend>
            <RadioGroup
              value={field.value}
              // Safe: every value RadioGroupItem can emit here comes from
              // TIMELINE_OPTIONS, which enumerates exactly the Timeline union.
              onValueChange={(value) => field.onChange(value as Timeline)}
            >
              {TIMELINE_OPTIONS.map((option) => {
                const optionId = `intent-timeline-${option.value}`;
                const isActive = field.value === option.value;
                return (
                  <label
                    key={option.value}
                    htmlFor={optionId}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors",
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
                        {option.label}
                      </span>
                      <span className="text-xs text-muted-ink">
                        {option.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </RadioGroup>
          </fieldset>
        )}
      />

      <Controller
        control={control}
        name="paymentPlan"
        render={({ field }) => (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs font-semibold tracking-wide text-ink uppercase">
              How will you pay?
            </legend>
            <RadioGroup
              value={field.value}
              // Safe: every value here comes from PAYMENT_PLAN_OPTIONS, which
              // enumerates exactly the PaymentPlan union.
              onValueChange={(value) => field.onChange(value as PaymentPlan)}
              className="grid-cols-3"
            >
              {PAYMENT_PLAN_OPTIONS.map((option) => {
                const optionId = `intent-payment-${option.value}`;
                const isActive = field.value === option.value;
                return (
                  <label
                    key={option.value}
                    htmlFor={optionId}
                    className={cn(
                      "flex min-h-11 cursor-pointer flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-colors",
                      isActive
                        ? "border-primary-500 bg-primary-50"
                        : "border-border bg-card hover:bg-paper-2",
                    )}
                  >
                    <RadioGroupItem value={option.value} id={optionId} />
                    <span className="text-xs font-semibold text-ink normal-case">
                      {option.label}
                    </span>
                  </label>
                );
              })}
            </RadioGroup>
          </fieldset>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="intent-budget-min">Budget min (₦)</Label>
          <Input
            id="intent-budget-min"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            placeholder="1,500,000"
            aria-invalid={errors.budgetMin !== undefined}
            aria-describedby={
              errors.budgetMin !== undefined
                ? "intent-budget-min-error"
                : undefined
            }
            {...register("budgetMin")}
          />
          {errors.budgetMin !== undefined && (
            <p
              id="intent-budget-min-error"
              className="text-xs text-destructive"
            >
              {errors.budgetMin.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="intent-budget-max">Budget max (₦)</Label>
          <Input
            id="intent-budget-max"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            placeholder="4,000,000"
            aria-invalid={errors.budgetMax !== undefined}
            aria-describedby={
              errors.budgetMax !== undefined
                ? "intent-budget-max-error"
                : undefined
            }
            {...register("budgetMax")}
          />
          {errors.budgetMax !== undefined && (
            <p
              id="intent-budget-max-error"
              className="text-xs text-destructive"
            >
              {errors.budgetMax.message}
            </p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        className="h-11 w-full rounded-full text-sm font-semibold tracking-normal normal-case"
      >
        Save profile
      </Button>
    </form>
  );
}

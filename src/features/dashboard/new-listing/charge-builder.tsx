"use client";

import { PlusIcon, ShieldCheckIcon, TrashIcon } from "@phosphor-icons/react";
import { useId } from "react";
import {
  type Control,
  Controller,
  type FieldErrors,
  type UseFormRegister,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatNaira } from "@/lib/format";
import { FieldError } from "./field-error";
import {
  CHARGE_LABEL_MAX_CHARS,
  type CostsValues,
  draftMoveInTotal,
  draftRefundableTotal,
  MAX_OTHER_CHARGES,
} from "./steps";

interface ChargePreset {
  label: string;
  rate: number;
  refundable: boolean;
  hint: string;
}

// The four charges nearly every Nigerian listing carries, as a share of the
// asking price — one tap each instead of three fields typed by hand.
const CHARGE_PRESETS: readonly ChargePreset[] = [
  {
    label: "Agency fee",
    rate: 0.1,
    refundable: false,
    hint: "Usually 10% of the rent",
  },
  {
    label: "Legal fee",
    rate: 0.05,
    refundable: false,
    hint: "Usually 5% of the rent",
  },
  {
    label: "Caution deposit",
    rate: 0.1,
    refundable: true,
    hint: "Refunded when the tenant leaves",
  },
  {
    label: "Service charge",
    rate: 0.1,
    refundable: false,
    hint: "Estate security, waste, common areas",
  },
];

interface ChargeBuilderProps {
  control: Control<CostsValues>;
  register: UseFormRegister<CostsValues>;
  errors: FieldErrors<CostsValues>;
}

/**
 * The disclosure surface: every naira a tenant pays before they get the keys,
 * itemised. Presets do the arithmetic off the asking price so a landlord who
 * would otherwise write "agency fee applies" ends up publishing a real figure,
 * and the running total shows them exactly what a seeker will see.
 */
export function ChargeBuilder({
  control,
  register,
  errors,
}: ChargeBuilderProps) {
  const fieldIdBase = useId();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "otherCharges",
  });

  const price = useWatch({ control, name: "price" }) ?? "";
  const charges = useWatch({ control, name: "otherCharges" }) ?? [];

  const priceValue = Number(price);
  const hasPrice =
    price.trim() !== "" && Number.isFinite(priceValue) && priceValue > 0;
  const usedLabels = new Set(
    charges.map((charge) => charge.label.trim().toLowerCase()),
  );
  const atCapacity = fields.length >= MAX_OTHER_CHARGES;

  const total = draftMoveInTotal({ price, otherCharges: charges });
  const refundable = draftRefundableTotal({ price, otherCharges: charges });

  function addPreset(preset: ChargePreset) {
    append({
      label: preset.label,
      amount: String(Math.round(priceValue * preset.rate)),
      refundable: preset.refundable,
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-3">
        <legend className="text-xs font-semibold tracking-wide text-ink uppercase">
          Quick add
        </legend>
        <p className="text-xs text-muted-ink">
          {hasPrice
            ? "One tap adds the charge with the usual amount worked out for you — edit it if yours differs."
            : "Enter your asking price above and we will work these out for you."}
        </p>
        <div className="flex flex-wrap gap-2">
          {CHARGE_PRESETS.map((preset) => {
            const alreadyAdded = usedLabels.has(preset.label.toLowerCase());
            const disabled = !hasPrice || alreadyAdded || atCapacity;
            return (
              <Button
                key={preset.label}
                type="button"
                variant="outline"
                onClick={() => addPreset(preset)}
                disabled={disabled}
                title={
                  alreadyAdded
                    ? `${preset.label} is already on the list`
                    : preset.hint
                }
                className="h-11 rounded-full px-4 text-xs font-semibold tracking-normal normal-case"
              >
                <PlusIcon weight="bold" aria-hidden className="size-3.5" />
                {preset.label}
                {hasPrice && (
                  <span className="text-muted-ink">
                    {formatNaira(Math.round(priceValue * preset.rate))}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </fieldset>

      <ul className="flex list-none flex-col gap-4 p-0">
        {fields.map((field, index) => {
          const labelId = `${fieldIdBase}-label-${field.id}`;
          const amountId = `${fieldIdBase}-amount-${field.id}`;
          const refundableId = `${fieldIdBase}-refundable-${field.id}`;
          const rowErrors = errors.otherCharges?.[index];
          const labelError = rowErrors?.label?.message;
          const amountError = rowErrors?.amount?.message;

          return (
            <li
              key={field.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-paper-2 p-4"
            >
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,10rem)]">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={labelId}>What is the charge for?</Label>
                  <Input
                    id={labelId}
                    placeholder="Agency fee"
                    maxLength={CHARGE_LABEL_MAX_CHARS}
                    aria-invalid={labelError !== undefined}
                    aria-describedby={
                      labelError === undefined ? undefined : `${labelId}-error`
                    }
                    {...register(`otherCharges.${index}.label`)}
                  />
                  <FieldError id={`${labelId}-error`} message={labelError} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={amountId}>Amount (₦)</Label>
                  <Input
                    id={amountId}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    placeholder="650000"
                    aria-invalid={amountError !== undefined}
                    aria-describedby={
                      amountError === undefined
                        ? undefined
                        : `${amountId}-error`
                    }
                    {...register(`otherCharges.${index}.amount`)}
                  />
                  <FieldError id={`${amountId}-error`} message={amountError} />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <Controller
                  control={control}
                  name={`otherCharges.${index}.refundable`}
                  render={({ field: refundableField }) => (
                    <label
                      htmlFor={refundableId}
                      className="flex min-h-11 cursor-pointer items-center gap-3"
                    >
                      <Switch
                        id={refundableId}
                        checked={refundableField.value}
                        onCheckedChange={refundableField.onChange}
                        onBlur={refundableField.onBlur}
                        ref={refundableField.ref}
                      />
                      <span className="text-sm text-ink">
                        Refundable to the tenant
                      </span>
                    </label>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => remove(index)}
                  className="h-11 rounded-full px-4 text-xs font-semibold tracking-normal text-destructive normal-case"
                >
                  <TrashIcon weight="bold" aria-hidden className="size-4" />
                  Remove
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <div>
        <Button
          type="button"
          variant="outline"
          disabled={atCapacity}
          onClick={() => append({ label: "", amount: "", refundable: false })}
          className="h-11 rounded-full px-5 text-xs font-semibold tracking-normal normal-case"
        >
          <PlusIcon weight="bold" aria-hidden className="size-3.5" />
          Add charge
        </Button>
        {atCapacity && (
          <p className="mt-2 text-xs text-muted-ink">
            {MAX_OTHER_CHARGES} charges is the maximum.
          </p>
        )}
      </div>

      <div className="sticky bottom-2 z-10 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-primary-50 p-4 ring-1 ring-primary-200">
        <div>
          <p
            aria-live="polite"
            className="font-heading text-lg font-bold text-primary-900"
          >
            Total move-in cost: {formatNaira(total)}
          </p>
          <p className="text-xs text-primary-800">
            {refundable > 0
              ? `${formatNaira(refundable)} of that comes back to the tenant.`
              : "This is the number seekers compare listings on."}
          </p>
        </div>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-primary-700">
          <ShieldCheckIcon weight="fill" aria-hidden className="size-4" />
          Full disclosure earns trust
        </p>
      </div>
    </div>
  );
}

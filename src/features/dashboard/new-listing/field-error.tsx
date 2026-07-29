import { WarningCircleIcon } from "@phosphor-icons/react";

interface FieldErrorProps {
  id: string;
  message?: string;
}

/**
 * The one place a validation message is rendered. Always occupies the same
 * slot under its input, is referenced by `aria-describedby`, and reads as an
 * instruction ("Enter how many bedrooms") rather than a scolding.
 */
export function FieldError({ id, message }: FieldErrorProps) {
  if (message === undefined) return null;
  return (
    <p id={id} className="flex items-start gap-1.5 text-xs text-destructive">
      <WarningCircleIcon
        weight="fill"
        aria-hidden
        className="mt-0.5 size-3.5 shrink-0"
      />
      <span>{message}</span>
    </p>
  );
}

import React from "react";
import { Switch } from "@/components/ui/switch";

export default function PrefSwitch({
  label,
  description,
  checked,
  onChange,
  disabled,
  id,
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-center justify-between gap-3 py-3 cursor-pointer min-h-[44px]"
    >
      <span className="flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        {description && (
          <span className="block text-xs text-foreground/50">{description}</span>
        )}
      </span>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        aria-label={label}
      />
    </label>
  );
}
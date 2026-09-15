import React from "react";
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export default function SettingsSection({
  value,
  icon: Icon,
  title,
  description,
  children,
}) {
  return (
    <AccordionItem
      value={value}
      className="rounded-2xl border border-border bg-card px-4 mb-3 overflow-hidden"
    >
      <AccordionTrigger className="hover:no-underline py-4 min-h-[64px]">
        <div className="flex items-center gap-3 flex-1 text-left">
          <span className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
            <Icon className="h-5 w-5" />
          </span>
          <span className="flex flex-col items-start">
            <span className="font-bold text-sm">{title}</span>
            <span className="text-xs text-foreground/50 font-normal">
              {description}
            </span>
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-2">{children}</AccordionContent>
    </AccordionItem>
  );
}
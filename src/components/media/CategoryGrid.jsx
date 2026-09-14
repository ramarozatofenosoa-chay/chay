import React from "react";
import { CATEGORIES } from "@/lib/mediaConstants";

export default function CategoryGrid({ onOpen }) {
  return (
    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 md:gap-6">
      {CATEGORIES.map((c) => {
        const Icon = c.icon;
        return (
          <button
            key={c.id}
            onClick={() =>
              c.href ? window.open(c.href, "_blank") : onOpen(c.id)
            }
            className="group flex flex-col items-center gap-2"
          >
            <span
              className={`aspect-square w-full rounded-[1.5rem] bg-gradient-to-br ${c.tone} grid place-items-center text-white shadow-sm group-hover:-translate-y-1 group-hover:shadow-lg transition-all`}
            >
              <Icon className="h-9 w-9 md:h-10 md:w-10" />
            </span>
            <span className="text-xs md:text-sm font-semibold text-foreground/70 text-center leading-tight">
              {c.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
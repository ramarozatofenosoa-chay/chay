import React, { useState } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

export default function DrawerSelect({
  value,
  options,
  onChange,
  placeholder = "Sélectionner…",
  title = "Sélectionner",
  description,
  searchable = false,
  getLabel = (o) => o.label,
  getValue = (o) => o.value,
  triggerClassName = "",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => getValue(o) === value);
  const selectedLabel = selected ? getLabel(selected) : placeholder;

  const filtered = query
    ? options.filter((o) =>
        getLabel(o).toLowerCase().includes(query.toLowerCase())
      )
    : options;

  const handleClose = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-bold transition hover:bg-muted ${triggerClassName}`}
      >
        <span className="truncate flex-1 text-left">{selectedLabel}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-foreground/50" />
      </button>
      <Drawer
        open={open}
        onOpenChange={(v) => {
          if (!v) handleClose();
          else setOpen(v);
        }}
      >
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            {description && <DrawerDescription>{description}</DrawerDescription>}
          </DrawerHeader>
          {searchable && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2">
                <Search className="h-4 w-4 text-foreground/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher…"
                  className="bg-transparent outline-none text-sm font-medium flex-1"
                />
              </div>
            </div>
          )}
          <div className="overflow-y-auto px-4 pb-6 max-h-[60vh] space-y-1">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-foreground/50 py-8">
                Aucun résultat
              </p>
            ) : (
              filtered.map((o, i) => {
                const v = getValue(o);
                const isActive = v === value;
                return (
                  <button
                    key={v ?? i}
                    onClick={() => {
                      onChange(v);
                      handleClose();
                    }}
                    className={`flex items-center justify-between w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-foreground/80"
                    }`}
                  >
                    {getLabel(o)}
                    {isActive && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
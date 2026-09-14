import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Library } from "lucide-react";

export default function PlaylistPicker({ open, onOpenChange, playlists, onPick }) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>Ajouter à une playlist</DrawerTitle>
          <DrawerDescription>Choisissez la playlist de destination.</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-1 overflow-y-auto max-h-[60vh]">
          {playlists.length ? (
            playlists.map((p) => (
              <button
                key={p.id}
                onClick={() => onPick(p.id)}
                className="flex items-center gap-3 w-full text-left px-2 py-3 rounded-2xl hover:bg-muted transition"
              >
                <span className="h-10 w-10 rounded-xl brand-gradient grid place-items-center text-white shrink-0">
                  <Library className="h-5 w-5" />
                </span>
                <span className="flex-1 font-semibold truncate">{p.name}</span>
              </button>
            ))
          ) : (
            <p className="text-center text-sm text-foreground/50 py-6">
              Aucune playlist. Créez-en une d'abord depuis l'onglet Playlists.
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
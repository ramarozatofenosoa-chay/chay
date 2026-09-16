import React, { useEffect } from "react";
import { Loader2, WifiOff, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { APP_VERSION } from "@/lib/appVersion";

export default function AppLoader({ offline, retry }) {
  const { toast } = useToast();

  useEffect(() => {
    const key = "chay_last_version";
    try {
      const last = localStorage.getItem(key);
      if (last && last !== APP_VERSION) {
        toast({
          title: "Nouvelle version disponible",
          description: `L'application a été mise à jour (v${APP_VERSION}).`,
        });
      }
      localStorage.setItem(key, APP_VERSION);
    } catch {
      /* ignore */
    }
  }, [toast]);

  return (
    <div className="fixed inset-0 grid place-items-center bg-background">
      {offline ? (
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <WifiOff className="h-10 w-10 text-primary" />
          <p className="font-display font-bold text-lg">Connexion instable</p>
          <p className="text-sm text-foreground/60 max-w-xs">
            Vérifiez votre connexion Internet, puis réessayez.
          </p>
          {retry && (
            <button
              onClick={retry}
              className="mt-1 inline-flex items-center gap-2 rounded-full brand-gradient text-white px-5 py-2.5 text-sm font-bold"
            >
              <RefreshCw className="h-4 w-4" /> Réessayer
            </button>
          )}
        </div>
      ) : (
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      )}
    </div>
  );
}
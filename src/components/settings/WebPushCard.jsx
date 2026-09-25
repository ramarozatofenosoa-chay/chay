import React, { useEffect, useState } from "react";
import { Globe, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { enableWebPush, disableWebPush, webPushState } from "@/lib/webPush";

// Carte « Notifications du navigateur » : active/désactive le push système
// sur cet appareil (ordinateur, ou téléphone utilisé dans le navigateur).
// La permission est demandée uniquement au clic sur « Activer » — le
// navigateur exige une gestuelle utilisateur (surtout Safari).
export default function WebPushCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState({
    supported: false,
    permission: "default",
    subscribed: false,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    webPushState()
      .then((s) => {
        if (alive) setState(s);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!state.supported) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-3 mb-1">
        <Globe className="h-4 w-4 mt-0.5 text-foreground/50 shrink-0" />
        <p className="text-xs text-foreground/55">
          Les notifications navigateur ne sont pas prises en charge par ce
          navigateur (essayez Chrome, Edge, Firefox ou Safari récent).
        </p>
      </div>
    );
  }

  const denied = state.permission === "denied";
  const active = state.subscribed && state.permission === "granted";

  const toggle = async () => {
    setBusy(true);
    try {
      if (active) {
        await disableWebPush();
        setState(await webPushState());
        toast({ title: "Notifications navigateur désactivées" });
      } else {
        await enableWebPush(user?.id);
        setState(await webPushState());
        toast({
          title: "Notifications navigateur activées",
          description:
            "Vous recevrez une alerte sur cet appareil pour les messages, les nouveautés et le verset du jour.",
        });
      }
    } catch (e) {
      toast({
        title: "Impossible d'activer les notifications",
        description: (e && e.message) || String(e),
        variant: "destructive",
      });
    }
    setBusy(false);
  };

  return (
    <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-3 mb-1">
      <Globe className="h-4 w-4 mt-0.5 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground">
          Notifications du navigateur
        </p>
        <p className="text-xs text-foreground/55">
          {denied
            ? "Permission refusée : autorisez les notifications de ce site dans les réglages de votre navigateur."
            : active
              ? "Actives sur cet appareil : les alertes s'affichent même hors de l'onglet."
              : "Recevez une alerte sur cet appareil (messages, nouveautés, verset du jour), même hors de l'onglet."}
        </p>
        {!denied && (
          <button
            type="button"
            onClick={toggle}
            disabled={busy || !user?.id}
            className={`mt-2 h-8 px-3 rounded-lg text-xs font-semibold border ${
              active
                ? "border-border bg-card"
                : "brand-gradient text-white border-transparent"
            } disabled:opacity-50`}
          >
            {busy && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin inline-block" />}
            {active ? "Désactiver" : "Activer"}
          </button>
        )}
      </div>
    </div>
  );
}

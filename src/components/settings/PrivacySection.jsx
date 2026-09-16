import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { usePreferences } from "@/lib/PreferencesContext";
import PrefSwitch from "@/components/settings/PrefSwitch";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { FileText, ExternalLink } from "lucide-react";

export default function PrivacySection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { prefs, setPref } = usePreferences();
  const [cookies, setCookies] = useState(!!user?.accepte_cookies);
  const [comments, setComments] = useState(!!user?.accepte_commentaires_respect);
  const [busy, setBusy] = useState(false);

  const update = async (patch) => {
    setBusy(true);
    try {
      await base44.auth.updateMe(patch);
      toast({ title: "Préférence enregistrée" });
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setBusy(false);
  };

  return (
    <div className="space-y-1">
      <PrefSwitch
        label="Profil privé"
        description="Masquer votre profil aux autres membres."
        checked={prefs.profile_private}
        onChange={(v) => setPref("profile_private", v)}
      />
      <PrefSwitch
        label="Afficher mon statut en ligne"
        description="Si désactivé, vous êtes invisible et ne voyez pas le statut des autres (réciprocité)."
        checked={prefs.presence_visible !== false}
        onChange={(v) => setPref("presence_visible", v)}
      />
      <PrefSwitch
        label="Personnalisation basée sur la localisation"
        description="Utiliser votre position pour du contenu pertinent (météo, annonces locales)."
        checked={prefs.location_personalization}
        onChange={async (v) => {
          setPref("location_personalization", v);
          await update({ localisation_activee: v });
        }}
      />

      <div className="border-t border-border my-2" />
      <div className="py-2">
        <p className="text-sm font-semibold">Historique de localisation</p>
        <p className="text-xs text-foreground/50">
          Aucun historique de localisation n'est actuellement stocké sur votre
          compte.
        </p>
      </div>

      <div className="border-t border-border my-2" />
      <PrefSwitch
        label="Accepter les cookies"
        checked={cookies}
        disabled={busy}
        onChange={(v) => {
          setCookies(v);
          update({ accepte_cookies: v });
        }}
      />
      <PrefSwitch
        label="Accepter les commentaires respectueux"
        checked={comments}
        disabled={busy}
        onChange={(v) => {
          setComments(v);
          update({ accepte_commentaires_respect: v });
        }}
      />

      <div className="border-t border-border my-2" />
      <p className="text-xs font-bold uppercase tracking-wide text-foreground/50 py-1">
        Documents légaux
      </p>
      <Link
        to="/contact"
        className="flex items-center gap-2 py-2 text-sm font-semibold hover:text-primary"
      >
        <FileText className="h-4 w-4" /> Politique de confidentialité
      </Link>
      <Link
        to="/contact"
        className="flex items-center gap-2 py-2 text-sm font-semibold hover:text-primary"
      >
        <FileText className="h-4 w-4" /> Conditions d'utilisation
      </Link>
      <Link
        to="/contact"
        className="flex items-center gap-2 py-2 text-sm font-semibold hover:text-primary"
      >
        <FileText className="h-4 w-4" /> Politique de cookies
      </Link>

      <div className="border-t border-border my-2" />
      <div className="py-2">
        <p className="text-sm font-semibold">Copie de mes données</p>
        <p className="text-xs text-foreground/50">
          Pour demander une copie de vos données, contactez l'équipe via la page
          Contact.
        </p>
        <Link
          to="/contact"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary mt-1"
        >
          Demander une copie <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
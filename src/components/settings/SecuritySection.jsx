import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { usePreferences } from "@/lib/PreferencesContext";
import PrefSwitch from "@/components/settings/PrefSwitch";
import {
  Loader2,
  KeyRound,
  Mail,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SecuritySection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { prefs, setPref } = usePreferences();
  const [resetting, setResetting] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const sendReset = async () => {
    if (!user?.email) return;
    setResetting(true);
    try {
      await base44.auth.resetPasswordRequest(user.email);
      toast({
        title: "E-mail envoyé",
        description:
          "Vérifiez votre boîte de réception pour changer votre mot de passe.",
      });
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setResetting(false);
  };

  const changeEmail = async () => {
    if (!EMAIL_RE.test(newEmail.trim())) {
      toast({ title: "E-mail invalide", variant: "destructive" });
      return;
    }
    setSavingEmail(true);
    try {
      await base44.auth.updateMe({ email: newEmail.trim() });
      toast({
        title: "E-mail mis à jour",
        description: "Un e-mail de vérification peut vous être envoyé.",
      });
      setNewEmail("");
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSavingEmail(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
        <span className="font-semibold">E-mail vérifié</span>
        <span className="text-foreground/50 truncate">· {user?.email}</span>
      </div>

      <div>
        <Label className="text-xs flex items-center gap-1">
          <KeyRound className="h-3.5 w-3.5" /> Mot de passe
        </Label>
        <Button
          variant="outline"
          className="w-full mt-1"
          onClick={sendReset}
          disabled={resetting}
        >
          {resetting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <KeyRound className="h-4 w-4 mr-2" />
          )}
          Changer le mot de passe
        </Button>
        <p className="text-xs text-foreground/50 mt-1">
          Un lien de réinitialisation sera envoyé à votre e-mail.
        </p>
      </div>

      <div>
        <Label className="text-xs flex items-center gap-1">
          <Mail className="h-3.5 w-3.5" /> Modifier l'e-mail
        </Label>
        <div className="flex gap-2 mt-1">
          <Input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder={user?.email}
            className="h-10"
          />
          <Button
            onClick={changeEmail}
            disabled={savingEmail}
            className="shrink-0"
          >
            {savingEmail ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Enregistrer"
            )}
          </Button>
        </div>
      </div>

      <PrefSwitch
        label="Notification lors d'une nouvelle connexion"
        description="Recevoir une alerte à chaque nouvelle connexion à votre compte."
        checked={prefs.notif_new_connection}
        onChange={(v) => setPref("notif_new_connection", v)}
      />

      <div className="rounded-xl bg-muted/40 p-3 text-xs text-foreground/60 flex items-start gap-2">
        <Smartphone className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          Sessions et appareils connectés : la gestion détaillée des sessions
          n'est pas disponible dans l'application actuellement. Se déconnecter
          vous déconnecte de cet appareil.
        </span>
      </div>
    </div>
  );
}
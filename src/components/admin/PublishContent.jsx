import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { publishContentWithNotification } from "@/lib/contentNotifications";
import { Loader2, Upload, Send, Mail, BellRing, Smartphone, X, Check, AlertTriangle } from "lucide-react";

const TYPES = [
  ["audio", "Audio"],
  ["video", "Vidéo"],
  ["predication", "Prédication"],
  ["enseignement", "Enseignement"],
  ["annonce", "Annonce"],
  ["evenement", "Événement"],
  ["actualite", "Actualité"],
  ["autre", "Autre"],
];

const EMPTY = {
  type: "predication",
  title: "",
  description: "",
  category: "",
  media_url: "",
  resource_id: "",
};

export default function PublishContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState(null);

  // Réglage admin (persisté sur le compte) : e-mails de nouveautés en masse.
  useEffect(() => {
    if (user) setSendEmail(user.admin_email_nouveautes !== false);
  }, [user]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const persistToggle = async (v) => {
    setSendEmail(v);
    try {
      await base44.auth.updateMe({ admin_email_nouveautes: v });
    } catch {
      /* ignore */
    }
  };

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      set("media_url", res.file_url);
      toast({ title: "Fichier importé" });
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const publish = async () => {
    if (!form.title.trim()) {
      toast({ title: "Le titre est requis", variant: "destructive" });
      return;
    }
    setPublishing(true);
    try {
      const { recipients, created, emailsSent, error } =
        await publishContentWithNotification(form, { sendEmail });
      if (error) {
        toast({
          title: "Contenu publié (notification partielle)",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Contenu publié",
          description: `${created || recipients || 0} notification(s) · ${emailsSent || 0} e-mail(s) envoyé(s).`,
        });
      }
      setForm(EMPTY);
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setPublishing(false);
  };

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await base44.functions.invoke("sendTestNotification", {});
      setTestResult((res && (res.data || res)) || {});
    } catch (e) {
      setTestResult({ error: (e && e.message) || String(e) });
    }
    setTesting(false);
  };

  const runPushTest = async () => {
    setPushing(true);
    setPushResult(null);
    try {
      const res = await base44.functions.invoke("sendFcmPush", { test: true });
      setPushResult((res && (res.data || res)) || {});
    } catch (e) {
      setPushResult({ error: (e && e.message) || String(e) });
    }
    setPushing(false);
  };

  return (
    <div className="rounded-[2rem] border border-border bg-background/40 p-5 md:p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Send className="h-5 w-5 text-primary" />
        <h2 className="font-display font-extrabold text-xl">Publier un contenu</h2>
      </div>
      <p className="text-sm text-foreground/60">
        La publication crée une notification in-app pour tous les utilisateurs et,
        si l'option est activée, envoie un e-mail de nouveauté.
      </p>

      <div>
        <Label className="text-xs">Type</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
          {TYPES.map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => set("type", v)}
              className={`h-10 rounded-xl border text-sm font-semibold ${
                form.type === v
                  ? "brand-gradient text-white border-transparent"
                  : "border-border bg-card"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-xs">Titre</Label>
        <Input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          className="h-10 mt-1"
        />
      </div>

      <div>
        <Label className="text-xs">Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-xs">Catégorie</Label>
        <Input
          value={form.category}
          onChange={(e) => set("category", e.target.value)}
          className="h-10 mt-1"
        />
      </div>

      <div>
        <Label className="text-xs">Fichier média (audio / vidéo / image)</Label>
        <label className="mt-1 flex items-center gap-2 rounded-xl border border-dashed border-border bg-card px-3 py-3 cursor-pointer">
          <Upload className="h-4 w-4 text-primary" />
          <span className="text-sm text-foreground/60 truncate">
            {form.media_url ? "Fichier importé" : "Importer un fichier"}
          </span>
          <input
            type="file"
            className="hidden"
            onChange={(e) => upload(e.target.files?.[0])}
          />
          {uploading && <Loader2 className="h-4 w-4 animate-spin ml-auto" />}
        </label>
      </div>

      <div>
        <Label className="text-xs">ID ressource liée (optionnel)</Label>
        <Input
          value={form.resource_id}
          onChange={(e) => set("resource_id", e.target.value)}
          className="h-10 mt-1"
          placeholder="ex. id d'une prédication existante"
        />
      </div>

      {/* Réglage admin : e-mails de nouveauté en masse */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          <div>
            <div className="text-sm font-bold">E-mails de nouveauté en masse</div>
            <p className="text-xs text-foreground/55">
              Envoie un e-mail à tous les utilisateurs lors de la publication.
            </p>
          </div>
        </div>
        <Switch checked={sendEmail} onCheckedChange={persistToggle} />
      </div>

      <Button onClick={publish} disabled={publishing} className="w-full">
        {publishing ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Send className="h-4 w-4 mr-2" />
        )}
        Publier et notifier
      </Button>

      {/* Bouton de test admin */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center gap-2 mb-2">
          <BellRing className="h-4 w-4 text-primary" />
          <h3 className="font-display font-bold text-sm">Test du système de notifications</h3>
        </div>
        <p className="text-xs text-foreground/55 mb-3">
          Envoie une notification de test à vous-même (in-app + e-mail) et affiche
          le résultat détaillé.
        </p>
        <Button variant="outline" onClick={runTest} disabled={testing} className="w-full">
          {testing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <BellRing className="h-4 w-4 mr-2" />
          )}
          Envoyer une notification de test à moi-même
        </Button>
      </div>

      {/* Test push natif */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center gap-2 mb-2">
          <Smartphone className="h-4 w-4 text-primary" />
          <h3 className="font-display font-bold text-sm">Test du push natif (Android)</h3>
        </div>
        <p className="text-xs text-foreground/55 mb-3">
          Envoie un push de test à votre téléphone (uniquement si l'app mobile est
          installée et enregistrée). Affiche le nombre de tokens trouvés et la
          réponse brute de Firebase.
        </p>
        <Button variant="outline" onClick={runPushTest} disabled={pushing} className="w-full">
          {pushing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Smartphone className="h-4 w-4 mr-2" />
          )}
          Envoyer un push de test à mon téléphone
        </Button>
      </div>

      {/* Résultat du test */}
      <Dialog open={!!testResult} onOpenChange={(v) => !v && setTestResult(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Résultat du test</DialogTitle>
            <DialogDescription>
              Détail de la notification et de l'e-mail de test.
            </DialogDescription>
          </DialogHeader>
          {testResult?.error ? (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{testResult.error}</span>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                {testResult?.notification?.created ? (
                  <Check className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                ) : (
                  <X className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
                )}
                <div>
                  <div className="font-bold">Notification in-app</div>
                  <div className="text-foreground/60 text-xs">
                    {testResult?.notification?.created
                      ? `Créée (id : ${testResult?.notification?.id || "—"})`
                      : `Échec : ${testResult?.notification?.error || "erreur inconnue"}`}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                {testResult?.email?.sent ? (
                  <Check className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                ) : (
                  <X className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
                )}
                <div>
                  <div className="font-bold">E-mail</div>
                  <div className="text-foreground/60 text-xs">
                    {testResult?.email?.sent
                      ? `Envoyé à ${testResult?.email?.to || "—"}`
                      : `Non envoyé : ${testResult?.email?.error || "aucune adresse ou erreur"}`}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!pushResult} onOpenChange={(v) => !v && setPushResult(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Résultat du push de test</DialogTitle>
            <DialogDescription>Détail de l'envoi push : navigateur et Android.</DialogDescription>
          </DialogHeader>
          {pushResult?.error ? (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{pushResult.error}</span>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {pushResult?.webPush?.skipped || !(pushResult?.webPush?.subscriptions > 0) ? (
                  <X className="h-4 w-4 text-destructive" />
                ) : (
                  <Check className="h-4 w-4 text-emerald-500" />
                )}
                <span className="font-bold">
                  Navigateur — abonnements : {pushResult?.webPush?.subscriptions ?? 0}
                  {" "}· Envoyés : {pushResult?.webPush?.sent ?? 0}
                  {" "}· Échecs : {pushResult?.webPush?.failed ?? 0}
                  {pushResult?.webPush?.skipped
                    ? ` · non exécuté (${pushResult.webPush.skipped})`
                    : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {pushResult?.sent > 0 ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <X className="h-4 w-4 text-destructive" />
                )}
                <span className="font-bold">Tokens Android trouvés : {pushResult?.tokensFound ?? 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Envoyés : {pushResult?.sent ?? 0} · Échecs : {pushResult?.failed ?? 0}</span>
              </div>
              <div>
                <div className="font-bold mb-1">Réponse Firebase :</div>
                <pre className="text-xs bg-muted rounded-xl p-2 overflow-auto max-h-40">{JSON.stringify(pushResult?.firebaseResponses || [], null, 2)}</pre>
              </div>
              {pushResult?.tokensFound === 0 && (
                <p className="text-xs text-foreground/55">
                  Aucun token Android : comportement attendu avec l'app web (et non
                  l'app mobile). Pour les popups sur navigateur, activez
                  « Notifications du navigateur » dans Réglages → Notifications.
                </p>
              )}
              {pushResult?.webPush?.subscriptions === 0 && (
                <p className="text-xs text-foreground/55">
                  Aucun abonnement navigateur : sur l'appareil destinataire,
                  ouvrez Réglages → Notifications → « Notifications du
                  navigateur » → Activer, puis relancez ce test.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
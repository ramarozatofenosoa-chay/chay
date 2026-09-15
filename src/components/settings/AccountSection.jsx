import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { Camera, Loader2, Save, BadgeCheck, Mail } from "lucide-react";

export default function AccountSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        gender: user.gender || "",
        birth_date: user.birth_date || "",
        phone: user.phone || "",
        country: user.country || "",
        city: user.city || "",
        location_label: user.location_label || "",
        profile_photo_url: user.profile_photo_url || "",
      });
    }
  }, [user]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const uploadPhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      set("profile_photo_url", res.file_url);
      await base44.auth.updateMe({ profile_photo_url: res.file_url });
      toast({ title: "Photo mise à jour" });
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const save = async () => {
    if (!form.first_name?.trim()) {
      toast({ title: "Le prénom est requis", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await base44.auth.updateMe(form);
      toast({ title: "Profil enregistré" });
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const initial = (
    user?.first_name ||
    user?.full_name?.[0] ||
    user?.email ||
    "?"
  )[0]?.toUpperCase();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="relative cursor-pointer shrink-0">
          <div className="h-16 w-16 rounded-full overflow-hidden brand-gradient grid place-items-center text-white font-bold text-xl">
            {form.profile_photo_url ? (
              <Image
                src={form.profile_photo_url}
                fittingType="fill"
                className="w-full h-full"
              />
            ) : (
              initial
            )}
          </div>
          <span className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-primary text-primary-foreground grid place-items-center border-2 border-background">
            {uploading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Camera className="h-3 w-3" />
            )}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => uploadPhoto(e.target.files?.[0])}
          />
        </label>
        <div className="text-sm text-foreground/60">
          Changer la photo de profil
        </div>
      </div>

      <div className="rounded-xl bg-muted/40 p-3 flex items-center gap-2">
        <Mail className="h-4 w-4 text-foreground/50 shrink-0" />
        <span className="text-sm font-semibold flex-1 break-all">
          {user?.email}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
          <BadgeCheck className="h-3.5 w-3.5" /> Vérifié
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Prénom</Label>
          <Input
            value={form.first_name || ""}
            onChange={(e) => set("first_name", e.target.value)}
            className="mt-1 h-10"
          />
        </div>
        <div>
          <Label className="text-xs">Nom</Label>
          <Input
            value={form.last_name || ""}
            onChange={(e) => set("last_name", e.target.value)}
            className="mt-1 h-10"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs">Genre</Label>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {["Homme", "Femme"].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => set("gender", g)}
              className={`h-10 rounded-xl border text-sm font-semibold ${
                form.gender === g
                  ? "brand-gradient text-white border-transparent"
                  : "border-border bg-card"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Date de naissance</Label>
          <Input
            type="date"
            value={form.birth_date || ""}
            onChange={(e) => set("birth_date", e.target.value)}
            className="mt-1 h-10"
          />
        </div>
        <div>
          <Label className="text-xs">Téléphone</Label>
          <Input
            value={form.phone || ""}
            onChange={(e) => set("phone", e.target.value)}
            className="mt-1 h-10"
            placeholder="06 12 34 56 78"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Pays</Label>
          <Input
            value={form.country || ""}
            onChange={(e) => set("country", e.target.value)}
            className="mt-1 h-10"
          />
        </div>
        <div>
          <Label className="text-xs">Ville</Label>
          <Input
            value={form.city || ""}
            onChange={(e) => set("city", e.target.value)}
            className="mt-1 h-10"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs">Localisation</Label>
        <Input
          value={form.location_label || ""}
          onChange={(e) => set("location_label", e.target.value)}
          className="mt-1 h-10"
          placeholder="Ville, Pays"
        />
      </div>

      <Button onClick={save} disabled={saving} className="w-full">
        {saving ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Enregistrer
      </Button>
    </div>
  );
}
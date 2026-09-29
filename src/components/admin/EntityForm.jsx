import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import FieldInput from "@/components/admin/FieldInput";

export default function EntityForm({ fields, initial, onSubmit, onCancel, saving }) {
  const [data, setData] = useState(() => {
    const d = {};
    fields.forEach((f) => {
      d[f.name] = initial?.[f.name] ?? (f.type === "number" ? null : "");
    });
    return d;
  });
  const [uploading, setUploading] = useState(false);
  // L'utilisateur a cliqué « Enregistrer » pendant un envoi : on enregistre dès qu'il est terminé.
  const [pending, setPending] = useState(false);
  const [missing, setMissing] = useState("");

  const set = (name) => (v) => setData((d) => ({ ...d, [name]: v }));

  const missingFile = () =>
    fields.find((f) => f.type === "file" && f.required && !data[f.name]);

  const submit = (e) => {
    e.preventDefault();
    setMissing("");
    if (uploading) {
      setPending(true);
      return;
    }
    const m = missingFile();
    if (m) {
      setMissing(`Le champ « ${m.label} » est obligatoire.`);
      return;
    }
    onSubmit(data);
  };

  useEffect(() => {
    if (!pending || uploading) return;
    setPending(false);
    const m = missingFile();
    if (m) {
      setMissing(`L'envoi de « ${m.label} » a échoué. Réessayez avant d'enregistrer.`);
      return;
    }
    onSubmit(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, uploading]);

  return (
    <form onSubmit={submit} className="space-y-4">
      {fields.map((f) => (
        <div key={f.name}>
          <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
            {f.label}
            {f.required && " *"}
          </label>
          <FieldInput
            field={f}
            value={data[f.name]}
            onChange={set(f.name)}
            onUploadingChange={f.type === "file" ? setUploading : undefined}
          />
        </div>
      ))}
      {missing && <p className="text-sm font-semibold text-destructive">{missing}</p>}
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving || pending}>
          {pending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enregistrement dès que le fichier est envoyé…</>
          ) : saving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enregistrement…</>
          ) : (
            "Enregistrer"
          )}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

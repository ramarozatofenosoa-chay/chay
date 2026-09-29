import React, { useState } from "react";
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
  // Suit si un upload de fichier est en cours (pour bloquer la soumission)
  const [uploading, setUploading] = useState(false);

  const set = (name) => (v) => setData((d) => ({ ...d, [name]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (uploading) return;
    onSubmit(data);
  };

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
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving || uploading}>
          {uploading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Upload en cours…</>
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

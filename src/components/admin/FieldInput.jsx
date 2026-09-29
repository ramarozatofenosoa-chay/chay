import React, { useState, useEffect } from "react";
import { Loader2, Upload, X, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

// Plafond prudent : Base44 documente 50 Mo audio / 100 Mo vidéo en
// application live. Au-delà, on prévient l'admin avant l'envoi.
const MAX_MB = 100;

function PlaylistSelect({ value, onChange, cls }) {
const [playlists, setPlaylists] = useState([]);
const [loading, setLoading] = useState(true);
useEffect(() => {
base44.entities.Playlist.list({})
.then((data) => setPlaylists(data || []))
.catch(() => {})
.finally(() => setLoading(false));
}, []);
if (loading) {
return (
<div className="flex items-center gap-2 text-sm text-muted-foreground">
<Loader2 className="h-3.5 w-3.5 animate-spin" /> Chargement…
</div>
);
}
return (
<select value={value || ""} onChange={(e) => onChange(e.target.value || null)} className={cls}>
<option value="">— Aucune playlist —</option>
{playlists.map((p) => (
<option key={p.id} value={p.id}>
{p.name}
</option>
))}
</select>
);
}

// Envoi du fichier : on essaie le SDK courant, puis l'ancien nom, et on
// refuse de continuer si aucune URL n'est renvoyée.
async function uploadAny(file) {
const core = (base44.integrations && base44.integrations.Core) || {};
const fn = typeof core.UploadPublicFile === "function" ? core.UploadPublicFile : core.UploadFile;
if (!fn) throw new Error("Service d'envoi de fichiers indisponible (SDK).");
const res = await fn({ file });
const url =
(typeof res === "string" ? res : null) ||
res?.file_url || res?.url || res?.uri ||
res?.data?.file_url || res?.data?.url || null;
if (!url || !/^https?:\/\//i.test(url)) {
throw new Error("Le serveur n'a pas renvoyé de lien vers le fichier.");
}
return url;
}

function fileNameFromUrl(url) {
try {
const clean = String(url).split("?")[0];
const parts = clean.split("/").filter(Boolean);
return decodeURIComponent(parts[parts.length - 1] || "fichier").slice(0, 60);
} catch {
return "fichier";
}
}

export default function FieldInput({ field, value, onChange }) {
const { toast } = useToast();
const [uploading, setUploading] = useState(false);
const cls =
"w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:border-primary/20";
const onFile = async (e) => {
const f = e.target.files?.[0];
e.target.value = "";
if (!f) return;
if (f.size > MAX_MB * 1024 * 1024) {
toast({
title: "Fichier trop volumineux",
description: `Maximum ${MAX_MB} Mo (fichier de ${(f.size / 1048576).toFixed(1)} Mo). Pour un long contenu : compressez l'audio ou hébergez la vidéo sur YouTube.`,
variant: "destructive",
});
return;
}
setUploading(true);
try {
const url = await uploadAny(f);
onChange(url);
toast({ title: "Fichier envoyé", description: fileNameFromUrl(url) });
} catch (err) {
toast({
title: "Échec de l'envoi",
description: err?.message || "Réessayez, ou vérifiez le poids du fichier.",
variant: "destructive",
});
} finally {
setUploading(false);
}
};
switch (field.type) {
case "textarea":
return (
<textarea
value={value || ""}
onChange={(e) => onChange(e.target.value)}
rows={4}
className={`${cls} resize-none`}
placeholder={field.label}
/>
);
case "number":
return (
<input
type="number"
value={value ?? ""}
onChange={(e) =>
onChange(e.target.value === "" ? null : Number(e.target.value))
}
className={cls}
/>
);
case "date":
return (
<input
type="date"
value={value ? String(value).split("T")[0] : ""}
onChange={(e) => onChange(e.target.value)}
className={cls}
/>
);
case "select":
return (
<select
value={value || ""}
onChange={(e) => onChange(e.target.value)}
className={cls}
>
{!field.required && <option value="">—</option>}
{field.options?.map((o) => (
<option key={o.value} value={o.value}>
{o.label}
</option>
))}
</select>
);
case "playlist":
return <PlaylistSelect value={value} onChange={onChange} cls={cls} />;
case "file":
return (
<div className="space-y-2">
<label className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-bold cursor-pointer hover:bg-muted">
{uploading ? (
<Loader2 className="h-3.5 w-3.5 animate-spin" />
) : (
<Upload className="h-3.5 w-3.5" />
)}
{uploading ? "Envoi…" : value ? "Remplacer" : "Importer"}
<input
type="file"
className="hidden"
onChange={onFile}
accept={field.accept || "*/*"}
/>
</label>
{value && !uploading && (
<div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2">
<CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
<span className="flex-1 min-w-0 text-xs font-semibold truncate">
{fileNameFromUrl(value)}
</span>
<button
type="button"
onClick={() => onChange("")}
className="h-6 w-6 grid place-items-center rounded-full hover:bg-muted shrink-0"
title="Retirer le fichier"
>
<X className="h-3.5 w-3.5" />
</button>
</div>
)}
</div>
);
default:
return (
<input
value={value || ""}
onChange={(e) => onChange(e.target.value)}
className={cls}
placeholder={field.label}
/>
);
}
}

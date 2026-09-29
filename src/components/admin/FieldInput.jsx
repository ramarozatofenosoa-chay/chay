import React, { useState, useEffect } from "react";
import { Loader2, Upload, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";

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

function FileUploadField({ field, value, onChange }) {
  const [status, setStatus] = useState("idle"); // idle | uploading | done | error
  const [fileName, setFileName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [fileToRetry, setFileToRetry] = useState(null);
  const inputRef = React.useRef(null);

  const doUpload = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setStatus("uploading");
    setErrorMsg("");
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      onChange(file_url);
      setStatus("done");
      setFileToRetry(null);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err?.message || "Erreur inconnue");
      setFileToRetry(file);
    }
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (f) doUpload(f);
    e.target.value = "";
  };

  const retry = () => {
    if (fileToRetry) doUpload(fileToRetry);
  };

  return (
    <div className="space-y-2">
      {status !== "uploading" && (
        <label className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-bold cursor-pointer hover:bg-muted">
          <Upload className="h-3.5 w-3.5" />
          {status === "done" ? "Changer" : "Importer"}
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={onFile}
            accept={field.accept || "*/*"}
          />
        </label>
      )}

      {status === "uploading" && (
        <div className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-3 py-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-primary text-xs">Envoi en cours…</div>
            <div className="text-xs text-foreground/60 truncate">{fileName}</div>
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-emerald-600 text-xs">Importé ✓</div>
            <div className="text-xs text-foreground/60 truncate">{fileName}</div>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-start gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-destructive text-xs">Échec de l'import</div>
            <div className="text-xs text-foreground/60 truncate mb-1">{errorMsg}</div>
            <button
              type="button"
              onClick={retry}
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              <RefreshCw className="h-3 w-3" /> Réessayer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FieldInput({ field, value, onChange }) {
  const cls =
    "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

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
      return <FileUploadField field={field} value={value} onChange={onChange} />;
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

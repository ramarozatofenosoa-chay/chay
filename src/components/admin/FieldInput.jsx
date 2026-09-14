import React, { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function FieldInput({ field, value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const cls =
    "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file: f });
      onChange(file_url);
    } catch {
      /* ignore */
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
          <option value="">—</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case "file":
      return (
        <div className="space-y-2">
          <input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className={cls}
            placeholder="URL du fichier"
          />
          <label className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-bold cursor-pointer hover:bg-muted">
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {uploading ? "Envoi…" : "Importer"}
            <input
              type="file"
              className="hidden"
              onChange={onFile}
              accept={field.accept || "*/*"}
            />
          </label>
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
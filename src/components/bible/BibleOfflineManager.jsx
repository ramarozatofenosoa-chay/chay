import React, { useEffect, useState } from "react";
import { CloudDownload, CheckCircle2, Loader2, WifiOff } from "lucide-react";
import {
  downloadBibleTranslation,
  downloadDictionaryOffline,
  getOfflineMeta,
  getOfflineDictionary,
} from "@/lib/offlineBible";

const TRANSLATIONS = [
  { id: "lsg1910", label: "Bible française (LSG)" },
  { id: "malagasy", label: "Baiboly malagasy" },
];

// Panneau permettant de télécharger la Bible (FR + MG) et le dictionnaire
// pour une utilisation hors connexion. Affiché sur l'accueil du module Bible.
export default function BibleOfflineManager() {
  const [meta, setMeta] = useState({});
  const [dictAvailable, setDictAvailable] = useState(false);
  const [busy, setBusy] = useState(null); // id en cours de téléchargement
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    getOfflineMeta().then(setMeta);
    getOfflineDictionary().then((d) => setDictAvailable(!!d));
  }, []);

  async function handleDownload(id) {
    setBusy(id);
    setProgress(0);
    setError("");
    try {
      await downloadBibleTranslation(id, { onProgress: ({ loaded }) => setProgress(loaded) });
      setMeta(await getOfflineMeta());
    } catch (e) {
      setError(e.message || "Échec du téléchargement.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDownloadDictionary() {
    setBusy("dictionary");
    setError("");
    try {
      await downloadDictionaryOffline();
      setDictAvailable(true);
    } catch (e) {
      setError(e.message || "Échec du téléchargement.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <CloudDownload className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold text-foreground">Disponible hors-ligne</h2>
      </div>
      <div className="space-y-2">
        {TRANSLATIONS.map((t) => {
          const complete = !!meta?.[t.id]?.complete;
          const isBusy = busy === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleDownload(t.id)}
              disabled={isBusy || complete}
              className="flex w-full items-center justify-between rounded-xl border border-border px-3 py-2.5 text-left text-sm transition hover:border-primary disabled:cursor-default disabled:opacity-80"
            >
              <span className="font-semibold text-foreground">{t.label}</span>
              {isBusy ? (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> {progress} versets…
                </span>
              ) : complete ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Téléchargée
                </span>
              ) : (
                <span className="text-xs font-semibold text-primary">Télécharger</span>
              )}
            </button>
          );
        })}
        <button
          onClick={handleDownloadDictionary}
          disabled={busy === "dictionary" || dictAvailable}
          className="flex w-full items-center justify-between rounded-xl border border-border px-3 py-2.5 text-left text-sm transition hover:border-primary disabled:cursor-default disabled:opacity-80"
        >
          <span className="font-semibold text-foreground">Dictionnaire biblique</span>
          {busy === "dictionary" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          ) : dictAvailable ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Téléchargé
            </span>
          ) : (
            <span className="text-xs font-semibold text-primary">Télécharger</span>
          )}
        </button>
      </div>
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
          <WifiOff className="h-3.5 w-3.5" /> {error}
        </p>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground">
        L'audio se télécharge chapitre par chapitre depuis le lecteur audio (icône de téléchargement).
        La concordance utilise automatiquement les textes téléchargés quand vous êtes hors ligne.
      </p>
    </div>
  );
}

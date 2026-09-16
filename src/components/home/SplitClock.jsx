import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Sparkles, History, ArrowRight } from "lucide-react";

function describe(c) {
  const title = c?.title || "";
  const cat = c?.category || "Média";
  let noun = "Le contenu";
  let verb = "Découvrez";
  switch (c?.type) {
    case "audio":
      noun = "La chanson";
      verb = "Écoutez";
      break;
    case "video":
      noun = "Le film";
      verb = "Regardez";
      break;
    case "predication":
      noun = "La prédication";
      verb = "Écoutez";
      break;
    case "enseignement":
      noun = "L'enseignement";
      verb = "Écoutez";
      break;
    case "annonce":
      noun = "L'annonce";
      verb = "Lisez";
      break;
    case "evenement":
      noun = "L'événement";
      verb = "Découvrez";
      break;
    case "actualite":
      noun = "L'actualité";
      verb = "Lisez";
      break;
    default:
      break;
  }
  return { noun, verb, cat, title };
}

/**
 * Widget Nouveauté / Précédemment : reflète automatiquement l'activité de
 * l'administrateur. Le dernier contenu publié apparaît dans « Nouveauté »,
 * le précédent dans « Précédemment ». Un clic mène au contenu.
 */
export default function SplitClock() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    base44.entities.Content
      .filter({ status: "published" }, "-published_at", 5)
      .then((list) => setItems(Array.isArray(list) ? list : []))
      .catch(() => setItems([]));
  }, []);

  const latest = items[0] || null;
  const previous = items[1] || null;

  const open = (c) => {
    if (!c) return;
    if (c.media_url) window.open(c.media_url, "_blank");
    else navigate("/media");
  };

  const Pane = ({ label, icon: Icon, item, accent }) => {
    const d = describe(item);
    return (
      <button
        type="button"
        onClick={() => open(item)}
        disabled={!item}
        className={`p-4 text-left flex flex-col gap-2 min-h-[7rem] ${
          accent ? "bg-muted/30 md:border-l border-border" : ""
        } disabled:cursor-default`}
      >
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-foreground/40">
          <Icon className="h-3.5 w-3.5" /> {label}
        </div>
        {item ? (
          <>
            <p className="selectable text-sm leading-snug text-foreground/90">
              {d.noun} « {d.title} » a été ajouté dans {d.cat}.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
              {d.verb} maintenant <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </>
        ) : (
          <p className="text-sm text-foreground/50">Rien pour le moment.</p>
        )}
      </button>
    );
  };

  return (
    <section className="mt-4">
      <div className="rounded-[1.5rem] border border-border bg-card overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <Pane label="Précédemment" icon={History} item={previous} />
        <Pane label="Nouveauté" icon={Sparkles} item={latest} accent />
      </div>
    </section>
  );
}
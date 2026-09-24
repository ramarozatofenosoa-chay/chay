import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, History, ChevronLeft, ChevronRight } from "lucide-react"; // Ajout des chevrons, suppression d'ArrowRight si inutilisé ailleurs
import ContentDetailDialog from "./ContentDetailDialog";

function describe(c) {
  const title = c?.title || "";
  const cat = c?.category || "Média";
  let noun = "Le contenu";
  switch (c?.type) {
    case "audio": noun = "La chanson"; break;
    case "video": noun = "Le film"; break;
    case "predication": noun = "La prédication"; break;
    case "enseignement": noun = "L'enseignement"; break;
    case "annonce": noun = "L'annonce"; break;
    case "evenement": noun = "L'événement"; break;
    case "actualite": noun = "L'actualité"; break;
    default: break;
  }
  return { noun, cat, title };
}

/**
 * Widget Nouveauté / Précédemment : Affichage côte à côte avec navigation par flèches.
 */
export default function SplitClock() {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    base44.entities.Content
      .filter({ status: "published" }, "-published_at", 5)
      .then((list) => setItems(Array.isArray(list) ? list : []))
      .catch(() => setItems([]));
  }, []);

  const latest = items[0] || null;   // À Droite (Nouveauté)
  const previous = items[1] || null; // À Gauche (Précédemment)

  const open = (c) => {
    if (!c) return;
    setActive(c);
  };

  // Composant interne pour un panneau (Gauche ou Droite)
  const Pane = ({ label, icon: Icon, item, isLatest }) => {
    const d = describe(item);
    
    return (
      <button
        type="button"
        onClick={() => open(item)}
        disabled={!item}
        className={`flex-1 p-4 text-left flex flex-col justify-between min-h-[8rem] relative group transition-colors duration-300 ${
          isLatest 
            ? "bg-primary/5 border-l border-border" // La nouveauté a une légère teinte primaire
            : "bg-card hover:bg-muted/30"           // Le précédent reste neutre
        } disabled:opacity-50 disabled:cursor-default`}
      >
        {/* En-tête du panneau : Label + Icône */}
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`h-4 w-4 ${isLatest ? 'text-primary' : 'text-foreground/40'}`} />
          <span className={`text-xs font-bold uppercase tracking-wider ${isLatest ? 'text-primary' : 'text-foreground/50'}`}>
            {label}
          </span>
        </div>

        {/* Contenu principal */}
        {item ? (
          <>
            <p className="selectable text-sm leading-snug text-foreground/90 line-clamp-3">
              {d.noun} « {d.title} » <br/>
              <span className="text-xs text-foreground/60">dans {d.cat}</span>
            </p>
            
            {/* Navigation par flèche au lieu de texte */}
            <div className={`mt-auto pt-2 flex items-center gap-1 text-xs font-semibold transition-transform group-hover:${isLatest ? '-translate-x-1' : 'translate-x-1'} ${isLatest ? 'justify-end text-primary' : 'justify-start text-foreground/60'}`}>
              {!isLatest && <ChevronLeft className="h-4 w-4" />}
              {isLatest && <ChevronRight className="h-4 w-4" />}
            </div>
          </>
        ) : (
          <p className="text-sm text-foreground/40 italic">Aucun contenu</p>
        )}
      </button>
    );
  };

  return (
    <section className="mt-6 animate-float-in">
      {/* Conteneur Principal : Grid 2 colonnes fixes */}
      <div className="rounded-[1.5rem] border border-border bg-card overflow-hidden grid grid-cols-2 divide-x divide-border shadow-sm">
        
        {/* Panneau GAUCHE : Précédemment */}
        <Pane 
          label="Préc." 
          icon={History} 
          item={previous} 
          isLatest={false} 
        />

        {/* Panneau DROITE : Nouveauté */}
        <Pane 
          label="Nouv." 
          icon={Sparkles} 
          item={latest} 
          isLatest={true} 
        />

      </div>

      <ContentDetailDialog
        item={active}
        open={!!active}
        onOpenChange={(v) => !v && setActive(null)}
      />
    </section>
  );
}

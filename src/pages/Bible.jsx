import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, BookOpen, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Liste des livres bibliques pour la navigation
const BOOKS = [
  { name: "Genèse", abbr: "GN", chapters: 50 },
  { name: "Exode", abbr: "EX", chapters: 40 },
  // ... Ajoutez vos autres livres ici si nécessaire, ou gardez la logique dynamique ci-dessous
];

export default function BibleReader({ onBack }) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // État initial depuis l'URL
  const currentBook = searchParams.get("book") || "Genèse";
  const currentChapter = parseInt(searchParams.get("chapter") || "1");
  const currentTranslation = searchParams.get("translation") || "fra_lsg"; // Default FR
  
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- LOGIQUE DE CHARGEMENT OPTIMISÉE AVEC CACHE ---
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    // Clé unique pour le cache : Livre_Chapitre_Traduction
    const cacheKey = `bible_${currentBook}_${currentChapter}_${currentTranslation}`;
    
    // 1. Vérifier le cache local d'abord
    try {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        setVerses(JSON.parse(cachedData));
        setLoading(false);
        return; // On sort ici, pas besoin d'appeler l'API
      }
    } catch (e) {
      console.warn("Erreur lecture cache:", e);
    }

    // 2. Sinon, appeler l'API Base44
    // IMPORTANT : On filtre précisément et on met une limite raisonnable (ex: 200 versets max par chapitre)
    base44.entities.BibleVerse
      .filter(
        { 
          book: currentBook, 
          chapter: currentChapter, 
          translation: currentTranslation 
        },
        "+verse_number", // Tri croissant par numéro de verset
        200 // Limite stricte pour éviter de charger trop de données inutilement
      )
      .then((data) => {
        if (!isMounted) return;
        
        const cleanVerses = Array.isArray(data) ? data : [];
        setVerses(cleanVerses);
        
        // 3. Sauvegarder dans le cache pour la prochaine fois
        try {
          localStorage.setItem(cacheKey, JSON.stringify(cleanVerses));
        } catch (e) {
          // Si le cache est plein, on ignore silencieusement
          console.warn("Cache plein");
        }
        
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Erreur chargement Bible:", err);
        setError("Impossible de charger ce passage.");
        setLoading(false);
      });

    return () => { isMounted = false; };
  }, [currentBook, currentChapter, currentTranslation]);

  // Fonctions de navigation
  const goToNextChapter = () => {
    // Logique simple : incrémenter le chapitre. 
    // Idéalement, vérifier la limite de chapitres du livre courant.
    setSearchParams(prev => ({
      ...Object.fromEntries(prev.entries()),
      chapter: String(currentChapter + 1)
    }));
  };

  const goToPrevChapter = () => {
    if (currentChapter > 1) {
      setSearchParams(prev => ({
        ...Object.fromEntries(prev.entries()),
        chapter: String(currentChapter - 1)
      }));
    }
  };

  const changeLanguage = (lang) => {
    setSearchParams(prev => ({
      ...Object.fromEntries(prev.entries()),
      translation: lang === "mg" ? "MG1865" : "fra_lsg"
    }));
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between gap-2">
        <button onClick={onBack} className="p-2 hover:bg-muted rounded-full transition">
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <div className="text-center flex-1 min-w-0">
          <h1 className="font-bold text-lg truncate">{currentBook}</h1>
          <p className="text-xs text-muted-foreground">Chapitre {currentChapter}</p>
        </div>

        <div className="flex gap-1">
           <button 
             onClick={() => changeLanguage("fr")}
             className={`px-2 py-1 text-xs font-bold rounded ${currentTranslation.includes('fra') ? 'bg-primary text-white' : 'bg-muted'}`}
           >FR</button>
           <button 
             onClick={() => changeLanguage("mg")}
             className={`px-2 py-1 text-xs font-bold rounded ${currentTranslation.includes('MG') ? 'bg-primary text-white' : 'bg-muted'}`}
           >MG</button>
        </div>
      </header>

      {/* Contenu */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Chargement des versets...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-center">
            {error}
          </div>
        ) : verses.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            Aucun verset trouvé pour cette référence.
          </div>
        ) : (
          <article className="prose prose-lg dark:prose-invert max-w-none">
            {verses.map((v) => (
              <p key={v.id} className="mb-4 leading-relaxed text-foreground/90">
                <sup className="mr-1 text-xs font-bold text-primary select-none">{v.verse_number}</sup>
                {v.text}
              </p>
            ))}
          </article>
        )}
      </main>

      {/* Footer Navigation */}
      <footer className="border-t border-border bg-background p-4 flex justify-between items-center sticky bottom-0">
        <button 
          onClick={goToPrevChapter} 
          disabled={currentChapter <= 1}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card text-sm font-semibold disabled:opacity-50 hover:bg-muted transition"
        >
          <ChevronLeft className="h-4 w-4" /> Précédent
        </button>
        
        <span className="text-xs text-muted-foreground font-medium">
          {verses.length} versets
        </span>

        <button 
          onClick={goToNextChapter}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition shadow-sm"
        >
          Suivant <ChevronRight className="h-4 w-4" />
        </button>
      </footer>
    </div>
  );
}

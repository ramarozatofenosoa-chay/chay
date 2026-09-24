import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Facebook, Youtube, Shield, Globe } from "lucide-react"; // Ajout de Globe
import PullToRefresh from "@/components/PullToRefresh";
import SplitClock from "@/components/home/SplitClock";
import QuestionLogiqueSection from "@/components/home/QuestionLogiqueSection";
import QuickAccess from "@/components/home/QuickAccess";
// import NewContentsSection from "@/components/home/NewContentsSection"; // Supprimé si vous voulez garder la suppression des nouveautés
import VersetDuJourSection from "@/components/home/VersetDuJourSection";
import ProchaineReunionSection from "@/components/home/ProchaineReunionSection";

export default function Home() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const loadHome = () => setRefreshKey((k) => k + 1);

  const firstName =
    (user?.full_name ? user.full_name.split(" ")[0] : "") ||
    (user?.email ? user.email.split("@")[0] : "");

  return (
    <PullToRefresh mode="window" onRefresh={loadHome}>
      <div className="mx-auto max-w-6xl px-6 md:px-8 py-8 md:py-12">
        
        {/* Welcome Header */}
        <section className="animate-float-in flex items-center gap-4">
          <div>
            <h1 className="font-display font-extrabold text-2xl md:text-4xl text-foreground">
              <span className="brand-gradient-text">ÉGLISE CHAY</span>
            </h1>
            {firstName && (
              <p className="mt-1 text-lg md:text-2xl font-display font-bold text-foreground/80">
                Shalom {firstName} 
              </p>
            )}
          </div>
        </section>

        {/* Texte d'accueil malgache */}
        <p className="mt-3 text-sm md:text-xl text-foreground/60 max-w-xl [font-family:'Gilroy',_sans-serif] animate-float-in" style={{ animationDelay: "0.05s" }}>
          Tongasoa eto amin'ny Fiangonana Chay izay mitory ny Fanjakan'Andriamanitra.
        </p>

        {/* ✅ VERSET DU JOUR DÉPLACÉ ICI (Juste après le texte d'accueil) */}
        <div className="animate-float-in mt-6" style={{ animationDelay: "0.1s" }}>
          <VersetDuJourSection refreshKey={refreshKey} />
        </div>

        {/* Horloge divisée */}
        <div className="animate-float-in mt-6" style={{ animationDelay: "0.15s" }}>
          <SplitClock />
        </div>

        {/* Question Logique */}
        <div className="animate-float-in mt-6" style={{ animationDelay: "0.2s" }}>
          <QuestionLogiqueSection />
        </div>

        {/* Prochaine réunion */}
        <div className="animate-float-in mt-6" style={{ animationDelay: "0.25s" }}>
          <ProchaineReunionSection refreshKey={refreshKey} />
        </div>

        {/* Accès rapide */}
        <div className="animate-float-in mt-6" style={{ animationDelay: "0.3s" }}>
          <QuickAccess />
        </div>

        {/* Nouveautés - Commenté ou supprimé selon votre préférence précédente */}
        {/* 
        <div className="animate-float-in mt-6" style={{ animationDelay: "0.35s" }}>
          <NewContentsSection />
        </div> 
        */}

        {/* Footer avec liens sociaux simplifiés en icônes */}
        <footer className="mt-12 pt-8 border-t border-border pb-6 flex flex-col items-center gap-6">
          
          {/* Conteneur des icônes sociales */}
          <div className="flex items-center justify-center gap-4">
            
            {/* Lien Site Web (Nouveau) */}
            <a
              href="https://www.chay.fr/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-card border border-border text-foreground hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 shadow-sm"
              aria-label="Site Web Église Chay"
            >
              <Globe className="h-5 w-5" />
            </a>

            {/* Lien Facebook */}
            <a
              href="https://www.facebook.com/www.chay.fr"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-card border border-border text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 shadow-sm"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5" />
            </a>

            {/* Lien YouTube */}
            <a
              href="https://www.youtube.com/@EgliseChay.fr-tv"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-card border border-border text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-300 shadow-sm"
              aria-label="YouTube"
            >
              <Youtube className="h-5 w-5" />
            </a>

            {/* Lien Admin (Visible uniquement pour admin) */}
            {user?.role === "admin" && (
              <Link
                to="/admin"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-card border border-border text-purple-600 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all duration-300 shadow-sm"
                aria-label="Administration"
              >
                <Shield className="h-5 w-5" />
              </Link>
            )}
          </div>

          {/* Petit copyright ou note légale optionnelle */}
          <p className="text-xs text-foreground/40 text-center">
            © {new Date().getFullYear()} Église Chay. Tous droits réservés.
          </p>
        </footer>
      </div>
    </PullToRefresh>
  );
}

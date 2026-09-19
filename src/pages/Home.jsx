import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Facebook, Youtube, Shield } from "lucide-react";
import PullToRefresh from "@/components/PullToRefresh";
import SplitClock from "@/components/home/SplitClock";
import QuestionLogiqueSection from "@/components/home/QuestionLogiqueSection";
import QuickAccess from "@/components/home/QuickAccess";
import NewContentsSection from "@/components/home/NewContentsSection";
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
      {/* Welcome */}
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

      <p className="mt-3 text-sm md:text-xl text-foreground/60 max-w-xl [font-family:'Gilroy',_sans-serif] animate-float-in" style={{ animationDelay: "0.05s" }}>
        Tongasoa eto amin'ny Fiangonana Chay izay mitory ny Fanjakan'Andriamanitra.
      </p>

      {/* Horloge divisée */}
      <div className="animate-float-in" style={{ animationDelay: "0.1s" }}>
        <SplitClock />
      </div>

      {/* Verse of the day */}
      <div className="animate-float-in" style={{ animationDelay: "0.15s" }}>
        <VersetDuJourSection refreshKey={refreshKey} />
      </div>

      {/* Question Logique (sous le verset du jour) */}
      <div className="animate-float-in" style={{ animationDelay: "0.2s" }}>
        <QuestionLogiqueSection />
      </div>

      {/* Prochaine réunion */}
      <div className="animate-float-in" style={{ animationDelay: "0.25s" }}>
        <ProchaineReunionSection refreshKey={refreshKey} />
      </div>

      {/* Accès rapide */}
      <div className="animate-float-in" style={{ animationDelay: "0.3s" }}>
        <QuickAccess />
      </div>

      {/* Nouveautés */}
      <div className="animate-float-in" style={{ animationDelay: "0.35s" }}>
        <NewContentsSection />
      </div>

      {/* Social links */}
      <footer className="mt-12 pt-8 border-t border-border pb-6 flex flex-col items-center gap-4">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <a
            href="https://www.facebook.com/www.chay.fr"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-bold hover:scale-105 hover:border-primary transition"
          >
            <Facebook className="h-5 w-5 text-primary" /> Facebook
          </a>
          <a
            href="https://www.youtube.com/@EgliseChay.fr-tv"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-bold hover:scale-105 hover:border-primary transition"
          >
            <Youtube className="h-5 w-5 text-primary" /> YouTube
          </a>
        </div>
        {user?.role === "admin" && (
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-bold hover:scale-105 hover:border-primary transition"
            >
              <Shield className="h-5 w-5 text-primary" /> Admin
            </Link>
          </div>
        )}
      </footer>
    </div>
    </PullToRefresh>
  );
}
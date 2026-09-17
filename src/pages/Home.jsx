import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
  BookOpen,
  ArrowRight,
  CalendarDays,
  Clock,
  Bell,
  Facebook,
  Youtube,
  Share2,
  Shield,
} from "lucide-react";
import WeatherCard from "@/components/WeatherCard";
import PullToRefresh from "@/components/PullToRefresh";
import SplitClock from "@/components/home/SplitClock";
import NewContentsSection from "@/components/home/NewContentsSection";
import QuickAccess from "@/components/home/QuickAccess";

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [devotional, setDevotional] = useState(null);
  const [reunion, setReunion] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadHome = async () => {
    try {
      const todayISO = new Date().toISOString().split("T")[0];
      const [todayDevs, allDevs, anns] = await Promise.all([
        base44.entities.Devotional
          .filter({ reading_date: todayISO }, "-reading_date", 1)
          .catch(() => []),
        base44.entities.Devotional.list("-reading_date", 1).catch(() => []),
        base44.entities.Announcement.list("-date", 30).catch(() => []),
      ]);
      const todayDev =
        Array.isArray(todayDevs) && todayDevs.length ? todayDevs[0] : null;
      const fallback = Array.isArray(allDevs) ? allDevs[0] : null;
      setDevotional(todayDev || fallback || null);

      const all = Array.isArray(anns) ? anns : [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const events = all.filter((a) => a.type === "event");
      const upcoming = events
        .filter((a) => a.date && new Date(a.date) >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      setReunion(upcoming[0] || events[0] || all[0] || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHome();
  }, []);

  const firstName =
    user?.first_name ||
    (user?.full_name ? user.full_name.split(" ")[0] : "") ||
    (user?.email ? user.email.split("@")[0] : "");

  const shareVerse = async () => {
    const url = window.location.origin;
    let text;
    if (devotional) {
      const ref = devotional.scripture_reference || "";
      const colon = ref.lastIndexOf(":");
      const verseNum = colon >= 0 ? ref.slice(colon + 1).trim() : "";
      const verseText = devotional.verse_text || devotional.title || "";
      text = `${ref} LSG\n${verseNum ? `[${verseNum}] ` : ""}${verseText}\n${url}`;
    } else {
      text = `Philippiens 4:13 LSG\n[13] Je puis tout par celui qui me fortifie.\n${url}`;
    }
    if (navigator.share) {
      try {
        await navigator.share({ title: "Verset du jour", text });
      } catch {
        /* cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: "Verset copié" });
      } catch {
        /* ignore */
      }
    }
  };

  const chapterTranslation =
    devotional?.language === "en" ? "BSB" : "fra_lsg";
  const chapterLink = devotional?.scripture_reference
    ? `/bible?ref=${encodeURIComponent(devotional.scripture_reference)}&translation=${chapterTranslation}`
    : "/bible";

  return (
    <PullToRefresh mode="window" onRefresh={loadHome}>
    <div className="mx-auto max-w-6xl px-6 md:px-8 py-8 md:py-12">
      {/* Welcome */}
      <section className="animate-float-in flex items-center gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-foreground">
            <span className="brand-gradient-text">ÉGLISE CHAY</span>
          </h1>
          {firstName && (
            <p className="mt-1 text-xl md:text-2xl font-display font-bold text-foreground/80">
              Shalom {firstName} 
            </p>
          )}
        </div>
      </section>

      <p className="mt-4 text-lg md:text-xl text-foreground/60 max-w-xl [font-family:'Gilroy',_sans-serif]">
        Tongasoa eto amin'ny Fiangonana Chay izay mitory ny Fanjakan'Andriamanitra.
      </p>

      {/* Horloge divisée */}
      <SplitClock />

      {/* Verse of the day */}
      <section className="mt-6">
        <div className="rounded-[2rem] brand-gradient p-8 md:p-10 text-white relative overflow-hidden glow-primary">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
                <BookOpen className="h-3.5 w-3.5" /> Verset du jour
              </div>
              <button
                onClick={shareVerse}
                className="h-8 w-8 grid place-items-center rounded-full bg-white/15 hover:bg-white/25 transition"
                aria-label="Partager le verset"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
            {loading ? (
              <div className="mt-5 space-y-3">
                <div className="h-7 w-3/4 bg-white/20 rounded animate-pulse" />
                <div className="h-7 w-2/3 bg-white/20 rounded animate-pulse" />
              </div>
            ) : devotional ? (
              <>
                <p className="selectable mt-4 text-base md:text-lg font-light leading-snug [font-family:'Montserrat',sans-serif]">
                  « {devotional.verse_text || devotional.title} »
                </p>
                <p className="mt-2 text-sm font-medium text-white/75 [font-family:'Montserrat',sans-serif]">
                  — {devotional.scripture_reference}
                </p>
                <Link
                  to={chapterLink}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-white text-neutral-900 px-5 py-2.5 text-sm font-bold hover:scale-105 transition"
                >
                  Lire le chapitre <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <p className="selectable mt-4 text-base md:text-lg font-light leading-snug [font-family:'Montserrat',sans-serif]">
                « Je puis tout par celui qui me fortifie. » — Philippiens 4:13
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Next reunion */}
      <section className="mt-6">
        <div className="rounded-[1.5rem] border border-border bg-card p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="font-display font-extrabold text-xl">Prochaine réunion</h2>
          </div>
          {loading ? (
            <div className="h-20 bg-background rounded-2xl animate-pulse" />
          ) : reunion ? (
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 grid place-items-center text-primary shrink-0">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div>
                <div className="font-bold text-lg">{reunion.title}</div>
                <div className="text-foreground/60 text-sm mt-1">{reunion.body}</div>
                {reunion.date && (
                  <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    <Clock className="h-4 w-4" />{" "}
                    {new Date(reunion.date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-foreground/50">Aucune réunion annoncée pour le moment.</p>
          )}
        </div>
      </section>

      {/* Nouveautés & Historiques */}
      <NewContentsSection />

      {/* Accès rapide */}
      <QuickAccess />

      {/* Météo */}
      <section className="mt-10">
        <WeatherCard />
      </section>

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
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  BookOpen, Headphones, Radio, Gamepad2, Sparkles, Heart, ArrowRight, CalendarDays, Clock, Bell,
} from "lucide-react";

const QUICK_TILES = [
  { to: "/bible", label: "Bible", icon: BookOpen, tone: "from-[#4A6CFE] to-[#8A56E2]" },
  { to: "/media", label: "Médias", icon: Headphones, tone: "from-[#8A56E2] to-[#FF57B2]" },
  { to: "/media", label: "Radio", icon: Radio, tone: "from-[#FF57B2] to-[#FF4D2D]" },
  { to: "/games", label: "Jeux", icon: Gamepad2, tone: "from-[#2E6F40] to-[#4A6CFE]" },
  { to: "/kids", label: "Enfants", icon: Sparkles, tone: "from-[#FF4D2D] to-[#FF57B2]" },
  { to: "/donate", label: "Donner", icon: Heart, tone: "from-[#8A56E2] to-[#4A6CFE]" },
];

function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function ClockCard({ label, tz, flag }) {
  const now = useNow();
  const time = new Intl.DateTimeFormat("fr-FR", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(now);
  return (
    <div className="rounded-[1.5rem] border border-border bg-card p-5 text-center">
      <div className="text-xs font-bold uppercase tracking-wide text-foreground/50">{flag} {label}</div>
      <div className="font-display font-extrabold text-2xl md:text-3xl mt-1 tabular-nums">{time}</div>
    </div>
  );
}

export default function Home() {
  const [devotional, setDevotional] = useState(null);
  const [reunion, setReunion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [devs, anns] = await Promise.all([
          base44.entities.Devotional.list("-reading_date", 1).catch(() => []),
          base44.entities.Announcement.list("-date", 10).catch(() => []),
        ]);
        setDevotional(Array.isArray(devs) ? devs[0] : null);
        const events = (Array.isArray(anns) ? anns : []).filter((a) => a.type === "event");
        setReunion(events[0] || (Array.isArray(anns) ? anns[0] : null));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="mx-auto max-w-6xl px-6 md:px-8 py-8 md:py-12">
      {/* Welcome */}
      <section className="animate-float-in">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold text-foreground/70 mb-5">
          <Sparkles className="h-4 w-4 text-primary" /> Bienvenue chez
        </div>
        <h1 className="display-fluid text-foreground">
          <span className="brand-gradient-text">ÉGLISE CHAY</span>
        </h1>
        <p className="mt-4 text-lg md:text-xl text-foreground/60 max-w-xl">
          Une communauté chrétienne vivante — lire, écouter, prier et grandir ensemble.
        </p>
      </section>

      {/* Date + clocks */}
      <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-[1.5rem] border border-border bg-card p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl brand-gradient grid place-items-center text-white shrink-0">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-foreground/50">Date du jour</div>
            <div className="font-display font-bold text-base md:text-lg capitalize leading-tight">{today}</div>
          </div>
        </div>
        <ClockCard label="France" tz="Europe/Paris" flag="🇫🇷" />
        <ClockCard label="Madagascar" tz="Indian/Antananarivo" flag="🇲🇬" />
      </section>

      {/* Verse of the day */}
      <section className="mt-6">
        <div className="rounded-[2rem] brand-gradient p-8 md:p-10 text-white relative overflow-hidden glow-primary">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
              <BookOpen className="h-3.5 w-3.5" /> Verset du jour
            </div>
            {loading ? (
              <div className="mt-5 space-y-3">
                <div className="h-7 w-3/4 bg-white/20 rounded animate-pulse" />
                <div className="h-7 w-2/3 bg-white/20 rounded animate-pulse" />
              </div>
            ) : devotional ? (
              <>
                <p className="mt-5 font-display font-bold text-2xl md:text-3xl leading-snug">
                  « {devotional.verse_text || devotional.title} »
                </p>
                <p className="mt-3 font-semibold text-white/80">— {devotional.scripture_reference}</p>
                {devotional.content && <p className="mt-4 text-white/75 max-w-2xl leading-relaxed">{devotional.content}</p>}
                <Link to="/bible" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white text-foreground px-5 py-2.5 text-sm font-bold hover:scale-105 transition">
                  Lire la Bible <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <p className="mt-5 font-display font-bold text-2xl">« Je puis tout par celui qui me fortifie. » — Philippiens 4:13</p>
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
                    <Clock className="h-4 w-4" /> {new Date(reunion.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-foreground/50">Aucune réunion annoncée pour le moment.</p>
          )}
        </div>
      </section>

      {/* Quick access */}
      <section className="mt-8">
        <h2 className="font-display font-extrabold text-2xl mb-4">Accès rapide</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
          {QUICK_TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link key={tile.label} to={tile.to} className="group rounded-[1.25rem] border border-border bg-card p-4 md:p-5 hover:-translate-y-1 hover:shadow-lg transition-all text-center">
                <div className={`h-11 w-11 mx-auto rounded-2xl bg-gradient-to-br ${tile.tone} grid place-items-center text-white shadow-sm mb-2.5`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="font-bold text-sm">{tile.label}</div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
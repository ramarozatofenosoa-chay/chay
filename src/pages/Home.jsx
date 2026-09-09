import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import ProgressRing from "@/components/ProgressRing";
import {
  Flame, BookOpen, Headphones, Radio, Gamepad2, Gift, Heart, ArrowRight, Sparkles, CalendarDays,
} from "lucide-react";

const QUICK_TILES = [
  { to: "/bible", label: "Bible", desc: "Read & listen", icon: BookOpen, tone: "from-[#4A6CFE] to-[#8A56E2]" },
  { to: "/media", label: "Prédications", desc: "Sermons & talks", icon: Headphones, tone: "from-[#8A56E2] to-[#FF57B2]" },
  { to: "/media", label: "Radio", desc: "Live worship", icon: Radio, tone: "from-[#FF57B2] to-[#FF4D2D]" },
  { to: "/games", label: "Games", desc: "Bible trivia", icon: Gamepad2, tone: "from-[#2E6F40] to-[#4A6CFE]" },
  { to: "/kids", label: "Kids", desc: "Safe & fun", icon: Sparkles, tone: "from-[#FF4D2D] to-[#FF57B2]" },
  { to: "/donate", label: "Give", desc: "Support CHAY", icon: Heart, tone: "from-[#8A56E2] to-[#4A6CFE]" },
];

export default function Home() {
  const [devotional, setDevotional] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [devs, anns, sers] = await Promise.all([
          base44.entities.Devotional.list("-reading_date", 1).catch(() => []),
          base44.entities.Announcement.list("-date", 3).catch(() => []),
          base44.entities.Sermon.list("-date", 3).catch(() => []),
        ]);
        setDevotional(Array.isArray(devs) ? devs[0] : null);
        setAnnouncements(Array.isArray(anns) ? anns : []);
        setSermons(Array.isArray(sers) ? sers : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const readingProgress = 0.65; // daily reading goal
  const streak = 7;

  return (
    <div className="mx-auto max-w-6xl px-6 md:px-8 py-8 md:py-12">
      {/* ===== MAIN STAGE: split 60/40 ===== */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-12 items-center">
        {/* Left rail */}
        <div className="lg:col-span-3 animate-float-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold text-foreground/70 mb-6">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span className="capitalize">{today}</span>
          </div>

          <h1 className="display-fluid text-foreground">
            Ready to open <br />
            <span className="brand-gradient-text">His Word</span> today?
          </h1>

          <p className="mt-6 text-lg md:text-xl text-foreground/65 max-w-md leading-relaxed">
            A warm, bilingual space to read, listen, play, and grow together in Christ.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/bible"
              className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-7 py-4 text-base font-bold text-primary-foreground glow-primary hover:scale-[1.02] active:scale-95 transition-transform"
            >
              <BookOpen className="h-5 w-5" />
              Start Today's Reading
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3.5">
              <Flame className="h-5 w-5 text-primary" fill="currentColor" />
              <span className="text-2xl font-display font-extrabold leading-none">{streak}</span>
              <span className="text-sm font-semibold text-foreground/55">day streak</span>
            </div>
          </div>
        </div>

        {/* Right rail: daily goal radial */}
        <div className="lg:col-span-2 flex justify-center animate-float-in" style={{ animationDelay: "0.1s" }}>
          <div className="relative rounded-[2rem] border border-border bg-card p-8 md:p-10 glow-soft">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full brand-gradient px-4 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
              Daily Goal
            </div>
            <ProgressRing progress={readingProgress} size={260} stroke={20}>
              <span className="font-display font-extrabold text-5xl leading-none">{Math.round(readingProgress * 100)}%</span>
              <span className="mt-1.5 text-sm font-semibold text-foreground/55">of today's plan</span>
            </ProgressRing>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-background border border-border px-4 py-3 text-center">
                <div className="text-2xl font-display font-extrabold">3</div>
                <div className="text-xs font-semibold text-foreground/55">chapters</div>
              </div>
              <div className="rounded-2xl bg-background border border-border px-4 py-3 text-center">
                <div className="text-2xl font-display font-extrabold">12<span className="text-base">m</span></div>
                <div className="text-xs font-semibold text-foreground/55">read time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== LOWER STAGE: bento grid ===== */}
      <section className="mt-14 md:mt-20">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl">Quick access</h2>
          <span className="text-sm font-semibold text-foreground/50">Tap to explore</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {QUICK_TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link
                key={tile.label}
                to={tile.to}
                className="group rounded-[1.5rem] border border-border bg-card p-5 md:p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
              >
                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${tile.tone} grid place-items-center text-white shadow-sm mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="font-display font-bold text-lg">{tile.label}</div>
                <div className="text-sm text-foreground/55 font-medium">{tile.desc}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ===== Verse of the day + Announcements ===== */}
      <section className="mt-14 md:mt-20 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Verse card */}
        <div className="rounded-[2rem] brand-gradient p-8 md:p-10 text-white relative overflow-hidden glow-primary">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
              <Sparkles className="h-3.5 w-3.5" /> Verse of the day
            </div>
            {loading ? (
              <div className="mt-5 space-y-3">
                <div className="h-6 w-3/4 bg-white/20 rounded animate-pulse" />
                <div className="h-6 w-2/3 bg-white/20 rounded animate-pulse" />
              </div>
            ) : devotional ? (
              <>
                <p className="mt-5 font-display font-bold text-2xl md:text-3xl leading-snug">
                  "{devotional.verse_text || devotional.scripture_reference}"
                </p>
                <p className="mt-3 font-semibold text-white/80">— {devotional.scripture_reference}</p>
                <Link to="/bible" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white text-foreground px-5 py-2.5 text-sm font-bold hover:scale-105 transition">
                  Read full passage <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <p className="mt-5 font-display font-bold text-2xl">"Je puis tout par celui qui me fortifie."</p>
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className="rounded-[2rem] border border-border bg-card p-8 md:p-10">
          <h3 className="font-display font-extrabold text-2xl mb-5">What's happening</h3>
          {loading ? (
            <div className="space-y-4">
              {[0, 1].map((i) => <div key={i} className="h-16 bg-background rounded-2xl animate-pulse" />)}
            </div>
          ) : announcements.length ? (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="flex gap-4 rounded-2xl bg-background border border-border p-4">
                  <div className="h-10 w-10 shrink-0 rounded-xl brand-gradient grid place-items-center text-white">
                    <Gift className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold truncate">{a.title}</div>
                    <div className="text-sm text-foreground/60 line-clamp-2">{a.body}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-foreground/50">No announcements yet — check back soon.</p>
          )}
        </div>
      </section>

      {/* ===== Recent sermons ===== */}
      <section className="mt-14 md:mt-20">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl">Latest sermons</h2>
          <Link to="/media" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:gap-2.5 transition-all">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => <div key={i} className="h-44 bg-card rounded-[1.5rem] animate-pulse" />)}
          </div>
        ) : sermons.length ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {sermons.map((s) => (
              <Link key={s.id} to="/media" className="group rounded-[1.5rem] border border-border bg-card overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all">
                <div className="h-32 brand-gradient relative">
                  <div className="absolute inset-0 grid place-items-center">
                    <Headphones className="h-10 w-10 text-white/90" />
                  </div>
                  <div className="absolute bottom-3 right-3 rounded-full bg-black/40 backdrop-blur px-2.5 py-1 text-xs font-bold text-white">
                    {s.duration_minutes || "—"} min
                  </div>
                </div>
                <div className="p-5">
                  <div className="font-display font-bold text-lg leading-snug line-clamp-2">{s.title}</div>
                  <div className="mt-1 text-sm text-foreground/55 font-medium">{s.speaker}</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-foreground/50">Sermons will appear here once uploaded.</p>
        )}
      </section>
    </div>
  );
}
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
  BookOpen,
  Headphones,
  Radio,
  Gamepad2,
  Baby,
  Heart,
  ArrowRight,
  CalendarDays,
  Clock,
  Bell,
  Facebook,
  Youtube,
  Share2,
  Mail,
  Shield,
} from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import WeatherCard from "@/components/WeatherCard";
import DailyVerseCard from "@/components/notifications/DailyVerseCard";

const QUICK_TILES = [
  { to: "/bible", label: "Bible", icon: BookOpen, tone: "from-[#4A6CFE] to-[#8A56E2]" },
  { to: "/media", label: "Médias", icon: Headphones, tone: "from-[#8A56E2] to-[#FF57B2]" },
  { to: "/media", label: "Radio", icon: Radio, tone: "from-[#FF57B2] to-[#FF4D2D]" },
  { to: "/games", label: "Jeux", icon: Gamepad2, tone: "from-[#2E6F40] to-[#4A6CFE]" },
  { to: "/kids", label: "Enfants", icon: Baby, tone: "from-[#FF4D2D] to-[#FF57B2]" },
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

function ClockChip({ label, tz, flag }) {
  const now = useNow();
  const time = new Intl.DateTimeFormat("fr-FR", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
  return (
    <div className="text-center flex-1">
      <div className="text-xl leading-none mb-1">
        {flag}
      </div>
      <div className="font-display font-extrabold text-xl md:text-2xl tabular-nums">
        {time}
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [devotional, setDevotional] = useState(null);
  const [reunion, setReunion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calOpen, setCalOpen] = useState(false);

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  const firstName = user?.first_name || "";

  const shareVerse = async () => {
    const text = devotional
      ? `« ${devotional.verse_text || devotional.title} » — ${devotional.scripture_reference}`
      : "« Je puis tout par celui qui me fortifie. » — Philippiens 4:13";
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

  const chapterLink = devotional?.scripture_reference
    ? `/bible?ref=${encodeURIComponent(devotional.scripture_reference)}&translation=fra_lsg`
    : "/bible";

  return (
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

      {/* Date + Weather */}
      <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Popover open={calOpen} onOpenChange={setCalOpen}>
          <PopoverTrigger asChild>
            <button className="rounded-[1.5rem] border border-border bg-card p-5 flex items-center gap-4 text-left hover:border-primary transition w-full">
              <div className="h-12 w-12 rounded-2xl brand-gradient grid place-items-center text-white shrink-0">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-wide text-foreground/50">
                  Date du jour
                </div>
                <div className="font-display font-bold text-base md:text-lg capitalize leading-tight">
                  {new Date().toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              captionLayout="dropdown"
              fromYear={1990}
              toYear={2035}
              className="rounded-2xl"
            />
          </PopoverContent>
        </Popover>
        <WeatherCard />
      </section>

      {/* Horizontal clocks */}
      <section className="mt-4">
        <div className="rounded-[1.5rem] border border-border bg-card p-4 flex items-center justify-around gap-2">
          <ClockChip label="France" tz="Europe/Paris" flag="🇫🇷" />
          <div className="h-10 w-px bg-border" />
          <ClockChip label="Madagascar" tz="Indian/Antananarivo" flag="🇲🇬" />
          <div className="h-10 w-px bg-border" />
          <ClockChip label="Seattle" tz="America/Los_Angeles" flag="🇺🇸" />
        </div>
      </section>

      <section className="mt-4">
        <DailyVerseCard user={user} />
      </section>

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
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/25 transition"
              >
                <Share2 className="h-3.5 w-3.5" /> Partager
              </button>
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
                <p className="mt-3 font-semibold text-white/80">
                  — {devotional.scripture_reference}
                </p>
                {devotional.content && (
                  <p className="mt-4 text-white/75 max-w-2xl leading-relaxed">
                    {devotional.content}
                  </p>
                )}
                <Link
                  to={chapterLink}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-white text-neutral-900 px-5 py-2.5 text-sm font-bold hover:scale-105 transition"
                >
                  Lire le chapitre <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <p className="mt-5 font-display font-bold text-2xl">
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

      {/* Quick access */}
      <section className="mt-8">
        <h2 className="font-display font-extrabold text-2xl mb-4">Accès rapide</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
          {QUICK_TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link
                key={tile.label}
                to={tile.to}
                className="group rounded-[1.25rem] border border-border bg-card p-4 md:p-5 hover:-translate-y-1 hover:shadow-lg transition-all text-center"
              >
                <div
                  className={`h-11 w-11 mx-auto rounded-2xl bg-gradient-to-br ${tile.tone} grid place-items-center text-white shadow-sm mb-2.5`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="font-bold text-sm">{tile.label}</div>
              </Link>
            );
          })}
        </div>
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
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-bold hover:scale-105 hover:border-primary transition"
          >
            <Mail className="h-5 w-5 text-primary" /> Contact
          </Link>
          {user?.role === "admin" && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-bold hover:scale-105 hover:border-primary transition"
            >
              <Shield className="h-5 w-5 text-primary" /> Admin
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
}
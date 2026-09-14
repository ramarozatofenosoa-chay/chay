import React, { useEffect, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Users, BookOpen, PlayCircle, Gamepad2, Bell, User, ChevronLeft, Settings, MessageCircle } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import AnimatedOutlet from "@/components/AnimatedOutlet";
import SettingsModal from "@/components/SettingsModal";
import MiniPlayer from "@/components/MiniPlayer";
import { Image } from "@/components/ui/image";
import { useAuth } from "@/lib/AuthContext";
import { usePresenceHeartbeat } from "@/hooks/usePresence";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

const LOGO_URL =
  "https://media.base44.com/images/public/6aa138d0e963d9e5f59d838c/c26279d55_logo.png";

const NAV = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/community", label: "Community", icon: Users },
  { to: "/bible", label: "Bible", icon: BookOpen },
  { to: "/media", label: "Media", icon: PlayCircle },
  { to: "/games", label: "Games", icon: Gamepad2 },
];

const ROOT_TABS = NAV.map((n) => n.to);

export default function Layout() {
  const { user } = useAuth();
  usePresenceHeartbeat(user);
  const unread = useUnreadMessages(user);
  const [showSettings, setShowSettings] = useState(false);
  const [lastParams, setLastParams] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  const showBack = !ROOT_TABS.includes(location.pathname);

  // Preserve per-tab sub-view params (?cat=, ?c=, ?game=) so switching tabs restores them
  useEffect(() => {
    if (location.search) {
      setLastParams((p) => ({ ...p, [location.pathname]: location.search }));
    }
  }, [location.pathname, location.search]);

  const navTarget = (path, end = false) => {
    const isActive = end
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(path + "/");
    if (isActive) return path; // tapping the active tab resets to its root
    const stored = lastParams[path];
    return stored ? `${path}${stored}` : path;
  };

  const urlParams = new URLSearchParams(location.search);
  const hasSubView = urlParams.get("cat") || urlParams.get("c") || urlParams.get("game");

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Desktop floating glass rail */}
      <header className="hidden md:flex sticky top-0 z-40 px-6 pt-5">
        <div className="mx-auto w-full max-w-6xl flex items-center justify-between rounded-full border border-border bg-background/70 backdrop-blur-xl px-6 py-3 glow-soft">
          <div className="flex items-center gap-2.5">
            <Image src={LOGO_URL} alt="Chay" fittingType="fill" className="h-10 w-10 rounded-xl shadow-sm" />
            <span className="font-display font-extrabold tracking-tight text-lg">
              <span className="brand-gradient-text">ÉGLISE</span> CHAY
            </span>
          </div>

          <nav className="flex items-center gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={navTarget(item.to, item.end)}
                end={item.end}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground/70 hover:text-foreground hover:bg-muted"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button className="h-11 w-11 grid place-items-center rounded-full border border-border hover:bg-muted transition">
              <Bell className="h-4 w-4" />
            </button>
            <Link to={navTarget("/messages")} className="relative h-11 w-11 grid place-items-center rounded-full border border-border hover:bg-muted transition" aria-label="Messages">
              <MessageCircle className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold border-2 border-background">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
            <button onClick={() => setShowSettings(true)} className="h-11 w-11 grid place-items-center rounded-full brand-gradient text-white shadow-sm">
              <User className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile top bar — hidden on sub-views to avoid double headers */}
      {!hasSubView && (
      <header
        className="md:hidden sticky top-0 z-40 px-4 bg-background/80 backdrop-blur-xl"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showBack ? (
              <button
                onClick={() => navigate(-1)}
                className="h-11 w-11 grid place-items-center rounded-full border border-border hover:bg-muted transition"
                aria-label="Retour"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : (
              <>
                <Image src={LOGO_URL} alt="Chay" fittingType="fill" className="h-8 w-8 rounded-lg shadow-sm" />
                <span className="font-display font-extrabold tracking-tight">
                  <span className="brand-gradient-text">CHAY</span>
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link to={navTarget("/messages")} className="relative h-11 w-11 grid place-items-center rounded-full border border-border" aria-label="Messages">
              <MessageCircle className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold border-2 border-background">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
            <ThemeToggle />
            <button
              onClick={() => setShowSettings(true)}
              className="h-11 w-11 grid place-items-center rounded-full border border-border"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>
      )}

      <main className="pb-28 md:pb-12">
        {hasSubView && (
          <div className="md:hidden" style={{ height: "env(safe-area-inset-top)" }} />
        )}
        <AnimatedOutlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 px-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <div className="mx-auto max-w-md flex items-center justify-around rounded-full border border-border bg-background/85 backdrop-blur-xl px-2 py-2 glow-soft">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.end ? location.pathname === "/" : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={navTarget(item.to, item.end)}
                end={item.end}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full transition"
              >
                <span
                  className={`grid place-items-center h-11 w-11 rounded-full transition-all ${
                    active ? "brand-gradient text-white shadow-md scale-105" : "text-foreground/55"
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      <MiniPlayer />
      <SettingsModal open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
}
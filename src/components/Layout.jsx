import React, { useEffect, useRef, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Users, BookOpen, PlayCircle, Gamepad2, Bell, User, ChevronLeft, Settings, MessageCircle } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import AnimatedOutlet from "@/components/AnimatedOutlet";
import MiniPlayer from "@/components/MiniPlayer";
import LocationGate from "@/components/LocationGate";
import { Image } from "@/components/ui/image";
import { useAuth } from "@/lib/AuthContext";
import { usePresenceHeartbeat } from "@/hooks/usePresence";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { syncWebPush, disableWebPush, onWebPushNotificationClick } from "@/lib/webPush";
import NotificationBanner from "@/components/NotificationBanner";

const LOGO_URL =
  "https://media.base44.com/images/public/6aa138d0e963d9e5f59d838c/c26279d55_logo.png";

const NAV = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/community", label: "Community", icon: Users },
  { to: "/bible", label: "Bible", icon: BookOpen },
  { to: "/media", label: "Multimédia", icon: PlayCircle },
  { to: "/games", label: "Games", icon: Gamepad2 },
];

const ROOT_TABS = NAV.map((n) => n.to);

export default function Layout() {
  const { user, isAuthenticated } = useAuth();
  usePresenceHeartbeat(user);
  const unread = useUnreadMessages(user);
  const notifUnread = useUnreadNotifications(user);
  const [lastParams, setLastParams] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  usePushNotifications(navigate);
  const webPushSynced = useRef(false);

  // Push navigateur : (ré)abonne silencieusement si la permission est déjà
  // accordée ; désabonne cet appareil à la déconnexion (comme le token FCM).
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      syncWebPush(user.id).finally(() => {
        webPushSynced.current = true;
      });
    } else if (!isAuthenticated && webPushSynced.current) {
      webPushSynced.current = false;
      disableWebPush();
    }
  }, [isAuthenticated, user?.id]);

  // Clic sur une notification push navigateur : ouvre la bonne page.
  useEffect(
    () => onWebPushNotificationClick((data) => navigate(data?.url || "/")),
    [navigate]
  );

  const showBack = !ROOT_TABS.includes(location.pathname);

  // Preserve per-tab sub-view params (?cat=, ?c=, ?game=) so switching tabs restores them
  useEffect(() => {
    if (location.search) {
      setLastParams((p) => ({ ...p, [location.pathname]: location.search }));
    }
  }, [location.pathname, location.search]);

  // Handle hardware back button on Android and other devices
  useEffect(() => {
    const handleBack = () => {
      navigate(-1);
    };

    const popStateListener = () => {
      handleBack();
    };

    window.addEventListener("popstate", popStateListener);

    // Also handle Android hardware back button
    const handleKeyDown = (event) => {
      if (event.key === "Back" || event.key === "Escape") {
        event.preventDefault();
        handleBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("popstate", popStateListener);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigate]);

  const navTarget = (path, end = false) => {
    const isActive = end
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(path + "/");
    if (isActive) return path; // tapping the active tab resets to its root
    if (path === "/media") return path; // Multimédia revient toujours à la grille d'accueil
    if (path === "/messages") return path; // Messages revient toujours à la liste des conversations
    if (path === "/bible") return path; // La Bible revient toujours au menu des modules
    const stored = lastParams[path];
    return stored ? `${path}${stored}` : path;
  };

  const urlParams = new URLSearchParams(location.search);
  const hasSubView =
    urlParams.get("cat") ||
    urlParams.get("c") ||
    urlParams.get("game") ||
    urlParams.get("view"); // sous-écrans Biblette (lecteur, dictionnaire, recherche)

  return (
    <LocationGate>
    <div className="min-h-screen bg-background overflow-x-hidden">
      <NotificationBanner />
      {/* Desktop floating glass rail */}
      <header className="hidden md:flex sticky top-0 z-40 px-6 pt-5">
        <div className="mx-auto w-full max-w-6xl flex items-center justify-between rounded-full border border-border bg-background/70 backdrop-blur-xl px-6 py-3 glow-soft">
          <Link to="/" className="flex items-center">
            <Image src={LOGO_URL} alt="Chay" fittingType="fill" focalPointX={0.5} focalPointY={0.5} className="h-9 w-9 rounded-xl shadow-sm" />
          </Link>

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
            <Link to="/notifications" className="relative h-11 w-11 grid place-items-center rounded-full border border-border hover:bg-muted transition" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              {notifUnread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold border-2 border-background">{notifUnread > 9 ? "9+" : notifUnread}</span>
              )}
            </Link>
            <Link to={navTarget("/messages")} className="relative h-11 w-11 grid place-items-center rounded-full border border-border hover:bg-muted transition" aria-label="Messages">
              <MessageCircle className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold border-2 border-background">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
            <Link to="/settings" className="h-11 w-11 grid place-items-center rounded-full brand-gradient text-white shadow-sm" aria-label="Paramètres">
              <User className="h-4 w-4" />
            </Link>
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
              <Link to="/" className="flex items-center">
                <Image src={LOGO_URL} alt="Chay" fittingType="fill" focalPointX={0.5} focalPointY={0.5} className="h-8 w-8 rounded-xl shadow-sm" />
              </Link>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Link to={navTarget("/messages")} className="relative h-9 w-9 grid place-items-center rounded-full border border-border" aria-label="Messages">
              <MessageCircle className="h-[17px] w-[17px]" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-0.5 grid place-items-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold border-2 border-background">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
            <Link to="/notifications" className="relative h-9 w-9 grid place-items-center rounded-full border border-border" aria-label="Notifications">
              <Bell className="h-[17px] w-[17px]" />
              {notifUnread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-0.5 grid place-items-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold border-2 border-background">{notifUnread > 9 ? "9+" : notifUnread}</span>
              )}
            </Link>
            <ThemeToggle />
            <Link
              to="/settings"
              className="h-9 w-9 grid place-items-center rounded-full border border-border"
              aria-label="Paramètres"
            >
              <Settings className="h-[17px] w-[17px]" />
            </Link>
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
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 px-3" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
        <div className="mx-auto max-w-md flex items-center justify-around rounded-full border border-border bg-background/90 backdrop-blur-xl px-1.5 py-1.5 glow-soft">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.end ? location.pathname === "/" : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={navTarget(item.to, item.end)}
                end={item.end}
                className="flex items-center justify-center px-2 py-1 rounded-full transition"
              >
                <span
                  className={`grid place-items-center h-9 w-9 rounded-full transition-all ${
                    active ? "brand-gradient text-white shadow-sm" : "text-foreground/55"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.5 : 2} />
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      <MiniPlayer />
    </div>
    </LocationGate>
  );
}
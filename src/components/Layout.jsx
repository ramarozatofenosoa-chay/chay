import React, { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Home, Users, BookOpen, PlayCircle, Gamepad2, Sparkles, Bell, User } from "lucide-react";

const NAV = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/community", label: "Community", icon: Users },
  { to: "/bible", label: "Bible", icon: BookOpen },
  { to: "/media", label: "Media", icon: PlayCircle },
  { to: "/games", label: "Games", icon: Gamepad2 },
  { to: "/kids", label: "Kids", icon: Sparkles },
];

export default function Layout() {
  const [lang, setLang] = useState("fr");
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop floating glass rail */}
      <header className="hidden md:flex sticky top-0 z-40 px-6 pt-5">
        <div className="mx-auto w-full max-w-6xl flex items-center justify-between rounded-full border border-border bg-background/70 backdrop-blur-xl px-6 py-3 glow-soft">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full brand-gradient grid place-items-center text-white font-display font-extrabold text-lg shadow-sm">C</div>
            <span className="font-display font-extrabold tracking-tight text-lg">
              <span className="brand-gradient-text">ÉGLISE</span> CHAY
            </span>
          </div>

          <nav className="flex items-center gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
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
            <button
              onClick={() => setLang((l) => (l === "fr" ? "en" : "fr"))}
              className="px-3 py-1.5 rounded-full border border-border text-xs font-bold uppercase tracking-wide hover:bg-muted transition"
            >
              {lang === "fr" ? "FR" : "EN"}
            </button>
            <button className="h-9 w-9 grid place-items-center rounded-full border border-border hover:bg-muted transition">
              <Bell className="h-4 w-4" />
            </button>
            <button className="h-9 w-9 grid place-items-center rounded-full brand-gradient text-white shadow-sm">
              <User className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-40 px-4 pt-4 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full brand-gradient grid place-items-center text-white font-display font-extrabold text-sm">C</div>
            <span className="font-display font-extrabold tracking-tight">
              <span className="brand-gradient-text">CHAY</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang((l) => (l === "fr" ? "en" : "fr"))}
              className="px-3 py-1.5 rounded-full border border-border text-xs font-bold uppercase"
            >
              {lang === "fr" ? "FR" : "EN"}
            </button>
            <button className="h-9 w-9 grid place-items-center rounded-full border border-border">
              <Bell className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="pb-28 md:pb-12">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 px-4 pb-4">
        <div className="mx-auto max-w-md flex items-center justify-around rounded-full border border-border bg-background/85 backdrop-blur-xl px-2 py-2 glow-soft">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.end ? location.pathname === "/" : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-full transition"
              >
                <span
                  className={`grid place-items-center h-9 w-9 rounded-full transition-all ${
                    active ? "brand-gradient text-white shadow-md scale-105" : "text-foreground/55"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" strokeWidth={active ? 2.5 : 2} />
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
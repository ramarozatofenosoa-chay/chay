import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/hooks/useTheme";

const LS_KEY = "chay-prefs";

export const DEFAULT_PREFS = {
  theme: "auto",
  text_size: "sm",
  contrast: "normal",
  reduce_animations: false,
  density: "comfortable",
  language: "fr",
  autoplay_audio: false,
  autoplay_video: false,
  // Notifications
  notifications_enabled: true,
  notif_verse: true,
  notif_verse_time: "07:00",
  notif_verse_days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
  notif_announcements: true,
  notif_events: true,
  notif_news: true,
  notif_important: true,
  notif_email: true,
  notif_push: true,
  notif_sound: true,
  notif_lock_preview: true,
  notif_new_version: true,
  notif_new_connection: true,
  notif_likes: true,
  notif_comments: true,
  notif_messages: true,
  notif_mentions: true,
  // Accessibilité
  notif_subtitles: false,
  tts: false,
  // Confidentialité
  profile_private: false,
  location_personalization: false,
  presence_visible: true,
  // Fuseau horaire du navigateur — lu par les fonctions backend (ex. : envoi
  // du verset du jour à l'heure locale de l'utilisateur). Défaut Europe/Paris.
  tz:
    (typeof Intl !== "undefined" &&
      Intl.DateTimeFormat().resolvedOptions().timeZone) ||
    "Europe/Paris",
};

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || {};
  } catch {
    return {};
  }
}

const PreferencesContext = createContext(null);

export function PreferencesProvider({ children }) {
  const { user } = useAuth();
  const { setTheme } = useTheme();
  const [prefs, setPrefs] = useState(() => {
    const ls = loadLocal();
    const t =
      (typeof window !== "undefined" && localStorage.getItem("chay-theme")) ||
      DEFAULT_PREFS.theme;
    return { ...DEFAULT_PREFS, theme: t, ...ls };
  });
  const [saving, setSaving] = useState(false);
  const prefsRef = useRef(prefs);
  const loaded = useRef(false);

  useEffect(() => {
    prefsRef.current = prefs;
  }, [prefs]);

  // Chargement depuis le compte à la première dispo de l'utilisateur
  useEffect(() => {
    if (user && !loaded.current) {
      loaded.current = true;
      const s =
        user.settings && typeof user.settings === "object" ? user.settings : {};
      const merged = { ...DEFAULT_PREFS, ...loadLocal(), ...s };
      prefsRef.current = merged;
      setPrefs(merged);
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(merged));
        if (s.theme) localStorage.setItem("chay-theme", s.theme);
      } catch {
        /* ignore */
      }
    }
  }, [user]);

  // Application du thème
  useEffect(() => {
    if (prefs.theme) setTheme(prefs.theme);
  }, [prefs.theme, setTheme]);

  // Application des data-attributs d'affichage
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.textSize = prefs.text_size;
    root.dataset.contrast = prefs.contrast;
    root.dataset.density = prefs.density;
    root.classList.toggle("reduce-animations", !!prefs.reduce_animations);
  }, [prefs.text_size, prefs.contrast, prefs.density, prefs.reduce_animations]);

  const persistToAccount = useCallback(
    (next) => {
      if (!user) return;
      setSaving(true);
      base44.auth
        .updateMe({ settings: next })
        .then(() => setSaving(false))
        .catch(() => setSaving(false));
    },
    [user]
  );

  const setPref = useCallback(
    (key, value) => {
      const next = { ...prefsRef.current, [key]: value };
      prefsRef.current = next;
      setPrefs(next);
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      if (key === "theme") {
        try {
          localStorage.setItem("chay-theme", value);
        } catch {
          /* ignore */
        }
      }
      persistToAccount(next);
    },
    [persistToAccount]
  );

  return (
    <PreferencesContext.Provider value={{ prefs, setPref, saving }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) return { prefs: DEFAULT_PREFS, setPref: () => {}, saving: false };
  return ctx;
}

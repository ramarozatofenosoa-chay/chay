import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import EntityCrud from "@/components/admin/EntityCrud";
import {
  BookOpen,
  Headphones,
  Film,
  Music,
  FileText,
  Youtube,
  Image as ImageIcon,
  Bell,
  HelpCircle,
  Mail,
  Loader2,
} from "lucide-react";

const LANGS = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "mg", label: "Malagasy" },
];

const SECTIONS = [
  {
    key: "Devotional",
    label: "Dévotionnels",
    icon: BookOpen,
    sort: "-reading_date",
    listColumns: ["title", "reading_date"],
    fields: [
      { name: "title", label: "Titre", type: "text", required: true },
      { name: "scripture_reference", label: "Référence", type: "text", required: true },
      { name: "verse_text", label: "Verset", type: "textarea" },
      { name: "content", label: "Contenu", type: "textarea", required: true },
      { name: "reading_date", label: "Date", type: "date", required: true },
      { name: "image_url", label: "Image", type: "file", accept: "image/*" },
      { name: "language", label: "Langue", type: "select", options: LANGS },
    ],
  },
  {
    key: "Sermon",
    label: "Prédications",
    icon: Headphones,
    sort: "-date",
    listColumns: ["title", "speaker", "date"],
    fields: [
      { name: "title", label: "Titre", type: "text", required: true },
      { name: "speaker", label: "Prédicateur", type: "text", required: true },
      { name: "date", label: "Date", type: "date", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "category", label: "Catégorie", type: "text" },
      { name: "language", label: "Langue", type: "select", options: LANGS },
      { name: "cover_url", label: "Couverture", type: "file", accept: "image/*" },
      { name: "audio_url", label: "Audio", type: "file", accept: "audio/*" },
      { name: "bible_references", label: "Références bibliques", type: "text" },
      { name: "duration_minutes", label: "Durée (min)", type: "number" },
    ],
  },
  {
    key: "MusicTrack",
    label: "Musique",
    icon: Music,
    sort: "-created_date",
    listColumns: ["title", "artist"],
    fields: [
      { name: "title", label: "Titre", type: "text", required: true },
      { name: "artist", label: "Artiste", type: "text", required: true },
      { name: "album", label: "Album", type: "text" },
      { name: "category", label: "Catégorie", type: "text" },
      { name: "language", label: "Langue", type: "select", options: LANGS },
      { name: "cover_url", label: "Couverture", type: "file", accept: "image/*" },
      { name: "audio_url", label: "Audio", type: "file", accept: "audio/*" },
      { name: "duration_seconds", label: "Durée (s)", type: "number" },
    ],
  },
  {
    key: "Video",
    label: "Vidéos",
    icon: Film,
    sort: "-created_date",
    listColumns: ["title"],
    fields: [
      { name: "title", label: "Titre", type: "text", required: true },
      { name: "video_url", label: "Vidéo", type: "file", accept: "video/*", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "category", label: "Catégorie", type: "text" },
      { name: "language", label: "Langue", type: "select", options: LANGS },
      { name: "cover_url", label: "Couverture", type: "file", accept: "image/*" },
      { name: "duration_seconds", label: "Durée (s)", type: "number" },
    ],
  },
  {
    key: "Article",
    label: "Articles",
    icon: FileText,
    sort: "-created_date",
    listColumns: ["title", "category"],
    fields: [
      { name: "title", label: "Titre", type: "text", required: true },
      { name: "body", label: "Contenu", type: "textarea", required: true },
      { name: "excerpt", label: "Extrait", type: "textarea" },
      { name: "cover_url", label: "Couverture", type: "file", accept: "image/*" },
      { name: "category", label: "Catégorie", type: "text" },
      { name: "author", label: "Auteur", type: "text" },
    ],
  },
  {
    key: "YouTubeVideo",
    label: "YouTube",
    icon: Youtube,
    sort: "-created_date",
    listColumns: ["title", "category"],
    fields: [
      { name: "title", label: "Titre", type: "text", required: true },
      { name: "youtube_id", label: "ID YouTube", type: "text", required: true },
      { name: "category", label: "Catégorie", type: "text" },
      { name: "thumbnail_url", label: "Miniature", type: "file", accept: "image/*" },
    ],
  },
  {
    key: "GalleryImage",
    label: "Galerie",
    icon: ImageIcon,
    sort: "-created_date",
    listColumns: ["title", "category"],
    fields: [
      { name: "title", label: "Titre", type: "text", required: true },
      { name: "image_url", label: "Image", type: "file", required: true, accept: "image/*" },
      { name: "category", label: "Catégorie", type: "text" },
    ],
  },
  {
    key: "Announcement",
    label: "Annonces",
    icon: Bell,
    sort: "-date",
    listColumns: ["title", "date"],
    fields: [
      { name: "title", label: "Titre", type: "text", required: true },
      { name: "body", label: "Texte", type: "textarea", required: true },
      { name: "date", label: "Date", type: "date", required: true },
      {
        name: "type",
        label: "Type",
        type: "select",
        options: [
          { value: "event", label: "Événement" },
          { value: "news", label: "Actualité" },
          { value: "reminder", label: "Rappel" },
        ],
      },
      { name: "language", label: "Langue", type: "select", options: LANGS },
    ],
  },
  {
    key: "Faq",
    label: "FAQ",
    icon: HelpCircle,
    sort: "order",
    listColumns: ["question"],
    fields: [
      { name: "question", label: "Question", type: "text", required: true },
      { name: "answer", label: "Réponse", type: "textarea", required: true },
      { name: "order", label: "Ordre", type: "number" },
    ],
  },
  {
    key: "ContactMessage",
    label: "Messages",
    icon: Mail,
    sort: "-created_date",
    listColumns: ["name", "subject"],
    detailField: "message",
    readOnly: true,
    fields: [],
  },
];

export default function Admin() {
  const { user } = useAuth();
  const [active, setActive] = useState(SECTIONS[0].key);

  if (!user) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
      </div>
    );
  }
  if (user.role !== "admin") {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="text-foreground/60">Accès réservé aux administrateurs.</p>
      </div>
    );
  }

  const section = SECTIONS.find((s) => s.key === active);

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-8 py-6 md:py-10">
      <header className="mb-6">
        <h1 className="display-fluid">
          <span className="brand-gradient-text">Administration</span>
        </h1>
        <p className="mt-2 text-foreground/60">
          Gérez tout le contenu de l'application.
        </p>
      </header>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-5">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap transition ${
                active === s.key
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" /> {s.label}
            </button>
          );
        })}
      </div>

      <section className="rounded-[2rem] border border-border bg-background/40 p-5 md:p-6">
        <EntityCrud
          key={section.key}
          entity={section.key}
          fields={section.fields}
          listColumns={section.listColumns}
          sort={section.sort}
          readOnly={section.readOnly}
          detailField={section.detailField}
        />
      </section>
    </div>
  );
}
import {
  Radio,
  Music,
  Headphones,
  Film,
  FileText,
  Youtube,
  Image as ImageIcon,
  ListMusic,
  Library,
} from "lucide-react";

export const RADIO_URL = "https://link.radioking.com/chay-fr";

export const CATEGORIES = [
  { id: "radio", label: "Radio", icon: Radio, tone: "from-[#FF4D2D] to-[#FF57B2]", href: RADIO_URL },
  { id: "music", label: "Musique", icon: Music, tone: "from-[#4A6CFE] to-[#8A56E2]" },
  { id: "sermons", label: "Prédication", icon: Headphones, tone: "from-[#2E6F40] to-[#4A6CFE]" },
  { id: "videos", label: "Vidéos", icon: Film, tone: "from-[#8A56E2] to-[#FF57B2]" },
  { id: "articles", label: "Articles", icon: FileText, tone: "from-[#FF4D2D] to-[#8A56E2]" },
  { id: "youtube", label: "YouTube", icon: Youtube, tone: "from-[#FF4D2D] to-[#FF57B2]" },
  { id: "gallery", label: "Galerie", icon: ImageIcon, tone: "from-[#4A6CFE] to-[#2E6F40]" },
  { id: "playlist", label: "Votre Playlist", icon: ListMusic, tone: "from-[#8A56E2] to-[#4A6CFE]" },
  { id: "playlists", label: "Playlists", icon: Library, tone: "from-[#2E6F40] to-[#8A56E2]" },
];
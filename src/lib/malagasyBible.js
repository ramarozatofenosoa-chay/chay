// Source de la Bible malgache (Baiboly Malagasy 1865) via l'API publique
// https://back.baiboly.antonionavira.mg — sans clé, CORS ouvert.
//
// L'API expose deux testaments :
//   - testameta_taloha  (Ancien Testament, 39 livres)
//   - testameta_vaovao  (Nouveau Testament, 27 livres)
// Versets : POST /versets/<testament> avec { book, chapter, start, end }.
// La réponse renvoie data.text = [ { "1": "...", }, { "2": "..." }, ... ].

const API_BASE = "https://back.baiboly.antonionavira.mg/api/public";

// Catalogue canonique (ordre protestant) — slugs = noms renvoyés par l'API,
// `name` = affichage malgasy, `chapters` = nombre de chapitres (canon standard).
const MALAGASY_BOOKS = [
  // Ancien Testament
  { slug: "genesisy", name: "Genesisy", chapters: 50, testament: "ot" },
  { slug: "eksodosy", name: "Eksodosy", chapters: 40, testament: "ot" },
  { slug: "levitikosy", name: "Levitikosy", chapters: 27, testament: "ot" },
  { slug: "nomery", name: "Nomery", chapters: 36, testament: "ot" },
  { slug: "deoteronomia", name: "Deoteronomia", chapters: 34, testament: "ot" },
  { slug: "josoa", name: "Josoa", chapters: 24, testament: "ot" },
  { slug: "mpitsara", name: "Mpitsara", chapters: 21, testament: "ot" },
  { slug: "rota", name: "Rota", chapters: 4, testament: "ot" },
  { slug: "samoela-voalohany", name: "1 Samoela", chapters: 31, testament: "ot" },
  { slug: "samoela-faharoa", name: "2 Samoela", chapters: 24, testament: "ot" },
  { slug: "mpanjaka-voalohany", name: "1 Mpanjaka", chapters: 22, testament: "ot" },
  { slug: "mpanjaka-faharoa", name: "2 Mpanjaka", chapters: 25, testament: "ot" },
  { slug: "tantara-voalohany", name: "1 Tantara", chapters: 29, testament: "ot" },
  { slug: "tantara-faharoa", name: "2 Tantara", chapters: 36, testament: "ot" },
  { slug: "ezra", name: "Ezra", chapters: 10, testament: "ot" },
  { slug: "nehemia", name: "Nehemia", chapters: 13, testament: "ot" },
  { slug: "estera", name: "Estera", chapters: 10, testament: "ot" },
  { slug: "joba", name: "Joba", chapters: 42, testament: "ot" },
  { slug: "salamo", name: "Salamo", chapters: 150, testament: "ot" },
  { slug: "ohabolana", name: "Ohabolana", chapters: 31, testament: "ot" },
  { slug: "mpitoriteny", name: "Mpitoriteny", chapters: 12, testament: "ot" },
  { slug: "tononkirani-solomona", name: "Tononkiran'i Solomona", chapters: 8, testament: "ot" },
  { slug: "isaia", name: "Isaia", chapters: 66, testament: "ot" },
  { slug: "jeremia", name: "Jeremia", chapters: 52, testament: "ot" },
  { slug: "fitomaniana", name: "Fitomaniana", chapters: 5, testament: "ot" },
  { slug: "ezekiela", name: "Ezekiala", chapters: 48, testament: "ot" },
  { slug: "daniela", name: "Daniela", chapters: 12, testament: "ot" },
  { slug: "hosea", name: "Hosea", chapters: 14, testament: "ot" },
  { slug: "joela", name: "Joela", chapters: 3, testament: "ot" },
  { slug: "amosa", name: "Amosa", chapters: 9, testament: "ot" },
  { slug: "obadia", name: "Obadia", chapters: 1, testament: "ot" },
  { slug: "jona", name: "Jona", chapters: 4, testament: "ot" },
  { slug: "mika", name: "Mika", chapters: 7, testament: "ot" },
  { slug: "nahoma", name: "Nahoma", chapters: 3, testament: "ot" },
  { slug: "habakoka", name: "Habakoka", chapters: 3, testament: "ot" },
  { slug: "zefania", name: "Zefania", chapters: 3, testament: "ot" },
  { slug: "hagay", name: "Hagay", chapters: 2, testament: "ot" },
  { slug: "zakaria", name: "Zakaria", chapters: 14, testament: "ot" },
  { slug: "malakia", name: "Malakia", chapters: 4, testament: "ot" },
  // Nouveau Testament
  { slug: "matio", name: "Matio", chapters: 28, testament: "nt" },
  { slug: "marka", name: "Marka", chapters: 16, testament: "nt" },
  { slug: "lioka", name: "Lioka", chapters: 24, testament: "nt" },
  { slug: "jaona", name: "Jaona", chapters: 21, testament: "nt" },
  { slug: "asany-apostoly", name: "Asan'ny Apostoly", chapters: 28, testament: "nt" },
  { slug: "romanina", name: "Romanina", chapters: 16, testament: "nt" },
  { slug: "1-korintianina", name: "1 Korintianina", chapters: 16, testament: "nt" },
  { slug: "2-korintianina", name: "2 Korintianina", chapters: 13, testament: "nt" },
  { slug: "galatianina", name: "Galatianina", chapters: 6, testament: "nt" },
  { slug: "efesianina", name: "Efesianina", chapters: 6, testament: "nt" },
  { slug: "filipianina", name: "Filipianina", chapters: 4, testament: "nt" },
  { slug: "kolosianina", name: "Kolosianina", chapters: 4, testament: "nt" },
  { slug: "1-tesalonianina", name: "1 Tesalonianina", chapters: 5, testament: "nt" },
  { slug: "2-tesalonianina", name: "2 Tesalonianina", chapters: 3, testament: "nt" },
  { slug: "1-timoty", name: "1 Timoty", chapters: 6, testament: "nt" },
  { slug: "2-timoty", name: "2 Timoty", chapters: 4, testament: "nt" },
  { slug: "titosy", name: "Titosy", chapters: 3, testament: "nt" },
  { slug: "filemona", name: "Filemona", chapters: 1, testament: "nt" },
  { slug: "hebreo", name: "Hebreo", chapters: 13, testament: "nt" },
  { slug: "jakoba", name: "Jakoba", chapters: 5, testament: "nt" },
  { slug: "1-petera", name: "1 Petera", chapters: 5, testament: "nt" },
  { slug: "2-petera", name: "2 Petera", chapters: 3, testament: "nt" },
  { slug: "1-jaona", name: "1 Jaona", chapters: 5, testament: "nt" },
  { slug: "2-jaona", name: "2 Jaona", chapters: 1, testament: "nt" },
  { slug: "3-jaona", name: "3 Jaona", chapters: 1, testament: "nt" },
  { slug: "joda", name: "Joda", chapters: 1, testament: "nt" },
  { slug: "apokalypsy", name: "Apokalypsy", chapters: 22, testament: "nt" },
];

// Liste des livres au format attendu par le lecteur.
export function getMalagasyBooks() {
  return MALAGASY_BOOKS.map((b, i) => ({
    id: b.slug,
    name: b.name,
    order: i + 1,
    numberOfChapters: b.chapters,
  }));
}

// Récupère tous les versets d'un chapitre pour la Bible malgache.
export async function fetchMalagasyChapter(book, chapter) {
  const entry = MALAGASY_BOOKS.find((b) => b.slug === book?.id);
  if (!entry) throw new Error("Livre malgasy introuvable.");
  const testament = entry.testament === "ot" ? "testameta_taloha" : "testameta_vaovao";
  const res = await fetch(`${API_BASE}/versets/${testament}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ book: entry.slug, chapter, start: 1, end: 300 }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json?.statut !== 200) throw new Error(json?.message || "Erreur de la source malgache.");
  const textArr = json?.data?.text || [];
  const verses = [];
  textArr.forEach((obj) => {
    if (!obj || typeof obj !== "object") return;
    Object.entries(obj).forEach(([k, v]) => {
      const n = Number(k);
      if (n >= 1 && typeof v === "string") {
        const text = v.replace(/\s+/g, " ").trim();
        if (text.length) verses.push({ number: n, text });
      }
    });
  });
  verses.sort((a, b) => a.number - b.number);
  return verses;
}
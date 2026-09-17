import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { normalizeSearchText } from '../../shared/bibleNormalize.ts';
import { MALAGASY_BOOKS } from '../../shared/malagasyBooks.ts';

const HELLOAO_BASE = 'https://bible.helloao.org/api/fra_lsg';
const MALAGASY_API = 'https://back.baiboly.antonionavira.mg/api/public';
const MAX_CHAPTERS_PER_CALL = 25;
const BULK_CHUNK = 400;

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Catalogue canonique (ordre 1-66) avec id/livre et nombre de chapitres.
async function getLsgCatalog() {
  const res = await fetch(`${HELLOAO_BASE}/books.json`);
  if (!res.ok) throw new Error(`HTTP ${res.status} (helloao books)`);
  const data = await res.json();
  return (data?.books || [])
    .map((b) => ({ id: b.id, name: b.commonName || b.name, order: Number(b.order), chapters: Number(b.numberOfChapters) }))
    .filter((b) => b.id && b.chapters > 0)
    .sort((a, b) => a.order - b.order);
}

function getMalagasyCatalog() {
  return MALAGASY_BOOKS.map((b, i) => ({ id: b.slug, name: b.name, order: i + 1, chapters: b.chapters, testament: b.testament }));
}

// Récupère les versets d'un chapitre pour une traduction donnée.
async function fetchChapter(translation, book, chapter) {
  if (translation === 'lsg1910') {
    const res = await fetch(`${HELLOAO_BASE}/${book.id}/${chapter}.simple.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status} (helloao chapter)`);
    const data = await res.json();
    const content = data?.chapter?.content || [];
    return content
      .filter((i) => i?.type === 'verse')
      .map((i) => ({ number: Number(i.number), text: String(i.text || '').replace(/\s+/g, ' ').trim() }))
      .filter((v) => v.text);
  }
  const testament = book.testament === 'ot' ? 'testameta_taloha' : 'testameta_vaovao';
  const res = await fetch(`${MALAGASY_API}/versets/${testament}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ book: book.id, chapter, start: 1, end: 300 }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} (malagasy)`);
  const json = await res.json();
  if (json?.statut !== 200) throw new Error(json?.message || 'Erreur source malgache');
  const rows = [];
  (json?.data?.text || []).forEach((obj) => {
    if (!obj || typeof obj !== 'object') return;
    Object.entries(obj).forEach(([k, v]) => {
      const n = Number(k);
      if (n >= 1 && typeof v === 'string') {
        const text = v.replace(/\s+/g, ' ').trim();
        if (text) rows.push({ number: n, text });
      }
    });
  });
  return rows;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const translation = body?.translation;
    if (translation !== 'lsg1910' && translation !== 'malagasy') {
      return Response.json({ error: 'translation invalide' }, { status: 400 });
    }

    const existing = await base44.asServiceRole.entities.BibleTranslation.filter({ translation_id: translation });
    let record = Array.isArray(existing) && existing.length ? existing[0] : null;
    if (!record) {
      record = await base44.asServiceRole.entities.BibleTranslation.create({
        translation_id: translation,
        name: translation === 'lsg1910' ? 'Louis Segond 1910' : 'Baiboly Malagasy 1865',
        language: translation === 'lsg1910' ? 'fr' : 'mg',
        source: translation === 'lsg1910' ? 'helloao.org (fra_lsg)' : 'baiboly.antonionavira.mg',
        license: translation === 'lsg1910'
          ? 'Texte Louis Segond 1910 — domaine public.'
          : 'Baiboly Malagasy 1865 — droits à confirmer avant activation.',
        version: '1',
        status: 'syncing',
        isActive: true,
        verseCount: 0,
        syncCursorBookOrder: 1,
        syncCursorChapter: 1,
      });
    } else {
      await base44.asServiceRole.entities.BibleTranslation.update(record.id, { status: 'syncing' });
    }

    const resetCursor = !!body?.resetCursor;
    let bookOrder = resetCursor ? 1 : (record.syncCursorBookOrder || 1);
    let chapter = resetCursor ? 1 : (record.syncCursorChapter || 1);
    if (bookOrder < 1) { bookOrder = 1; chapter = 1; }

    const catalog = translation === 'lsg1910' ? await getLsgCatalog() : getMalagasyCatalog();
    const language = translation === 'lsg1910' ? 'fr' : 'mg';

    let processed = 0;
    let versesImported = 0;
    const errors = [];
    while (processed < MAX_CHAPTERS_PER_CALL && bookOrder <= 66) {
      const book = catalog.find((b) => b.order === bookOrder);
      if (!book) { bookOrder += 1; chapter = 1; continue; }
      if (chapter > book.chapters) { bookOrder += 1; chapter = 1; continue; }
      try {
        const verses = await fetchChapter(translation, book, chapter);
        const rows = verses.map((v) => ({
          translation, book: book.name, bookOrder, chapter, verse: v.number,
          text: v.text, normalizedText: normalizeSearchText(v.text, language),
        }));
        if (rows.length) {
          // Clé unique translation + bookOrder + chapter + verse : on supprime
          // puis recrée le chapitre pour éviter tout doublon.
          await base44.asServiceRole.entities.BibleVerse.deleteMany({ translation, bookOrder, chapter });
          for (const g of chunk(rows, BULK_CHUNK)) {
            await base44.asServiceRole.entities.BibleVerse.bulkCreate(g);
          }
          versesImported += rows.length;
        }
      } catch (e) {
        errors.push(`${book.name} ${chapter}: ${e.message}`);
      }
      chapter += 1;
      processed += 1;
    }

    const done = bookOrder > 66;
    const newCount = (resetCursor ? 0 : (record.verseCount || 0)) + versesImported;

    await base44.asServiceRole.entities.BibleTranslation.update(record.id, {
      status: done ? 'ready' : 'partial',
      verseCount: newCount,
      lastSyncedAt: new Date().toISOString(),
      syncCursorBookOrder: done ? 67 : bookOrder,
      syncCursorChapter: done ? 1 : chapter,
    });

    return Response.json({
      versesImported, booksProcessed: Math.min(bookOrder - 1, 66),
      cursor: { bookOrder: done ? 67 : bookOrder, chapter: done ? 1 : chapter },
      done, verseCount: newCount, status: done ? 'ready' : 'partial', errors,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
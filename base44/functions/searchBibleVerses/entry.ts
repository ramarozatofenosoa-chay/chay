import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { normalizeSearchText } from '../../shared/bibleNormalize.ts';

const MAX_QUERY_LENGTH = 100;
const PAGE_SIZE = 5000;

// Cache en mémoire des versets par traduction (la donnée est statique).
// Le premier appel charge tous les versets par pages de 5000 ; les appels
// suivants réutilisent le cache pour une recherche instantanée.
const verseCache = {};

async function loadAllVerses(base44, translation) {
  if (verseCache[translation]) return verseCache[translation];
  const all = [];
  let skip = 0;
  while (true) {
    const batch = await base44.asServiceRole.entities.BibleVerse.filter(
      { translation },
      'bookOrder',
      PAGE_SIZE,
      skip
    );
    if (!Array.isArray(batch) || batch.length === 0) break;
    for (const v of batch) {
      all.push({
        book: v.book, bookOrder: v.bookOrder, chapter: v.chapter,
        verse: v.verse, text: v.text, normalizedText: v.normalizedText,
      });
    }
    if (batch.length < PAGE_SIZE) break;
    skip += PAGE_SIZE;
  }
  verseCache[translation] = all;
  return all;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const rawQuery = String(body?.query || '').trim().replace(/\s+/g, ' ').slice(0, MAX_QUERY_LENGTH);
    const translation = body?.translation === 'malagasy' ? 'malagasy' : 'lsg1910';
    const limit = Math.min(Math.max(Number(body?.limit) || 20, 1), 100);
    const offset = Math.max(Number(body?.offset) || 0, 0);

    if (rawQuery.replace(/\s/g, '').length < 2) {
      return Response.json({ total: 0, items: [], hasMore: false, error: 'query_too_short' });
    }

    const transRecords = await base44.asServiceRole.entities.BibleTranslation.filter({ translation_id: translation });
    const transRecord = Array.isArray(transRecords) && transRecords.length ? transRecords[0] : null;
    const status = transRecord?.status || 'not_configured';
    if (status !== 'ready' && status !== 'partial') {
      return Response.json({ total: 0, items: [], hasMore: false, translationStatus: status });
    }

    const language = translation === 'malagasy' ? 'mg' : 'fr';
    const normalizedQuery = normalizeSearchText(rawQuery, language);
    const all = await loadAllVerses(base44, translation);

    const matches = [];
    for (const v of all) {
      if (v.normalizedText && v.normalizedText.includes(normalizedQuery)) {
        matches.push({
          translation, book: v.book, bookOrder: v.bookOrder,
          chapter: v.chapter, verse: v.verse, text: v.text,
        });
      }
    }
    // Tri canonique : bookOrder (Genèse → Apocalypse), chapitre, verset.
    matches.sort((a, b) => a.bookOrder - b.bookOrder || a.chapter - b.chapter || a.verse - b.verse);

    const total = matches.length;
    const items = matches.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return Response.json({ total, items, hasMore, translationStatus: status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
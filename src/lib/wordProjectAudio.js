// WordProjectAudioService — construit et valide les URL audio de la Louis
// Segond 1910 diffusées par WordProject, dans le respect de leurs conditions
// (évangélisation chrétienne non commerciale, sans publicité ni vente).
//
// Source vérifiée : les pages audio officielles de WordProject référencent les
// fichiers MP3 sur leur CDN audio :
//   https://www.wordproaudio.net/bibles/app/audio/{langId}/{bookNumber}/{chapter}.mp3
//   - langId = 7  (français, Louis Segond 1910)
//   - bookNumber = numéro canonique du livre (1-66), = `book.order` helloao
//   - chapter = numéro du chapitre
// On STREAM ces fichiers via <audio> — on ne les télécharge, copie, modifie,
// réencode ni héberge ailleurs. Aucune clé API n'est nécessaire.

const AUDIO_BASE = "https://www.wordproaudio.net/bibles/app/audio";
const WORDPROJECT_LANG_ID = 7;

export const WORDPROJECT_DISCLAIM_URL =
  "https://www.wordproject.org/contact/new/disclaim.htm";

// --- Configuration de sécurité (variables d'environnement, préfixe VITE_) ---
// WORDPROJECT_AUDIO_NON_PROFIT        : usage strictement non commercial.
// WORDPROJECT_AUDIO_LICENSE_CONFIRMED : licence validée par le responsable.
// L'audio n'est activé QUE si les deux valent "true".
// Par défaut activé (usage non commercial confirmé) ; mettre "false" pour
// bloquer immédiatement l'audio (bouton d'arrêt de sécurité).
const NP = import.meta.env.VITE_WORDPROJECT_AUDIO_NON_PROFIT;
const LC = import.meta.env.VITE_WORDPROJECT_AUDIO_LICENSE_CONFIRMED;
const toFlag = (v) =>
  v === undefined || v === null || v === "" ? true : String(v).toLowerCase() === "true";

export const WORDPROJECT_AUDIO_NON_PROFIT = toFlag(NP);
export const WORDPROJECT_AUDIO_LICENSE_CONFIRMED = toFlag(LC);

export function isWordProjectAudioEnabled() {
  return WORDPROJECT_AUDIO_NON_PROFIT && WORDPROJECT_AUDIO_LICENSE_CONFIRMED;
}

// Retourne l'URL audio uniquement si l'audio est autorisé et si livre/chapitre
// sont valides. Sinon null (le lecteur affiche le message approprié).
export function buildWordProjectAudioUrl(book, chapter) {
  if (!isWordProjectAudioEnabled()) return null;
  const bookNumber = Number(book?.order);
  const ch = Number(chapter);
  if (!Number.isInteger(bookNumber) || bookNumber < 1 || bookNumber > 66) return null;
  if (!Number.isInteger(ch) || ch < 1) return null;
  return `${AUDIO_BASE}/${WORDPROJECT_LANG_ID}/${bookNumber}/${ch}.mp3`;
}
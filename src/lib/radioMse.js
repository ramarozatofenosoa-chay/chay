// Lecteur radio en direct basé sur Media Source Extensions (MSE).
//
// Pourquoi ce module existe :
//   Avec un simple <audio src="…flux en direct…">, Chrome estime avoir « assez »
//   après ~2,2 s et arrête de télécharger : il jette le backlog (~8,5 s mesurés)
//   que le serveur lâche à la connexion. En lisant les octets nous-mêmes, on
//   récupère ce backlog et on obtient un vrai tampon (~9 s) SANS retarder le
//   démarrage de la lecture.
//
// Mesures à l'appui (flux 128 kbps = 16 000 o/s) :
//   - connexion → 12,3 s de son reçues en 4 s (backlog ~8,3 s), puis 1× exact
//   - CORS : access-control-allow-origin: * ; format : audio/mpeg (MP3)
//   - MediaSource.isTypeSupported("audio/mpeg") === true
//
// Repli :
//   Si MSE ou le format MP3 n'est pas géré, isRadioMseSupported() renvoie false
//   et RadioContext utilise le chemin <audio> historique (inchangé).

const MIME = "audio/mpeg";
const KEEP_BEHIND_S = 30; // secondes conservées derrière le point d'écoute
const QUOTA_FLUSH_S = 5; // recul imposé si le tampon déborde

export function isRadioMseSupported() {
  try {
    return (
      typeof window !== "undefined" &&
      typeof window.MediaSource !== "undefined" &&
      typeof window.MediaSource.isTypeSupported === "function" &&
      typeof window.fetch === "function" &&
      window.MediaSource.isTypeSupported(MIME)
    );
  } catch {
    return false;
  }
}

/**
 * Ouvre le flux radio et alimente un <audio> via MediaSource.
 *
 * @param {HTMLAudioElement} audio
 * @param {string} url
 * @param {{ onFailed?: () => void }} [options] rappel appelé si le flux casse
 * @returns {{ stop: () => void } | null} null si MSE n'est pas disponible
 */
export function startRadioStream(audio, url, { onFailed } = {}) {
  if (!audio || !isRadioMseSupported()) return null;

  let cancelled = false;
  let mediaSource = null;
  let sourceBuffer = null;
  let objectUrl = null;
  let reader = null;
  let queue = [];

  const pump = () => {
    if (cancelled || !sourceBuffer || sourceBuffer.updating) return;

    // Mémoire : on ne garde que ce qui est derrière le point d'écoute.
    // Sans ça, buffered.end croît indéfiniment (on reçoit depuis le début).
    try {
      if (sourceBuffer.buffered.length) {
        const from = sourceBuffer.buffered.start(0);
        const limit = audio.currentTime - KEEP_BEHIND_S;
        if (limit > from + 5) {
          sourceBuffer.remove(from, limit); // updateend relancera pump()
          return;
        }
      }
    } catch {}

    if (!queue.length) return;
    const chunk = queue.shift();
    try {
      sourceBuffer.appendBuffer(chunk);
    } catch (e) {
      // Le tampon déborde : on fait de la place, puis on remet le chunk
      // en tête pour le réessayer au prochain updateend.
      if (e && e.name === "QuotaExceededError") {
        queue.unshift(chunk);
        try {
          const from = sourceBuffer.buffered.start(0);
          const limit = audio.currentTime - QUOTA_FLUSH_S;
          if (limit > from) sourceBuffer.remove(from, limit);
        } catch {}
      }
    }
  };

  const fail = () => {
    if (cancelled) return;
    // On laisse RadioContext déclencher sa reprise (même chemin qu'une erreur).
    if (typeof onFailed === "function") onFailed();
  };

  const readStream = async () => {
    try {
      const res = await fetch(url);
      if (!res.ok || !res.body) throw new Error("Flux radio indisponible (" + res.status + ")");
      reader = res.body.getReader();
      while (!cancelled) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value || !value.length) continue;
        queue.push(value);
        pump();
      }
      if (!cancelled) fail();
    } catch {
      // Réseau coupé ou flux fermé : on laisse la lecture se poursuivre depuis
      // le tampon, et RadioContext relancera proprement si ça persiste.
      if (!cancelled) fail();
    }
  };

  const onSourceOpen = () => {
    if (cancelled) return;
    try {
      sourceBuffer = mediaSource.addSourceBuffer(MIME);
      sourceBuffer.addEventListener("updateend", pump);
      readStream();
    } catch {
      fail();
    }
  };

  const cleanup = () => {
    cancelled = true;
    try {
      if (reader) reader.cancel();
    } catch {}
    reader = null;
    queue = [];
    try {
      if (mediaSource) mediaSource.removeEventListener("sourceopen", onSourceOpen);
    } catch {}
    try {
      if (sourceBuffer) sourceBuffer.removeEventListener("updateend", pump);
    } catch {}
    sourceBuffer = null;
    try {
      if (mediaSource && mediaSource.readyState === "open") mediaSource.endOfStream();
    } catch {}
    mediaSource = null;
    if (objectUrl) {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {}
      objectUrl = null;
    }
  };

  try {
    mediaSource = new MediaSource();
    objectUrl = URL.createObjectURL(mediaSource);
    mediaSource.addEventListener("sourceopen", onSourceOpen);
    audio.src = objectUrl;
    audio.load();
  } catch {
    cleanup();
    return null;
  }

  return { stop: cleanup };
}

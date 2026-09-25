import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, MessageCircle, Send, Loader2 } from "lucide-react";
import { useBackHandler } from "@/hooks/useBackHandler";
import { parseWixMediaUrl, buildTransformUrl } from "@/components/ui/image-helpers";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

// Les commentaires de photo réutilisent l'entité Comment (déjà utilisée par
// la Communauté). Le champ `post_id` reçoit un préfixe « gallery: » pour ne
// jamais entrer en collision avec l'identifiant d'un vrai post.
const commentKey = (id) => `gallery:${id}`;

const commentDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

export default function GalleryViewer({ items = [], index, onClose }) {
  const { user } = useAuth();

  const [i, setI] = useState(index || 0);
  // Synchronisation de l'index pendant le rendu (et non dans un useEffect) :
  // l'état `i` est corrigé AVANT le premier rendu, donc toucher la photo n°3
  // n'affiche jamais la photo n°0 pendant une frame. Avec `key={i}` sur l'image,
  // un rendu « faux » forçait un remontage + un rechargement du fichier —
  // c'était le petit clignotement à la touche. À la fermeture (index = null)
  // on ne réinitialise PAS `i` : la photo affichée reste stable pendant
  // l'animation de sortie au lieu de basculer sur la première.
  const [prevIndex, setPrevIndex] = useState(index);
  if (index !== prevIndex) {
    setPrevIndex(index);
    if (index !== null && index !== undefined) setI(index);
  }
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  // ── Anti-clignotement ──────────────────────────────────────────────────
  // 1. On ne montre l'image qu'une fois entièrement téléchargée : un gros
  //    JPEG se peint par à-coups (progressif) et la photo « clignote »
  //    plusieurs secondes au moment du toucher.
  // 2. On demande une version à la taille de l'écran plutôt que l'original
  //    (souvent plusieurs Mo) : le chargement devient instantané.
  const imgRef = useRef(null);
  const [loadedSrc, setLoadedSrc] = useState(null);
  const [failedTransform, setFailedTransform] = useState(null);
  const [viewWidth] = useState(() =>
    Math.min(
      2400,
      Math.max(1200, Math.round((window.innerWidth || 1200) * Math.min(window.devicePixelRatio || 1, 2)))
    )
  );

  const touch = useRef(null);
  const swiped = useRef(false);
  const swipeTimer = useRef(null);

  const isOpen = index !== null && index !== undefined && items.length > 0;
  const current = isOpen ? items[i] : null;
  const key = current && current.id ? commentKey(current.id) : null;

  const sourceUrl = (current && current.image_url) || null;
  const parsedUrl = sourceUrl ? parseWixMediaUrl(sourceUrl) : null;
  const transformSrc = parsedUrl
    ? buildTransformUrl(parsedUrl, {
        width: viewWidth,
        height: undefined,
        crop: undefined,
        focalPoint: undefined,
        quality: 85,
      })
    : null;
  const displaySrc =
    transformSrc && failedTransform !== transformSrc ? transformSrc : sourceUrl;
  const isLoaded = Boolean(displaySrc && loadedSrc === displaySrc);

  // Une photo déjà en cache peut avoir fini de charger avant que React
  // n'ait pu capter onLoad : on vérifie l'état réel de l'élément.
  useEffect(() => {
    const el = imgRef.current;
    if (displaySrc && el && el.complete && el.naturalWidth > 0) setLoadedSrc(displaySrc);
  }, [displaySrc, i]);

  // Retour matériel : on ferme d'abord les commentaires, puis la photo.
  // (Le viewer n'est plus « toujours ouvert » : sinon il empilait une entrée
  // d'historique fantôme à chaque ouverture de la catégorie Galerie.)
  useBackHandler(isOpen, onClose);
  useBackHandler(showComments && isOpen, () => setShowComments(false));

  // Chargement des commentaires de la photo affichée.
  useEffect(() => {
    if (!key) {
      setComments([]);
      return;
    }
    let alive = true;
    setLoadingComments(true);
    base44.entities.Comment
      .filter({ post_id: key }, "-created_date", 50)
      .then((res) => { if (alive) setComments(Array.isArray(res) ? res : []); })
      .catch(() => { if (alive) setComments([]); })
      .finally(() => { if (alive) setLoadingComments(false); });
    return () => { alive = false; };
  }, [key]);

  useEffect(() => () => window.clearTimeout(swipeTimer.current), []);

  const go = (delta) =>
    setI((v) => (v + delta + items.length) % items.length);

  const prev = (e) => { e?.stopPropagation(); go(-1); };
  const next = (e) => { e?.stopPropagation(); go(1); };

  // ── Glissement horizontal au doigt ──────────────────────────────────────
  const onTouchStart = (e) => {
    // Un glissement commencé dans le panneau de commentaires ne doit pas
    // faire changer de photo (surtout pendant la frappe).
    if (e.target?.closest?.("[data-comments-panel]")) {
      touch.current = null;
      return;
    }
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e) => {
    const start = touch.current;
    touch.current = null;
    if (!start || items.length < 2) return;

    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy)) return;

    // On empêche le « clic » de fond (qui fermerait la visionneuse)
    // de se déclencher juste après le glissement.
    swiped.current = true;
    window.clearTimeout(swipeTimer.current);
    swipeTimer.current = window.setTimeout(() => { swiped.current = false; }, 400);

    if (dx < 0) go(1);
    else go(-1);
  };

  const onBackdropClick = () => {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    onClose?.();
  };

  // ── Commentaires ────────────────────────────────────────────────────────
  const authorName =
    user?.full_name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    "Membre";

  const send = async (e) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || !key || sending) return;

    setSending(true);
    try {
      const created = await base44.entities.Comment.create({
        post_id: key,
        text,
        author_name: authorName,
      });
      setComments((prev) => [
        created || {
          id: `tmp-${Date.now()}`,
          post_id: key,
          text,
          author_name: authorName,
          created_date: new Date().toISOString(),
        },
        ...prev,
      ]);
      setDraft("");
    } catch {
      // Le brouillon reste en place : l'utilisateur peut réessayer.
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black grid place-items-center"
          onClick={onBackdropClick}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Contrôles haut : commentaires + fermeture */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setShowComments(true); }}
              className="relative h-10 w-10 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Voir les commentaires"
            >
              <MessageCircle className="h-5 w-5" />
              {comments.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-primary text-white text-[10px] font-bold">
                  {comments.length > 99 ? "99+" : comments.length}
                </span>
              )}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onClose?.(); }}
              className="h-10 w-10 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Flèches + compteur */}
          {items.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-12 w-12 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 z-10"
                aria-label="Photo précédente"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-12 w-12 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 z-10"
                aria-label="Photo suivante"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              {!showComments && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white z-10">
                  {i + 1} / {items.length}
                </div>
              )}
            </>
          )}

          {/* Indicateur tant que la photo n'est pas entièrement chargée */}
          {!isLoaded && (
            <div className="absolute inset-0 grid place-items-center pointer-events-none z-10">
              <Loader2 className="h-8 w-8 animate-spin text-white/50" />
            </div>
          )}

          <motion.img
            ref={imgRef}
            key={i}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={isLoaded ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            src={displaySrc || undefined}
            alt=""
            draggable={false}
            onClick={(e) => e.stopPropagation()}
            onLoad={() => { if (displaySrc) setLoadedSrc(displaySrc); }}
            onError={() => {
              // 1re erreur = transform refusée → on retente l'original ;
              // 2e erreur = fichier réellement cassé → on affiche quand même
              // (image en erreur du navigateur) plutôt qu'une rotation infinie.
              if (transformSrc && failedTransform !== transformSrc) {
                setFailedTransform(transformSrc);
              } else if (sourceUrl) {
                setLoadedSrc(sourceUrl);
              }
            }}
            className={`max-w-[92vw] object-contain select-none transition-[max-height] duration-200 ${
              showComments ? "max-h-[52vh]" : "max-h-[88vh]"
            }`}
          />

          {/* Panneau de commentaires */}
          {showComments && (
            <div
              data-comments-panel
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-x-0 bottom-0 z-30 flex max-h-[58vh] flex-col border-t border-white/15 bg-black/92 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <span className="text-sm font-bold text-white">
                  Commentaires
                  {comments.length > 0 && (
                    <span className="ml-1.5 font-medium text-white/50">
                      ({comments.length})
                    </span>
                  )}
                </span>
                <button
                  onClick={() => setShowComments(false)}
                  className="h-8 w-8 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                  aria-label="Masquer les commentaires"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="min-h-[72px] flex-1 space-y-3 overflow-y-auto px-4 py-3">
                {loadingComments ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-white/70" />
                  </div>
                ) : comments.length ? (
                  comments.map((c) => (
                    <div key={c.id} className="text-sm leading-relaxed text-white/90">
                      <span className="mr-2 font-bold text-white">
                        {c.author_name || "Membre"}
                      </span>
                      <span className="whitespace-pre-wrap break-words">{c.text}</span>
                      {commentDate(c.created_date) && (
                        <div className="mt-0.5 text-[11px] text-white/40">
                          {commentDate(c.created_date)}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-white/50">
                    Aucun commentaire pour l'instant. Soyez le premier !
                  </p>
                )}
              </div>

              <form
                onSubmit={send}
                className="flex items-center gap-2 border-t border-white/10 px-4 py-3"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Écrire un commentaire…"
                  className="min-w-0 flex-1 rounded-full bg-white/10 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:bg-white/15"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-white transition disabled:opacity-40"
                  aria-label="Envoyer le commentaire"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

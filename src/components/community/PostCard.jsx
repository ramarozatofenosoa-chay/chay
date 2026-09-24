import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Heart, MessageCircle, Send, Loader2, X, Maximize2 } from "lucide-react"; // Ajout de X et Maximize2
import { Image } from "@/components/ui/image";
import { notifyComment, notifyLike } from "@/lib/socialNotifications";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PostCard({ post, currentUser }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [showLikes, setShowLikes] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  
  // NOUVEL ÉTAT POUR LE VIEWER D'IMAGE
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const isMine = currentUser && post.created_by_id === currentUser.id;
  const displayName = post.author_name || (isMine ? "Vous" : "Membre");
  const liked = reactions.some((r) => r.user_id === currentUser?.id);
  const likeCount = reactions.length;

  const loadReactions = async () => {
    const r = await base44.entities.PostReaction
      .filter({ post_id: post.id }, "-created_date", 200)
      .catch(() => []);
    setReactions(Array.isArray(r) ? r : []);
  };

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const c = await base44.entities.Comment.filter(
        { post_id: post.id },
        "-created_date",
        50
      ).catch(() => []);
      setComments(Array.isArray(c) ? c : []);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    loadReactions();
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  const myName = () =>
    currentUser?.full_name ||
    [currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(" ") ||
    "Membre";

  const toggleLike = async () => {
    if (!currentUser || likeBusy) return;
    setLikeBusy(true);
    if (liked) {
      const mine = reactions.find((r) => r.user_id === currentUser.id);
      setReactions((prev) => prev.filter((r) => r.user_id !== currentUser.id));
      if (mine) await base44.entities.PostReaction.delete(mine.id).catch(() => {});
    } else {
      const temp = {
        id: `temp-${Date.now()}`,
        post_id: post.id,
        user_id: currentUser.id,
        user_name: myName(),
      };
      setReactions((prev) => [...prev, temp]);
      try {
        const created = await base44.entities.PostReaction.create({
          post_id: post.id,
          user_id: currentUser.id,
          user_name: myName(),
        });
        setReactions((prev) =>
          prev.map((r) => (r.id === temp.id ? created : r))
        );
        notifyLike(post, currentUser);
      } catch {
        setReactions((prev) => prev.filter((r) => r.id !== temp.id));
      }
    }
    setLikeBusy(false);
  };

  const toggleComments = () => setShowComments((v) => !v);

  const submitComment = async () => {
    const text = draft.trim();
    if (!text || posting) return;
    const tempId = `temp-${Date.now()}`;
    setComments((prev) => [
      { id: tempId, post_id: post.id, text, author_name: myName(), created_date: new Date().toISOString() },
      ...prev,
    ]);
    setDraft("");
    setPosting(true);
    try {
      const created = await base44.entities.Comment.create({
        post_id: post.id,
        text,
        author_name: myName(),
      });
      notifyComment(post, currentUser, text, created?.id);
      await loadComments();
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setDraft(text);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="rounded-[1.5rem] border border-border bg-card p-5 md:p-6 relative">
      
      {/* En-tête du post */}
      <div className="flex items-center gap-3 mb-3">
        <div className="h-11 w-11 rounded-full brand-gradient grid place-items-center text-white font-display font-bold">
          {displayName[0]?.toUpperCase()}
        </div>
        <div>
          <div className="font-semibold text-[0.9375rem]">{displayName}</div>
          <div className="text-xs text-foreground/50">
            {new Date(post.created_date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>

      {/* Texte du post */}
      {post.text && (
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/85">
          {post.text}
        </p>
      )}

          {/* IMAGE CLIQUABLE - PROPORTIONS RESPECTÉES */}
      {post.image_url && (
        <div 
          className="mt-3 rounded-2xl overflow-hidden border border-border cursor-zoom-in group relative bg-muted/20 flex justify-center items-center"
          onClick={() => setIsViewerOpen(true)}
        >
          <Image
            src={post.image_url}
            alt=""
            fittingType="contain" // Force le respect des proportions
            className="w-full h-auto max-h-[80vh] object-contain transition-transform duration-300 group-hover:scale-[1.02]"
          />
          
          {/* Petit indicateur visuel au survol */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
             <Maximize2 className="h-6 w-6 text-white drop-shadow-md" />
          </div>
        </div>
      )}

      {/* Actions (Like / Commentaire) */}
      <div className="flex items-center gap-5 mt-4 pt-4 border-t border-border text-sm font-semibold text-foreground/55">
        <div className={`inline-flex items-center gap-1.5 ${liked ? "text-primary" : ""}`}>
          <button
            onClick={toggleLike}
            disabled={likeBusy}
            className="hover:scale-110 transition disabled:opacity-50"
            aria-label="Aimer"
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-primary" : ""}`} />
          </button>
          {likeCount > 0 && (
            <button
              onClick={() => setShowLikes(true)}
              className="hover:underline"
              aria-label="Voir qui a aimé"
            >
              {likeCount}
            </button>
          )}
        </div>
        <button
          onClick={toggleComments}
          className="inline-flex items-center gap-1.5 hover:text-primary transition"
          aria-label="Commenter"
        >
          <MessageCircle className="h-4 w-4" />
          {showComments ? "Masquer" : "Commenter"}
          {comments.length > 0 && <span className="ml-0.5">{comments.length}</span>}
        </button>
      </div>

      {/* Section Commentaires */}
      {showComments && (
        <div className="mt-4 space-y-3">
          {loadingComments ? (
            <div className="flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-foreground/40" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-foreground/40 text-center py-2">
              Soyez le premier à commenter.
            </p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-2.5">
                <div className="h-8 w-8 rounded-full bg-muted grid place-items-center text-xs font-bold shrink-0">
                  {(c.author_name || "M")[0]?.toUpperCase()}
                </div>
                <div className="rounded-2xl bg-muted px-3 py-2 flex-1">
                  <div className="font-semibold text-xs">{c.author_name || "Membre"}</div>
                  <div className="text-sm text-foreground/80">{c.text}</div>
                </div>
              </div>
            ))
          )}
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
              placeholder="Écrire un commentaire…"
              className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              onClick={submitComment}
              disabled={!draft.trim() || posting}
              className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center disabled:opacity-50"
              aria-label="Envoyer le commentaire"
            >
              {posting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* MODAL LIKES */}
      <Dialog open={showLikes} onOpenChange={setShowLikes}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Personnes ayant aimé</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-2">
            {reactions.length === 0 ? (
              <p className="text-sm text-foreground/50">Aucun like pour le moment.</p>
            ) : (
              reactions.map((r) => (
                <div key={r.id} className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full brand-gradient grid place-items-center text-white text-xs font-bold">
                    {(r.user_name || "M")[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold">
                    {r.user_name || "Membre"}
                  </span>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* LIGHTBOX / VIEWER PLEIN ÉCRAN */}
      {isViewerOpen && post.image_url && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsViewerOpen(false)} // Fermer si on clique sur le fond
        >
          {/* Bouton Fermer (X) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsViewerOpen(false);
            }}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center transition-all shadow-lg border border-white/20 z-10"
            aria-label="Fermer"
          >
            <X className="h-6 w-6" />
          </button>

          {/* L'image en grand */}
          <img 
            src={post.image_url} 
            alt="Vue agrandie" 
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()} // Empêcher la fermeture quand on clique SUR l'image
          />
        </div>
      )}
    </div>
  );
}

import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Heart, MessageCircle, Send, Loader2 } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function PostCard({ post, liked, onToggleLike, currentUser }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  const isMine = currentUser && post.created_by_id === currentUser.id;
  const displayName = post.author_name || (isMine ? "Vous" : "Membre");

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

  const toggleComments = () => {
    if (!showComments) loadComments();
    setShowComments((v) => !v);
  };

  const submitComment = async () => {
    const text = draft.trim();
    if (!text) return;
    setPosting(true);
    try {
      const name =
        currentUser?.full_name ||
        [currentUser?.first_name, currentUser?.last_name]
          .filter(Boolean)
          .join(" ") ||
        "Membre";
      await base44.entities.Comment.create({
        post_id: post.id,
        text,
        author_name: name,
      });
      setDraft("");
      await loadComments();
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="rounded-[1.5rem] border border-border bg-card p-5 md:p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-11 w-11 rounded-full brand-gradient grid place-items-center text-white font-display font-bold">
          {displayName[0]?.toUpperCase()}
        </div>
        <div>
          <div className="font-bold">{displayName}</div>
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

      {post.text && (
        <p className="text-foreground/85 leading-relaxed whitespace-pre-wrap">
          {post.text}
        </p>
      )}

      {post.image_url && (
        <div className="mt-3 rounded-2xl overflow-hidden border border-border">
          <Image
            src={post.image_url}
            alt=""
            fittingType="fill"
            className="w-full max-h-96 object-cover"
          />
        </div>
      )}

      <div className="flex items-center gap-5 mt-4 pt-4 border-t border-border text-sm font-semibold text-foreground/55">
        <button
          onClick={() => onToggleLike(post)}
          className={`inline-flex items-center gap-1.5 hover:text-primary transition ${
            liked ? "text-primary" : ""
          }`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-primary" : ""}`} />{" "}
          {post.likes || 0}
        </button>
        <button
          onClick={toggleComments}
          className="inline-flex items-center gap-1.5 hover:text-primary transition"
        >
          <MessageCircle className="h-4 w-4" />{" "}
          {showComments ? "Masquer" : "Commenter"}
        </button>
      </div>

      {showComments && (
        <div className="mt-4 space-y-3">
          {loadingComments ? (
            <div className="flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-foreground/40" />
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-2.5">
                <div className="h-8 w-8 rounded-full bg-muted grid place-items-center text-xs font-bold shrink-0">
                  {(c.author_name || "M")[0]?.toUpperCase()}
                </div>
                <div className="rounded-2xl bg-muted px-3 py-2 flex-1">
                  <div className="font-bold text-xs">{c.author_name || "Membre"}</div>
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
    </div>
  );
}
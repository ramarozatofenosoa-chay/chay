import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ImagePlus, Send, Loader2, X } from "lucide-react";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import PostCard from "@/components/community/PostCard";
import ChatRoom from "@/components/community/ChatRoom";

export default function Community() {
  const { toast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [user, setUser] = useState(null);
  const [likedPosts, setLikedPosts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("chay_liked") || "[]");
    } catch {
      return [];
    }
  });
  const [tab, setTab] = useState("feed");

  const loadPosts = async () => {
    const p = await base44.entities.CommunityPost
      .list("-created_date", 50)
      .catch(() => []);
    setPosts(Array.isArray(p) ? p : []);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const me = await base44.auth.me().catch(() => null);
      setUser(me);
      await loadPosts();
    })();
  }, []);

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const publish = async () => {
    if (!draft.trim() && !imageFile) return;
    setPublishing(true);
    try {
      let image_url = null;
      if (imageFile) {
        const res = await base44.integrations.Core.UploadFile({ file: imageFile });
        image_url = res.file_url;
      }
      const name =
        user?.full_name ||
        [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
        "Membre";
      await base44.entities.CommunityPost.create({
        text: draft.trim(),
        image_url,
        author_name: name,
        likes: 0,
      });
      setDraft("");
      setImageFile(null);
      setImagePreview(null);
      await loadPosts();
      toast({ title: "Publication partagée" });
    } catch (e) {
      toast({
        title: "Erreur",
        description: e.message,
        variant: "destructive",
      });
    }
    setPublishing(false);
  };

  const toggleLike = async (post) => {
    const already = likedPosts.includes(post.id);
    const newLiked = already
      ? likedPosts.filter((id) => id !== post.id)
      : [...likedPosts, post.id];
    const newCount = Math.max(0, (post.likes || 0) + (already ? -1 : 1));
    setLikedPosts(newLiked);
    localStorage.setItem("chay_liked", JSON.stringify(newLiked));
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, likes: newCount } : p))
    );
    try {
      await base44.entities.CommunityPost.update(post.id, { likes: newCount });
    } catch {
      setLikedPosts(likedPosts);
      localStorage.setItem("chay_liked", JSON.stringify(likedPosts));
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, likes: post.likes } : p))
      );
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 md:px-8 py-8 md:py-12">
      <header className="mb-8">
        <h1 className="display-fluid">
          <span className="brand-gradient-text">Communauté</span>
        </h1>
        <p className="mt-3 text-lg text-foreground/60">
          Partagez, encouragez et grandissez ensemble.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("feed")} className={`px-5 py-2 rounded-full text-sm font-bold transition ${tab === "feed" ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-muted"}`}>Actualité</button>
        <button onClick={() => setTab("chat")} className={`px-5 py-2 rounded-full text-sm font-bold transition ${tab === "chat" ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-muted"}`}>Chat</button>
      </div>

      {tab === "chat" ? (
        <ChatRoom user={user} />
      ) : (
      <>
      {/* Composer */}
      <div className="rounded-[1.5rem] border border-border bg-card p-5 mb-6">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Partagez quelque chose avec l'église…"
          rows={3}
          className="w-full bg-transparent outline-none resize-none text-foreground/85 placeholder:text-foreground/40 font-medium"
        />
        {imagePreview && (
          <div className="relative mt-3 rounded-2xl overflow-hidden border border-border">
            <Image
              src={imagePreview}
              alt=""
              fittingType="fill"
              className="w-full max-h-64 object-cover"
            />
            <button
              onClick={() => {
                setImageFile(null);
                setImagePreview(null);
              }}
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white grid place-items-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary transition cursor-pointer">
            <ImagePlus className="h-4 w-4" /> Photo
            <input
              type="file"
              accept="image/*"
              onChange={handleImagePick}
              className="hidden"
            />
          </label>
          <button
            onClick={publish}
            disabled={(!draft.trim() && !imageFile) || publishing}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold hover:scale-105 transition disabled:opacity-50"
          >
            {publishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}{" "}
            Publier
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-5">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : posts.length ? (
          posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              liked={likedPosts.includes(p.id)}
              onToggleLike={toggleLike}
              currentUser={user}
            />
          ))
        ) : (
          <p className="text-center text-foreground/50 py-12">
            Aucune publication pour le moment. Soyez le premier à partager !
          </p>
        )}
      </div>
      </>
      )}
    </div>
  );
}
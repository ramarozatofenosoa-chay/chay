import React, { useState } from "react";
import { Users, Heart, MessageCircle, Share2, ImagePlus, Send, Search } from "lucide-react";

const SAMPLE_POSTS = [
  { id: 1, author: "Pastor Jean", time: "2h", text: "Blessed Sunday service! 🙏 Remember: 'Faith is the assurance of things hoped for.'", likes: 42, comments: 7 },
  { id: 2, author: "Marie R.", time: "5h", text: "Grateful for this community. Today's worship moved me to tears. 🎶", likes: 28, comments: 4 },
  { id: 3, author: "David A.", time: "1d", text: "Prayer request: please pray for my mother's health this week.", likes: 67, comments: 12 },
];

export default function Community() {
  const [posts, setPosts] = useState(SAMPLE_POSTS);
  const [draft, setDraft] = useState("");

  const publish = () => {
    if (!draft.trim()) return;
    setPosts([{ id: Date.now(), author: "You", time: "now", text: draft.trim(), likes: 0, comments: 0 }, ...posts]);
    setDraft("");
  };

  return (
    <div className="mx-auto max-w-3xl px-6 md:px-8 py-8 md:py-12">
      <header className="mb-8">
        <h1 className="display-fluid"><span className="brand-gradient-text">Community</span></h1>
        <p className="mt-3 text-lg text-foreground/60">Share, encourage, and grow together.</p>
      </header>

      {/* Stories row */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-4 mb-6">
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="h-16 w-16 rounded-full border-2 border-dashed border-primary grid place-items-center text-primary"><ImagePlus className="h-6 w-6" /></div>
          <span className="text-xs font-semibold">Add</span>
        </div>
        {["Jean", "Marie", "David", "Sarah", "Paul"].map((n) => (
          <div key={n} className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="h-16 w-16 rounded-full brand-gradient p-0.5"><div className="h-full w-full rounded-full bg-card grid place-items-center font-display font-bold text-lg">{n[0]}</div></div>
            <span className="text-xs font-semibold">{n}</span>
          </div>
        ))}
      </div>

      {/* Composer */}
      <div className="rounded-[1.5rem] border border-border bg-card p-5 mb-6">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Share something with the church…"
          rows={3}
          className="w-full bg-transparent outline-none resize-none text-foreground/85 placeholder:text-foreground/40 font-medium"
        />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <button className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary transition">
            <ImagePlus className="h-4 w-4" /> Photo
          </button>
          <button onClick={publish} className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold hover:scale-105 transition disabled:opacity-50" disabled={!draft.trim()}>
            <Send className="h-4 w-4" /> Post
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-5">
        {posts.map((p) => (
          <div key={p.id} className="rounded-[1.5rem] border border-border bg-card p-5 md:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-11 w-11 rounded-full brand-gradient grid place-items-center text-white font-display font-bold">{p.author[0]}</div>
              <div>
                <div className="font-bold">{p.author}</div>
                <div className="text-xs text-foreground/50">{p.time} ago</div>
              </div>
            </div>
            <p className="text-foreground/85 leading-relaxed">{p.text}</p>
            <div className="flex items-center gap-5 mt-4 pt-4 border-t border-border text-sm font-semibold text-foreground/55">
              <button className="inline-flex items-center gap-1.5 hover:text-primary transition"><Heart className="h-4 w-4" /> {p.likes}</button>
              <button className="inline-flex items-center gap-1.5 hover:text-primary transition"><MessageCircle className="h-4 w-4" /> {p.comments}</button>
              <button className="inline-flex items-center gap-1.5 hover:text-primary transition ml-auto"><Share2 className="h-4 w-4" /> Share</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
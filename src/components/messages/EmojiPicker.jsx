import React, { useState } from "react";

const CATEGORIES = {
  "😀": [
    "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂",
    "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩",
    "😘", "😗", "😚", "😋", "😛", "😜", "🤪", "😝",
    "🤗", "🤭", "🤫", "🤔", "😐", "😑", "😶", "🙄",
    "😏", "😣", "😥", "😮", "🤐", "😯", "😪", "😫",
    "😴", "😌", "🤤", "😒", "😞", "😔", "😟", "😢",
  ],
  "👍": [
    "👍", "👎", "👏", "🙌", "🙏", "🤝", "👋", "✌️",
    "🤞", "🤟", "🤘", "👌", "🤙", "💪", "🫡", "🫶",
    "🤚", "✋", "🖐️", "🤜", "🤛", "👏", "👐", "🫵",
  ],
  "❤️": [
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🤎", "🖤",
    "🤍", "💔", "❣️", "💕", "💞", "💓", "💗", "💖",
    "💘", "💝", "❤️‍🔥", "💟", "💌", "💋", "💎", "💫",
  ],
  "🌿": [
    "🌟", "✨", "⚡", "🔥", "☀️", "🌈", "🌙", "☁️",
    "🌸", "🌺", "🌻", "🌼", "🌷", "🌹", "🌳", "🌴",
    "🍀", "🌿", "☘️", "🍁", "🕊️", "🦅", "🦋", "🐝",
    "🌊", "⛰️", "🌅", "🌄", "🌠", "🌍", "🌎", "💧",
  ],
  "✝️": [
    "✝️", "⛪", "🙏", "📖", "🕯️", "🔔", "🎶", "🎵",
    "🎬", "🎉", "🎂", "🎁", "🏆", "👑", "🕊️", "⚖️",
    "🛐", "🕍", "⛩️", "📿", "🪔", "❤️‍🩹", "🫂", "😇",
  ],
};

export default function EmojiPicker({ onPick }) {
  const [cat, setCat] = useState("😀");
  return (
    <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
      <div className="flex gap-1 px-2 pt-2 overflow-x-auto no-scrollbar">
        {Object.keys(CATEGORIES).map((icon) => (
          <button
            key={icon}
            onClick={() => setCat(icon)}
            className={`h-9 w-9 grid place-items-center rounded-lg text-xl shrink-0 transition ${
              cat === icon ? "bg-muted" : "hover:bg-muted/60"
            }`}
            aria-label={`Catégorie ${icon}`}
          >
            {icon}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-7 sm:grid-cols-8 gap-0.5 p-2 max-h-44 overflow-y-auto">
        {CATEGORIES[cat].map((em, i) => (
          <button
            key={`${em}-${i}`}
            onClick={() => onPick(em)}
            className="h-9 w-9 grid place-items-center text-xl hover:bg-muted rounded-lg transition active:scale-90"
          >
            {em}
          </button>
        ))}
      </div>
    </div>
  );
}
import React, { useState } from "react";
import { Sparkles, Lock, BookOpen, Gamepad2, Film, Palette, Shield } from "lucide-react";

const ZONES = [
  { id: "learn", label: "Learn the Bible", desc: "Lessons & quizzes", icon: BookOpen, tone: "from-[#4A6CFE] to-[#8A56E2]" },
  { id: "games", label: "Kids Games", desc: "Noah, David & more", icon: Gamepad2, tone: "from-[#2E6F40] to-[#4A6CFE]" },
  { id: "cartoons", label: "Cartoons", desc: "Safe & official", icon: Film, tone: "from-[#FF57B2] to-[#FF4D2D]" },
  { id: "create", label: "Creativity", desc: "Color & create", icon: Palette, tone: "from-[#FF4D2D] to-[#8A56E2]" },
];

export default function Kids() {
  const [unlocked, setUnlocked] = useState(false);
  const [challenge, setChallenge] = useState(() => ({ a: 7, b: 4, answer: 11 }));
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const verify = (e) => {
    e.preventDefault();
    if (Number(input) === challenge.a + challenge.b) {
      setUnlocked(true);
    } else {
      setError(true);
      setChallenge({ a: Math.floor(Math.random() * 8) + 2, b: Math.floor(Math.random() * 8) + 2, answer: 0 });
      setInput("");
    }
  };

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 md:py-24 text-center">
        <div className="h-20 w-20 rounded-3xl brand-gradient grid place-items-center text-white mx-auto mb-6 glow-primary">
          <Lock className="h-10 w-10" />
        </div>
        <h1 className="font-display font-extrabold text-3xl">Parental gate</h1>
        <p className="mt-3 text-foreground/60">A grown-up must answer a quick question to keep the Kids Zone safe.</p>
        <form onSubmit={verify} className="mt-8 rounded-[2rem] border border-border bg-card p-8">
          <div className="text-sm font-semibold text-foreground/60 mb-2">What is</div>
          <div className="font-display font-extrabold text-4xl mb-5">{challenge.a} + {challenge.b} = ?</div>
          <input
            type="number"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(false); }}
            className="w-full text-center rounded-2xl border-2 border-border bg-background px-4 py-4 text-2xl font-bold outline-none focus:border-primary"
            placeholder="?"
            autoFocus
          />
          {error && <p className="text-destructive text-sm font-semibold mt-3">Not quite — try again!</p>}
          <button type="submit" className="mt-5 w-full rounded-full bg-primary text-primary-foreground px-6 py-3.5 font-bold hover:scale-[1.02] transition">
            Unlock Kids Zone
          </button>
          <div className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-foreground/45">
            <Shield className="h-4 w-4" /> No chat, friends, or payments inside.
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 md:px-8 py-8 md:py-12">
      <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="display-fluid"><span className="brand-gradient-text">CHAY</span> Kids</h1>
          <p className="mt-3 text-lg text-foreground/60">A safe, fun place to learn about God.</p>
        </div>
        <button onClick={() => setUnlocked(false)} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold hover:bg-muted transition">
          <Lock className="h-4 w-4" /> Lock
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
        {ZONES.map((z) => {
          const Icon = z.icon;
          return (
            <div key={z.id} className="group rounded-[1.5rem] border border-border bg-card p-6 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer">
              <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${z.tone} grid place-items-center text-white shadow-sm mb-4`}>
                <Icon className="h-7 w-7" />
              </div>
              <div className="font-display font-bold text-lg">{z.label}</div>
              <div className="text-sm text-foreground/55">{z.desc}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-[2rem] brand-gradient p-8 md:p-10 text-white flex items-center gap-5">
        <Sparkles className="h-12 w-12 shrink-0" />
        <div>
          <div className="font-display font-bold text-xl">Today's story: Noah's Ark</div>
          <p className="text-white/80 text-sm mt-1">Tap to start the adventure — earn XP as you go!</p>
        </div>
      </div>
    </div>
  );
}
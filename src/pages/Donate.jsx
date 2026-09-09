import React, { useState } from "react";
import { Heart, Check, ArrowRight, ShieldCheck, Repeat } from "lucide-react";

const PRESETS = [10, 25, 50, 100];

export default function Donate() {
  const [amount, setAmount] = useState(25);
  const [custom, setCustom] = useState("");
  const [frequency, setFrequency] = useState("once");
  const [done, setDone] = useState(false);

  const finalAmount = custom ? Number(custom) : amount;

  const submit = (e) => {
    e.preventDefault();
    setDone(true);
  };

  if (done) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 md:py-24 text-center">
        <div className="h-20 w-20 rounded-3xl bg-secondary grid place-items-center text-white mx-auto mb-6 glow-soft">
          <Check className="h-10 w-10" />
        </div>
        <h1 className="font-display font-extrabold text-3xl">Thank you!</h1>
        <p className="mt-3 text-foreground/60">Your gift of <span className="font-bold text-foreground">${finalAmount}</span> {frequency === "monthly" ? "monthly " : ""}means the world to CHAY.</p>
        <button onClick={() => setDone(false)} className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 font-bold hover:bg-muted transition">
          Give again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 md:px-8 py-8 md:py-12">
      <header className="mb-8 text-center">
        <div className="h-16 w-16 rounded-3xl brand-gradient grid place-items-center text-white mx-auto mb-5 glow-primary">
          <Heart className="h-8 w-8" fill="currentColor" />
        </div>
        <h1 className="display-fluid">Give to <span className="brand-gradient-text">CHAY</span></h1>
        <p className="mt-3 text-lg text-foreground/60 max-w-md mx-auto">Your generosity fuels the mission — every gift makes a difference.</p>
      </header>

      <form onSubmit={submit} className="rounded-[2rem] border border-border bg-card p-6 md:p-10 space-y-7">
        {/* Frequency */}
        <div>
          <div className="text-sm font-bold text-foreground/60 mb-3">Frequency</div>
          <div className="inline-flex rounded-full border border-border bg-background p-1">
            {[{ id: "once", label: "One-time", icon: Heart }, { id: "monthly", label: "Monthly", icon: Repeat }].map((f) => (
              <button
                type="button"
                key={f.id}
                onClick={() => setFrequency(f.id)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition ${
                  frequency === f.id ? "bg-primary text-primary-foreground" : "text-foreground/60"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preset amounts */}
        <div>
          <div className="text-sm font-bold text-foreground/60 mb-3">Amount</div>
          <div className="grid grid-cols-4 gap-3">
            {PRESETS.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => { setAmount(p); setCustom(""); }}
                className={`rounded-2xl border-2 py-4 font-display font-extrabold text-xl transition ${
                  !custom && amount === p ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:border-primary/50"
                }`}
              >
                ${p}
              </button>
            ))}
          </div>
          <div className="mt-3 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-foreground/40">$</span>
            <input
              type="number"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Custom amount"
              className="w-full rounded-2xl border-2 border-border bg-background pl-8 pr-4 py-3.5 font-bold outline-none focus:border-primary"
            />
          </div>
        </div>

        <button type="submit" className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-4 text-lg font-bold glow-primary hover:scale-[1.01] transition">
          Give ${finalAmount || 0} {frequency === "monthly" ? "/ month" : ""} <ArrowRight className="h-5 w-5" />
        </button>

        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-foreground/45">
          <ShieldCheck className="h-4 w-4" /> Secure checkout via Stripe
        </div>
      </form>
    </div>
  );
}
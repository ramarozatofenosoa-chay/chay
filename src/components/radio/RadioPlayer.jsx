import React from "react";
import { useRadio } from "@/lib/RadioContext";
import Visualizer from "@/components/radio/Visualizer";
import { useToast } from "@/components/ui/use-toast";
import { RADIO_LOGO } from "@/lib/mediaConstants";
import {
  Play,
  Square,
  Share2,
  Volume2,
  Volume1,
  VolumeX,
  Loader2,
  RadioTower,
} from "lucide-react";

export default function RadioPlayer() {
  const { isPlaying, isLoading, error, retries, volume, toggle, setVolume, retryNow } =
    useRadio();
  const { toast } = useToast();

  const VolIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  const share = async () => {
    const url = `${window.location.origin}/media?cat=radio`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Radio Chay", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Lien copié" });
      }
    } catch {}
  };

  return (
    <div className="rounded-[2rem] border border-border bg-card overflow-hidden">
      <div className="brand-gradient p-8 md:p-12 text-white text-center">
        <div className="flex items-center justify-center gap-2 mb-5">
          {isPlaying || isLoading ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold uppercase">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              {isLoading ? "Connexion…" : "En direct"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase opacity-60">
              <span className="h-2 w-2 rounded-full bg-white/50" /> Hors antenne
            </span>
          )}
        </div>

        <img
          src={RADIO_LOGO}
          alt="Radio Chay"
          className="h-20 w-20 rounded-2xl object-cover mx-auto mb-4 shadow-lg"
        />
        <h3 className="font-display font-extrabold text-3xl">Radio Chay</h3>
        <p className="text-white/80 mt-2">Louange & la Parole, 24h/24</p>

        <div className="mt-6 h-10 flex items-end justify-center text-white">
          <Visualizer active={isPlaying} loading={isLoading} bars={7} className="h-10" />
        </div>
      </div>

      <div className="p-5 md:p-6 flex flex-col items-center gap-5">
        {error ? (
          <div className="w-full text-center py-3">
            <RadioTower className="h-10 w-10 mx-auto text-destructive mb-2" />
            <p className="font-semibold text-foreground/80">
              Radio indisponible pour le moment
            </p>
            {retries < 5 ? (
              <p className="text-xs text-foreground/50 mt-1">
                Nouvelle tentative dans 15s… ({retries}/5)
              </p>
            ) : (
              <button
                onClick={retryNow}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold"
              >
                <Loader2 className="h-4 w-4" /> Réessayer
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={toggle}
            aria-label={
              isPlaying || isLoading
                ? "Arrêter la radio"
                : "Lecture de la radio"
            }
            className="h-16 w-16 rounded-full brand-gradient text-white grid place-items-center shadow-lg hover:scale-105 active:scale-95 transition"
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : isPlaying ? (
              <Square className="h-6 w-6" />
            ) : (
              <Play className="h-7 w-7 ml-0.5" />
            )}
          </button>
        )}

        <div className="w-full max-w-sm flex items-center gap-3">
          <VolIcon className="h-5 w-5 text-foreground/60 shrink-0" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            aria-label="Volume de la radio"
            className="flex-1 accent-primary"
          />
        </div>

        <button
          onClick={share}
          className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/60 hover:text-primary"
        >
          <Share2 className="h-4 w-4" /> Partager la radio
        </button>
      </div>
    </div>
  );
}
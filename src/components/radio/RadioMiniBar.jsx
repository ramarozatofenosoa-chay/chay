import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useRadio } from "@/lib/RadioContext";
import Visualizer from "@/components/radio/Visualizer";
import { RADIO_LOGO } from "@/lib/mediaConstants";
import { Square, Play, Loader2 } from "lucide-react";

export default function RadioMiniBar() {
  const { isPlaying, isLoading, toggle } = useRadio();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isPlaying && !isLoading) return null;

  const onRadioPage =
    location.pathname === "/media" &&
    new URLSearchParams(location.search).get("cat") === "radio";
  if (onRadioPage) return null;

  return (
    <button
      onClick={() => navigate("/media?cat=radio")}
      className="fixed z-40 left-4 bottom-24 md:bottom-6 flex items-center gap-3 rounded-full border border-border bg-card/95 backdrop-blur-xl shadow-xl pl-2 pr-2 py-2 max-w-[16rem] hover:scale-[1.02] transition text-left animate-float-in"
      aria-label="Ouvrir le lecteur radio"
    >
      <img
        src={RADIO_LOGO}
        alt=""
        className="h-10 w-10 rounded-full object-cover shrink-0"
      />
      <div className="min-w-0">
        <div className="text-sm font-bold truncate leading-tight">Radio Chay</div>
        <Visualizer
          active={isPlaying}
          loading={isLoading}
          bars={5}
          className="h-4 text-primary mt-0.5"
        />
      </div>
      <span
        role="button"
        aria-label={isPlaying ? "Arrêter la radio" : "Lecture de la radio"}
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        className="h-9 w-9 grid place-items-center rounded-full bg-primary text-primary-foreground shrink-0"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <Square className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" />
        )}
      </span>
    </button>
  );
}
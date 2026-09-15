import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Check, X } from "lucide-react";

/**
 * Bouton de connexion à états fluides : idle → loading → success/error.
 * Spinner → icône (coche rose-violet / croix rose-rouge) avec léger rebond,
 * puis retour du texte ou redirection. Respecte prefers-reduced-motion.
 */
export default function LoginButton({ state = "idle", disabled }) {
  const reduce = useReducedMotion();
  const showIcon = state === "success" || state === "error";

  const bg =
    state === "success"
      ? "bg-[#F7EAF3] dark:bg-[#3A2535]"
      : state === "error"
      ? "bg-[#FDECEC] dark:bg-[#3A2530]"
      : "bg-[#A83E8C] hover:brightness-110 dark:bg-[#C857A8]";

  return (
    <button
      type="submit"
      disabled={disabled}
      aria-busy={state === "loading"}
      className={`relative w-full h-12 rounded-xl font-medium overflow-hidden transition-[background-color,transform,filter] duration-300 active:scale-[0.97] ${bg} text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C857A8] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed`}
    >
      <span
        className={`absolute inset-0 grid place-items-center transition-opacity duration-150 ${
          state === "idle" ? "opacity-100" : "opacity-0"
        }`}
      >
        Se connecter
      </span>
      <span
        className={`absolute inset-0 grid place-items-center transition-opacity duration-150 ${
          state === "loading" ? "opacity-100" : "opacity-0"
        }`}
      >
        <Loader2 className="h-5 w-5 animate-spin" />
      </span>
      {showIcon && (
        <span className="absolute inset-0 grid place-items-center">
          <motion.span
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: [0.8, 1.08, 1] }}
            transition={
              reduce
                ? { duration: 0.15 }
                : { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }
            }
            className={
              state === "success"
                ? "text-[#A83E8C] dark:text-[#C857A8]"
                : "text-[#D14B4B] dark:text-[#E57373]"
            }
          >
            {state === "success" ? (
              <Check className="h-5 w-5" />
            ) : (
              <X className="h-5 w-5" />
            )}
          </motion.span>
        </span>
      )}
    </button>
  );
}
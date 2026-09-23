import { motion } from "framer-motion";
import { Image } from "@/components/ui/image";

// ⚠️ ASSUREZ-VOUS D'AVOIR MIS À JOUR L'URL DE VOTRE LOGO ICI
const NEW_LOGO_URL = "https://raw.githubusercontent.com/ramarozatofenosoa-chay/chay/refs/heads/main/src/public/assets/logo_carr%C3%A9-removebg-preview.png?token=GHSAT0AAAAAAEJ22B6ROJC3AHFCH3U44BWI2VULUEQ"; 

export default function SplashScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }} // Sortie plus lente et cinématographique
    >
      {/* 1. Fond Animé : Gradient Radial Subtil qui Pulse */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at center, rgba(255,255,255,0.03) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Contenu Central */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-6 px-8">
        
        {/* 2. Logo avec Effet Zoom Lent & Flottant */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ 
            scale: [0.9, 1.05, 1], // Petit rebond final
            opacity: 1, 
            y: 0 
          }}
          transition={{ 
            duration: 2.5, 
            ease: [0.22, 1, 0.36, 1], // Courbe de bézier personnalisée pour un mouvement fluide
            delay: 0.2 
          }}
        >
          <Image
            src={NEW_LOGO_URL}
            alt="EGC Logo"
            fittingType="contain"
            className="h-32 w-32 md:h-40 md:w-40 drop-shadow-2xl filter brightness-110 contrast-125"
          />
        </motion.div>

        {/* 3. Texte EGC - Typographie Luxe */}
        <div className="flex flex-col items-center">
          <motion.h1
            className="text-white font-serif text-5xl md:text-6xl tracking-tight uppercase relative"
            style={{
              fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif", // Police système proche du luxe
              fontWeight: 300, // Fine et élégante
              letterSpacing: "-0.02em", // Lettres serrées
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 1.0, ease: "easeOut" }}
          >
            EGC
          </motion.h1>

          {/* 4. Ligne Séparatrice Animée (Dessin de Gauche à Droite) */}
          <motion.div
            className="mt-3 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent"
            style={{ width: "120%" }} // Légèrement plus large que le texte
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1.2, delay: 1.8, ease: "easeInOut" }}
          />
          
          {/* Sous-titre discret (Optionnel, peut être retiré si trop chargé) */}
          <motion.p
             className="mt-2 text-xs md:text-sm text-white/40 tracking-[0.2em] uppercase font-light"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ duration: 1, delay: 2.5 }}
          >
            Église Génération Chrétienne
          </motion.p>
        </div>
      </div>

      {/* 5. Overlay Final pour assombrir légèrement les bords (Vignette effect) */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.4)_100%)]" />
      
    </motion.div>
  );
}

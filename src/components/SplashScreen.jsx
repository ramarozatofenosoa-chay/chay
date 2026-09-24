import { motion } from "framer-motion";
import { Image } from "@/components/ui/image";

// ⚠️ ASSUREZ-VOUS D'AVOIR MIS À JOUR L'URL DE VOTRE LOGO ICI
const NEW_LOGO_URL = "https://ramarozatofenosoa-chay.github.io/chay/src/public/assets/egc-logo.png"; 

export default function SplashScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      // FOND DÉGRADÉ INSPIRÉ DE L'IMAGE (Bleu -> Violet -> Rose)
      style={{
        background: "linear-gradient(135deg, #4A6CFE 0%, #8A56E2 50%, #FF57B2 100%)",
      }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      
      {/* Contenu Central */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-2 px-8 text-center">
        
        {/* 1. Logo AGRANDI */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ 
            scale: [0.9, 1.05, 1], 
            opacity: 1, 
            y: 0 
          }}
          transition={{ 
            duration: 2.5, 
            ease: [0.22, 1, 0.36, 1], 
            delay: 0.2 
          }}
        >
          <Image
            src={NEW_LOGO_URL}
            alt="EGC Logo"
            fittingType="contain"
            className="h-48 w-48 md:h-64 md:w-64 drop-shadow-2xl filter brightness-110 contrast-125"
          />
        </motion.div>

        {/* 2. Texte EGC RÉDUIT (-20%) et RAPPROCHÉ */}
        <motion.h1
          className="text-white text-5xl md:text-6xl tracking-tight uppercase relative font-bold mt-2"
          style={{
            fontFamily: "'Cinzel', 'Montserrat', 'Helvetica Neue', sans-serif",
            letterSpacing: "-0.03em",
            textShadow: "0 0 20px rgba(255,255,255,0.4)", // Glow légèrement renforcé pour contraster sur le fond coloré
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 1.0, ease: "easeOut" }}
        >
          EGC
        </motion.h1>

        {/* 3. Ligne Séparatrice MINIMALE */}
        <motion.div
          className="mt-3 h-[0.5px] bg-white/40" // Plus fine (0.5px), moins opaque (40%), largeur fixe petite
          style={{ width: "60px" }} 
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.8, ease: "easeInOut" }}
        />
        
        {/* 4. Citation Malgache RÉDUITE et RAPPROCHEE */}
        <motion.p
           className="mt-2 text-sm md:text-base text-white/90 italic leading-relaxed max-w-xs mx-auto"
           style={{
             fontFamily: "'Playfair Display', Georgia, serif",
             fontWeight: 400,
             letterSpacing: "0.02em",
             textShadow: "0 2px 8px rgba(0,0,0,0.3)", // Ombre douce pour lisibilité
           }}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 1, delay: 2.5 }}
        >
          Ny marina hahafaka anareo tsy ho andevo.
        </motion.p>
      </div>

      {/* Overlay Final pour vignette cinématique subtile (assombrit juste les bords extrêmes) */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.3)_100%)]" />
      
    </motion.div>
  );
}

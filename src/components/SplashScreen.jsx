import { motion } from "framer-motion";
import { Image } from "@/components/ui/image";

// ⚠️ ASSUREZ-VOUS D'AVOIR MIS À JOUR L'URL DE VOTRE LOGO ICI
const NEW_LOGO_URL = "https://ramarozatofenosoa-chay.github.io/chay//src/public/assets/egc-logo.png"; 

export default function SplashScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {/* 1. HALO LUMINEUX DÉGRADÉ (Violet - Rose - Bleu) 
          Il pulse doucement pour donner vie au fond noir */}
      <motion.div
        className="absolute h-[60vh] w-[60vh] md:h-[80vh] md:w-[80vh] rounded-full blur-[100px] opacity-40 pointer-events-none"
        style={{
          background: "linear-gradient(135deg, #8A56E2 0%, #FF57B2 50%, #4A6CFE 100%)",
        }}
        animate={{
          scale: [1, 1.15, 1],
          rotate: [0, 5, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Couche supplémentaire de lumière blanche subtile au centre pour détacher le texte du halo coloré */}
      <div className="absolute inset-0 bg-radial-gradient(from-transparent via-black/20 to-black/80)" />

      {/* Contenu Central */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-8 px-8 text-center">
        
        {/* 2. Logo avec Effet Zoom Lent & Flottant */}
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
            className="h-32 w-32 md:h-40 md:w-40 drop-shadow-2xl filter brightness-110 contrast-125"
          />
        </motion.div>

        {/* 3. Texte EGC - Police Aglio Picasso (ou équivalent luxe) */}
        <div className="flex flex-col items-center">
          <motion.h1
            className="text-white text-6xl md:text-7xl tracking-tight uppercase relative font-bold"
            style={{
              // Aglio Picasso n'est pas standard sur web, on utilise une stack qui imite son style géométrique/luxe
              fontFamily: "'Cinzel', 'Montserrat', 'Helvetica Neue', sans-serif",
              letterSpacing: "-0.03em",
              textShadow: "0 0 20px rgba(255,255,255,0.3)", // Léger glow blanc
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 1.0, ease: "easeOut" }}
          >
            EGC
          </motion.h1>

          {/* 4. Ligne Séparatrice Animée (Dessin de Gauche à Droite) */}
          <motion.div
            className="mt-4 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent"
            style={{ width: "140%" }} // Plus large pour encadrer la citation
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1.2, delay: 1.8, ease: "easeInOut" }}
          />
          
          {/* 5. Citation Malgache - Playfair Display Italic */}
          <motion.p
             className="mt-6 text-lg md:text-xl text-white/90 italic leading-relaxed max-w-md mx-auto"
             style={{
               fontFamily: "'Playfair Display', Georgia, serif",
               fontWeight: 400,
               letterSpacing: "0.02em",
               textShadow: "0 2px 10px rgba(0,0,0,0.5)", // Ombre portée pour lisibilité sur le halo
             }}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 1, delay: 2.5 }}
          >
            Ny marina hahafaka anareo tsy ho andevo.
          </motion.p>
        </div>
      </div>

      {/* Overlay Final pour vignette cinématique */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)]" />
      
    </motion.div>
  );
}

style={{ 
  fontFamily: "'Cinzel', 'Playfair Display', serif", 
  fontWeight: 700 // Cinzel est plus beau en gras/lourd pour un logo
}}



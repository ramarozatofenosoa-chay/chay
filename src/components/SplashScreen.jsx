import { motion } from "framer-motion";
import { Image } from "@/components/ui/image";

// ⚠️ COLLEZ ICI VOTRE NOUVELLE URL GITHUB OU CLOUDINARY
const NEW_LOGO_URL = "https://raw.githubusercontent.com/ramarozatofenosoa-chay/chay/refs/heads/main/src/public/assets/logo_carr%C3%A9-removebg-preview.png?token=GHSAT0AAAAAAEJ22B6RIQIEL3WHWZYODOKI2VULJKQ"; 

export default function SplashScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] grid place-items-center bg-black overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {/* Contenu centré */}
      <div className="flex flex-col items-center justify-center gap-4">
        
        {/* Logo EGC */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        >
          <Image
            src={NEW_LOGO_URL}
            alt="EGC"
            fittingType="contain" // Important pour ne pas déformer le logo
            className="h-32 w-32 md:h-40 md:w-40 rounded-full shadow-lg object-contain"
          />
        </motion.div>

        {/* Texte EGC */}
        <motion.h1
          className="text-white font-display font-extrabold text-4xl md:text-5xl tracking-widest uppercase"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
        >
          EGC
        </motion.h1>
      </div>
    </motion.div>
  );
}

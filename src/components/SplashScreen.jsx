import { motion } from "framer-motion";
import { Image } from "@/components/ui/image";

const LOGO_URL =
  "https://media.base44.com/images/public/6aa138d0e963d9e5f59d838c/c26279d55_logo.png";

// Splash d'entrée façon Netflix : le logo flotte et grandit pendant 5 s
// avant de s'estomper pour révéler l'écran de connexion.
export default function SplashScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] grid place-items-center bg-black overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      {/* Halo dégradé pulsé */}
      <motion.div
        className="absolute h-72 w-72 md:h-96 md:w-96 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(138,86,226,0.45) 0%, rgba(74,108,254,0.22) 50%, transparent 70%)",
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0.85, 0.6, 0], scale: [0.5, 1.15, 1, 1.3] }}
        transition={{ duration: 5, times: [0, 0.3, 0.7, 1], ease: "easeOut" }}
      />

      {/* Logo flottant */}
      <motion.div
        className="relative grid place-items-center"
        initial={{ scale: 0.6, opacity: 0, y: 12 }}
        animate={{
          scale: [0.6, 1.08, 1, 1.05, 1],
          opacity: [0, 1, 1, 1, 0],
          y: [12, -12, 0, -6, 0],
        }}
        transition={{ duration: 5, times: [0, 0.25, 0.5, 0.8, 1], ease: "easeInOut" }}
      >
        <Image
          src={LOGO_URL}
          alt="Chay"
          fittingType="fill"
          focalPointX={0.5}
          focalPointY={0.5}
          className="h-28 w-28 md:h-36 md:w-36 rounded-2xl shadow-2xl"
        />
        <motion.p
          className="mt-5 font-display font-extrabold text-2xl md:text-3xl brand-gradient-text tracking-wide"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: [0, 1, 1, 0], y: [8, 0, -2, -8] }}
          transition={{ duration: 5, times: [0, 0.35, 0.75, 1], ease: "easeOut" }}
        >
          ÉGLISE CHAY
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
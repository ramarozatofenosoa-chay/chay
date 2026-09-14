import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

const LOGO_URL =
  "https://media.base44.com/images/public/6aa138d0e963d9e5f59d838c/c26279d55_logo.png";

export default function SplashScreen() {
  const [content, setContent] = useState(null);

  useEffect(() => {
    base44.entities.AppContent
      .list()
      .then((r) => setContent(Array.isArray(r) ? r[0] : null))
      .catch(() => {});
  }, []);

  const mg =
    content?.splash_text_mg || "Ny marina hahafaka anareo tsy ho andevo";
  const fr = content?.splash_text_fr || "La vérité vous affranchira";

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center overflow-hidden"
      style={{ background: "#2575FC" }}
    >
      {/* Ambient glow orbs */}
      <motion.div
        className="absolute h-72 w-72 rounded-full"
        style={{ background: "rgba(255,255,255,0.10)", filter: "blur(60px)" }}
        animate={{ x: [-60, 60, -60], y: [-40, 40, -40], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute h-96 w-96 rounded-full"
        style={{ background: "rgba(37,117,252,0.5)", filter: "blur(80px)" }}
        animate={{ x: [80, -50, 80], y: [50, -30, 50], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative flex flex-col items-center px-6">
        {/* Logo entrance + breathing loop */}
        <motion.div
          initial={{ opacity: 0, scale: 0.55, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.img
            src={LOGO_URL}
            alt="Chay"
            className="w-36 h-36 md:w-48 md:h-48 object-contain drop-shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
            animate={{ scale: [1, 1.05, 1], y: [0, -6, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Shimmer ring under logo */}
        <motion.div
          className="mt-2 h-1 w-24 rounded-full"
          style={{ background: "rgba(255,255,255,0.25)" }}
          animate={{ scaleX: [0.4, 1, 0.4], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Phrases */}
        <motion.p
          className="mt-8 text-white text-lg md:text-2xl font-semibold text-center max-w-md"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {mg}
        </motion.p>
        <motion.p
          className="mt-2 text-white/80 text-sm md:text-base text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.95 }}
        >
          {fr}
        </motion.p>
      </div>
    </div>
  );
}
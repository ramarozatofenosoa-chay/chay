import { AnimatePresence, motion } from "framer-motion";
import { useOutlet, useLocation, useNavigationType } from "react-router-dom";

export default function AnimatedOutlet() {
  const outlet = useOutlet();
  const location = useLocation();
  const navType = useNavigationType();

  return (
    <AnimatePresence mode="wait" initial={false} custom={navType}>
      <motion.div
        key={location.pathname}
        custom={navType}
        initial={(d) => ({ opacity: 0, x: d === "POP" ? "-100%" : "100%" })}
        animate={{ opacity: 1, x: 0 }}
        exit={(d) => ({ opacity: 0, x: d === "POP" ? "100%" : "-100%" })}
        transition={{ duration: 0.18, ease: "easeInOut" }}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}
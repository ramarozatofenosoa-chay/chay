import { useHardwareBackButton } from "@/hooks/useHardwareBackButton";

// Composant nul rendu à l'intérieur du <Router> : inscrit une seule fois le
// listener du bouton retour matériel au niveau racine de l'app.
export default function HardwareBackHandler() {
  useHardwareBackButton();
  return null;
}
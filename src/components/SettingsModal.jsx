import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { User, Trash2, Loader2, AlertTriangle, Mail } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function SettingsModal({ open, onOpenChange }) {
  const { user, deleteAccount } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setError("");
    setLoading(true);
    try {
      await deleteAccount();
    } catch (err) {
      setError(err.message || "Échec de la suppression du compte");
      setLoading(false);
      setConfirming(false);
    }
  };

  const handleOpenChange = (v) => {
    if (!v) {
      setConfirming(false);
      setError("");
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-[1.5rem]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display font-extrabold">
            <User className="h-5 w-5 text-primary" /> Paramètres
          </DialogTitle>
          <DialogDescription>
            Gérez votre compte et vos préférences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* User info */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-foreground/50">
              Compte
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Mail className="h-4 w-4 text-foreground/50" />
              <span className="font-bold text-sm">{user?.email || "—"}</span>
            </div>
            <div className="text-xs text-foreground/50 mt-1 capitalize">
              {user?.role || "user"}
            </div>
          </div>

          {/* Preferences */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Mode sombre</span>
              <ThemeToggle />
            </div>
          </div>

          {/* Delete Account */}
          {!confirming ? (
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setConfirming(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Supprimer mon compte
            </Button>
          ) : (
            <div className="rounded-2xl border-2 border-destructive/30 bg-destructive/5 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-destructive text-sm">
                    Confirmer la suppression
                  </div>
                  <p className="text-xs text-foreground/60 mt-1">
                    Cette action est irréversible. Toutes vos données seront
                    définitivement supprimées.
                  </p>
                </div>
              </div>
              {error && (
                <div className="text-sm text-destructive font-medium">{error}</div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setConfirming(false);
                    setError("");
                  }}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Suppression…
                    </>
                  ) : (
                    "Confirmer"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
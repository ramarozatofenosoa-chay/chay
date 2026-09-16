import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";
import PasswordStrength, { evalPassword } from "@/components/PasswordStrength";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pwStrength = evalPassword(newPassword);
  const passwordValid = pwStrength.level === 3;
  const match = newPassword === confirmPassword && newPassword.length > 0;
  const canSubmit = passwordValid && match && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!passwordValid) {
      setError("Le mot de passe doit atteindre le niveau Fort.");
      return;
    }
    if (!match) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword });
      window.location.href = "/login";
    } catch (err) {
      setError(err.message || "Échec de la réinitialisation");
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl brand-gradient grid place-items-center text-white">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="font-display font-extrabold text-2xl mb-1">Lien invalide</h1>
          <p className="text-sm text-foreground/60 mb-6">
            Ce lien de réinitialisation est incomplet ou invalide.
          </p>
          <Link to="/forgot-password" className="text-primary font-medium hover:underline">
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl brand-gradient grid place-items-center text-white shadow-sm">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="font-display font-extrabold text-2xl">Nouveau mot de passe</h1>
          <p className="text-sm text-foreground/60 mt-1">
            Saisissez votre nouveau mot de passe.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <PasswordInput
              id="password"
              leftIcon={Lock}
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-12"
            />
            <div className="mt-1">
              <PasswordStrength password={newPassword} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirmer le mot de passe</Label>
            <PasswordInput
              id="confirm"
              leftIcon={Lock}
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12"
            />
          </div>
          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full h-12 font-medium border-0 brand-gradient text-white hover:brightness-110"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Réinitialisation…
              </>
            ) : (
              "Réinitialiser le mot de passe"
            )}
          </Button>
        </form>

        <div className="text-center mt-6">
          <Link
            to="/login"
            className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
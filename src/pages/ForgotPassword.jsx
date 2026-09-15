import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch {
      // Toujours afficher un message neutre, sans révéler l'existence du compte.
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B1220] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-r from-[#4F6DF5] via-[#A855F7] to-[#EC4899] grid place-items-center text-white shadow-sm">
            <Mail className="h-7 w-7" />
          </div>
        </div>

        <h1 className="text-center font-display font-extrabold text-2xl text-[#111827] dark:text-[#E6F1FB] mb-1">
          Mot de passe oublié
        </h1>
        <p className="text-center text-sm text-[#4B5563] dark:text-[#99C9FF] mb-6">
          Vous recevrez un lien de réinitialisation par e-mail.
        </p>

        {sent ? (
          <div className="p-4 rounded-xl bg-[#EAF3FE] dark:bg-[#13203A] text-[#0C447C] dark:text-[#E6F1FB] text-sm flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-[#4F6DF5] dark:text-[#6FB3FF]" />
            <span>
              Si un compte existe avec cet e-mail, vous recevrez un lien de
              réinitialisation sous peu.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[#4B5563] dark:text-[#99C9FF]">
                Adresse e-mail
              </Label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]"
                  aria-hidden="true"
                />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="chay@chay.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-[#D1D5DB] dark:border-[#374151] focus:border-[#C857A8] dark:focus:border-[#D48FD4] focus-visible:ring-[#C857A8]"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 font-medium border-0 bg-gradient-to-r from-[#4F6DF5] via-[#A855F7] to-[#EC4899] hover:brightness-110 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi en cours…
                </>
              ) : (
                "Envoyer le lien de réinitialisation"
              )}
            </Button>
          </form>
        )}

        <div className="text-center mt-6">
          <Link
            to="/login"
            className="text-sm text-[#6B2D6B] dark:text-[#B06FB0] font-medium hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
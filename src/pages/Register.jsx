import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UserPlus,
  Mail,
  Lock,
  Loader2,
  MapPin,
  Check,
  User,
  Phone,
  CalendarDays,
  Camera,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";

// step 0 = method, 1 = credentials, 2 = OTP, 3-7 = profile wizard
const TOTAL_PROFILE = 5;

export default function Register() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // credentials
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // profile
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [loc, setLoc] = useState(null);
  const [locStatus, setLocStatus] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");

  // consents
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentCookies, setConsentCookies] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus("unsupported");
      return;
    }
    setLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus("granted");
        setError("");
      },
      () => setLocStatus("denied")
    );
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", safeReturnTo());
  };

  // Step 1 -> register
  const submitCredentials = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setStep(2);
    } catch (err) {
      setError(err.message || "Échec de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 -> verify OTP, setToken, go to profile
  const verifyOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      setStep(3);
    } catch (err) {
      setError(err.message || "Code de vérification invalide");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({ title: "Code envoyé", description: "Vérifiez votre e-mail." });
    } catch (err) {
      setError(err.message || "Échec du renvoi");
    }
  };

  // Step 5 -> upload photo
  const uploadPhoto = async () => {
    if (!photoFile) return;
    setLoading(true);
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({
        file: photoFile,
      });
      setPhotoUrl(file_url);
    } catch (err) {
      setError(err.message || "Échec de l'upload");
    } finally {
      setLoading(false);
    }
  };

  // Step 7 -> finish: save profile + redirect
  const finish = async () => {
    setError("");
    if (!consentPrivacy || !consentCookies || !consentTerms) {
      setError("Veuillez accepter les trois conditions pour terminer.");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.updateMe({
        first_name: firstName,
        last_name: lastName,
        birth_date: birthDate || null,
        phone,
        profile_photo_url: photoUrl || null,
        location_lat: loc?.lat ?? null,
        location_lng: loc?.lng ?? null,
        location_label: city,
        consents_accepted: true,
      });
      window.location.href = safeReturnTo();
    } catch (err) {
      setError(err.message || "Échec de l'enregistrement du profil");
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    setError("");
    if (step === 3 && (!firstName.trim() || !lastName.trim())) {
      setError("Veuillez indiquer votre prénom et votre nom");
      return;
    }
    if (step === 4 && !birthDate) {
      setError("Veuillez indiquer votre date de naissance");
      return;
    }
    setStep((s) => s + 1);
  };
  const back = () => {
    setError("");
    setStep((s) => Math.max(0, s - 1));
  };

  const profileStepNumber = step >= 3 ? step - 2 : 0; // 1..5

  // ---------- STEP 0: method ----------
  if (step === 0) {
    return (
      <AuthLayout
        icon={UserPlus}
        title="Rejoignez CHAY"
        subtitle="Créez votre compte pour rejoindre la communauté"
        footer={
          <>
            Déjà un compte ?{" "}
            <Link
              to={"/login" + (safeReturnTo() !== "/" ? "?returnTo=" + encodeURIComponent(safeReturnTo()) : "")}
              className="text-primary font-medium hover:underline"
            >
              Se connecter
            </Link>
          </>
        }
      >
        <Button
          variant="outline"
          className="w-full h-12 text-sm font-medium mb-6"
          onClick={handleGoogle}
        >
          <GoogleIcon className="w-5 h-5 mr-2" /> Continuer avec Google
        </Button>
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted-foreground">ou</span>
          </div>
        </div>
        <Button
          className="w-full h-12 font-medium"
          onClick={() => setStep(1)}
        >
          S'inscrire avec mon e-mail
        </Button>
      </AuthLayout>
    );
  }

  // ---------- STEP 1: credentials ----------
  if (step === 1) {
    return (
      <AuthLayout icon={Mail} title="Vos identifiants" subtitle="Créez votre accès sécurisé">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        )}
        <form onSubmit={submitCredentials} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmer le mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Création…
              </>
            ) : (
              "Continuer"
            )}
          </Button>
        </form>
        <button
          onClick={back}
          className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Retour
        </button>
      </AuthLayout>
    );
  }

  // ---------- STEP 2: OTP ----------
  if (step === 2) {
    return (
      <AuthLayout icon={Mail} title="Vérifiez votre e-mail" subtitle={`Nous avons envoyé un code à ${email}`}>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button className="w-full h-12 font-medium" onClick={verifyOtp} disabled={loading || otpCode.length < 6}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Vérification…
            </>
          ) : (
            "Vérifier"
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Pas reçu de code ?{" "}
          <button onClick={resendOtp} className="text-primary font-medium hover:underline">
            Renvoyer
          </button>
        </p>
      </AuthLayout>
    );
  }

  // ---------- STEPS 3-7: profile wizard ----------
  const StepShell = ({ icon: Icon, title, subtitle, children }) => (
    <AuthLayout icon={Icon} title={title} subtitle={subtitle}>
      {/* progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-2">
          <span>Étape {profileStepNumber} / {TOTAL_PROFILE}</span>
          <span>{Math.round((profileStepNumber / TOTAL_PROFILE) * 100)}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full brand-gradient transition-all"
            style={{ width: `${(profileStepNumber / TOTAL_PROFILE) * 100}%` }}
          />
        </div>
      </div>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}
      {children}
      <div className="flex gap-3 mt-6">
        <Button variant="outline" className="flex-1 h-12" onClick={back}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Retour
        </Button>
        {step < 7 && (
          <Button className="flex-1 h-12 font-medium" onClick={next}>
            Continuer
          </Button>
        )}
        {step === 7 && (
          <Button className="flex-1 h-12 font-medium" onClick={finish} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Finalisation…
              </>
            ) : (
              "Terminer"
            )}
          </Button>
        )}
      </div>
    </AuthLayout>
  );

  if (step === 3) {
    return (
      <StepShell icon={User} title="Votre nom" subtitle="Comment vous appelez-vous ?">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="firstName"
                placeholder="Jean"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              placeholder="Rakoto"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="h-12"
            />
          </div>
        </div>
      </StepShell>
    );
  }

  if (step === 4) {
    return (
      <StepShell icon={CalendarDays} title="Date de naissance" subtitle="Pour personnaliser votre expérience">
        <div className="space-y-2">
          <Label htmlFor="birthDate">Date de naissance</Label>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </div>
      </StepShell>
    );
  }

  if (step === 5) {
    return (
      <StepShell icon={Camera} title="Photo de profil" subtitle="Ajoutez votre photo (optionnel)">
        <div className="flex flex-col items-center gap-4">
          <div className="h-28 w-28 rounded-full overflow-hidden border-2 border-border bg-muted grid place-items-center">
            {photoUrl ? (
              <img src={photoUrl} alt="Profil" className="w-full h-full object-cover" />
            ) : (
              <User className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <label className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-bold cursor-pointer hover:bg-muted transition">
            <Camera className="h-4 w-4" />
            {photoFile ? "Changer la photo" : "Choisir une photo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setPhotoFile(f);
                setPhotoUrl(URL.createObjectURL(f));
                setLoading(true);
                setError("");
                try {
                  const { file_url } = await base44.integrations.Core.UploadPublicFile({ file: f });
                  setPhotoUrl(file_url);
                } catch (err) {
                  setError(err.message || "Échec de l'upload de la photo");
                } finally {
                  setLoading(false);
                }
              }}
            />
          </label>
          {photoFile && !photoUrl?.startsWith("http") && (
            <Button variant="secondary" className="h-10" onClick={uploadPhoto} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Envoi…
                </>
              ) : (
                "Enregistrer la photo"
              )}
            </Button>
          )}
          <p className="text-xs text-muted-foreground text-center">
            Vous pouvez passer cette étape et ajouter votre photo plus tard.
          </p>
        </div>
      </StepShell>
    );
  }

  if (step === 6) {
    return (
      <StepShell icon={MapPin} title="Localisation" subtitle="Pour trouver une église près de vous">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant={locStatus === "granted" ? "secondary" : "default"}
                onClick={getLocation}
                className="h-10"
              >
                {locStatus === "loading" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : locStatus === "granted" ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <MapPin className="w-4 h-4 mr-2" />
                )}
                {locStatus === "granted" ? "Localisation activée" : "Activer ma localisation"}
              </Button>
              {locStatus === "denied" && (
                <span className="text-xs text-destructive font-medium">
                  Accès refusé — indiquez votre ville
                </span>
              )}
            </div>
            <Input
              placeholder="Votre ville (ex. Antananarivo, Paris)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="h-11"
            />
            {loc && (
              <p className="text-xs text-muted-foreground">
                Coordonnées : {loc.lat.toFixed(3)}, {loc.lng.toFixed(3)}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone (optionnel)</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+261 …"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </div>
        </div>
      </StepShell>
    );
  }

  // step 7: consents
  return (
    <StepShell icon={ShieldCheck} title="Vos consentements" subtitle="Acceptez les conditions pour terminer">
      <div className="space-y-3">
        {[
          { state: consentPrivacy, set: setConsentPrivacy, label: "Politique de confidentialité", desc: "J'accepte que mes données soient traitées conformément à la politique de confidentialité de CHAY." },
          { state: consentCookies, set: setConsentCookies, label: "Cookies", desc: "J'autorise l'utilisation de cookies pour améliorer mon expérience sur l'application." },
          { state: consentTerms, set: setConsentTerms, label: "Conditions d'utilisation", desc: "J'accepte les conditions générales d'utilisation de la communauté CHAY." },
        ].map((c, i) => (
          <label
            key={i}
            className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition ${
              c.state ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <button
              type="button"
              onClick={() => c.set(!c.state)}
              className={`mt-0.5 h-5 w-5 rounded-md border-2 grid place-items-center shrink-0 transition ${
                c.state ? "bg-primary border-primary text-primary-foreground" : "border-border"
              }`}
            >
              {c.state && <Check className="h-3.5 w-3.5" />}
            </button>
            <div>
              <div className="font-bold text-sm">{c.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{c.desc}</div>
            </div>
          </label>
        ))}
      </div>
    </StepShell>
  );
}
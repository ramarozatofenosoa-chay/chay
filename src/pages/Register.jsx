import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import DrawerSelect from "@/components/DrawerSelect";
import { useToast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";
import {
  UserPlus,
  Mail,
  Lock,
  Loader2,
  MapPin,
  Check,
  Phone,
  CalendarDays,
  User,
  Home,
  Droplet,
  Heart,
  ChevronLeft,
} from "lucide-react";

const GENDERS = [
  { label: "Homme", value: "homme" },
  { label: "Femme", value: "femme" },
  { label: "Autre", value: "autre" },
];

function Field({ label, icon: Icon, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />} {label}
      </Label>
      {children}
    </div>
  );
}

export default function Register() {
  const { toast } = useToast();
  const [step, setStep] = useState(0); // 0 = form, 1 = OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // required
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // optional — to know you better
  const [birthDate, setBirthDate] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [conversionDate, setConversionDate] = useState("");
  const [baptized, setBaptized] = useState(false);
  const [baptismDate, setBaptismDate] = useState("");
  const [church, setChurch] = useState("");
  const [bio, setBio] = useState("");
  const [spiritualJourney, setSpiritualJourney] = useState("");
  const [knownChaySince, setKnownChaySince] = useState("");

  // consents
  const [respectConsent, setRespectConsent] = useState(false);
  const [loc, setLoc] = useState(null);
  const [locStatus, setLocStatus] = useState("");

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

  const submitForm = async (e) => {
    e.preventDefault();
    setError("");
    if (!firstName.trim() || !lastName.trim())
      return setError("Veuillez indiquer votre prénom et votre nom");
    if (!email.trim()) return setError("Veuillez indiquer votre e-mail");
    if (!phone.trim()) return setError("Veuillez indiquer votre téléphone");
    if (!gender) return setError("Veuillez indiquer votre genre");
    if (!country.trim()) return setError("Veuillez indiquer votre pays");
    if (!city.trim()) return setError("Veuillez indiquer votre ville");
    if (password !== confirmPassword)
      return setError("Les mots de passe ne correspondent pas");
    if (password.length < 6)
      return setError("Le mot de passe doit contenir au moins 6 caractères");
    if (!respectConsent)
      return setError("Veuillez accepter la charte de respect des commentaires");
    if (locStatus !== "granted" || !loc)
      return setError("Veuillez activer votre localisation pour finaliser l'inscription");

    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setStep(1);
    } catch (err) {
      setError(err.message || "Échec de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      await base44.auth.updateMe({
        first_name: firstName,
        last_name: lastName,
        phone,
        gender,
        country,
        city,
        location_lat: loc.lat,
        location_lng: loc.lng,
        location_label: `${city}, ${country}`,
        birth_date: birthDate || null,
        birth_place: birthPlace || null,
        conversion_date: conversionDate || null,
        baptized,
        baptism_date: baptized ? baptismDate || null : null,
        church: baptized ? church || null : null,
        bio: bio || null,
        spiritual_journey: spiritualJourney || null,
        known_chay_since: knownChaySince || null,
        respect_consent: respectConsent,
        consents_accepted: true,
      });
      toast({ title: "Bienvenue sur CHAY", description: "Votre compte a été créé." });
      window.location.href = safeReturnTo();
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

  const loginLink =
    "/login" +
    (safeReturnTo() !== "/"
      ? "?returnTo=" + encodeURIComponent(safeReturnTo())
      : "");

  // ---------- OTP step ----------
  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 h-14 w-14 rounded-2xl brand-gradient grid place-items-center text-white">
              <Mail className="h-7 w-7" />
            </div>
            <h1 className="font-display font-extrabold text-2xl">Vérifiez votre e-mail</h1>
            <p className="text-sm text-foreground/60 mt-1">
              Nous avons envoyé un code à {email}
            </p>
          </div>
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
          <div className="flex justify-center mb-6">
            <InputOTP
              maxLength={6}
              value={otpCode}
              onChange={setOtpCode}
              autoFocus
              autoComplete="one-time-code"
            >
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
          <Button
            className="w-full h-12 font-medium brand-gradient text-white border-0"
            onClick={verifyOtp}
            disabled={loading || otpCode.length < 6}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Vérification…
              </>
            ) : (
              "Vérifier"
            )}
          </Button>
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setStep(0)}
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Modifier le formulaire
            </button>
            <button
              onClick={resendOtp}
              className="text-sm text-primary font-medium hover:underline"
            >
              Renvoyer le code
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Form step ----------
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
        <header className="mb-6 text-center">
          <div className="mx-auto mb-3 h-14 w-14 rounded-2xl brand-gradient grid place-items-center text-white">
            <UserPlus className="h-7 w-7" />
          </div>
          <h1 className="font-display font-extrabold text-3xl">
            <span className="brand-gradient-text">Rejoignez CHAY</span>
          </h1>
          <p className="mt-2 text-foreground/60">
            Créez votre compte pour rejoindre la communauté
          </p>
        </header>

        <form onSubmit={submitForm} className="space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Required */}
          <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wide text-foreground/50 flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> Informations obligatoires
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prénom" icon={User}>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jean"
                  className="h-11"
                  required
                />
              </Field>
              <Field label="Nom" icon={User}>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Rakoto"
                  className="h-11"
                  required
                />
              </Field>
            </div>
            <Field label="E-mail" icon={Mail}>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                className="h-11"
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Téléphone" icon={Phone}>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+261 …"
                  className="h-11"
                  required
                />
              </Field>
              <Field label="Genre">
                <DrawerSelect
                  value={gender}
                  onChange={setGender}
                  title="Genre"
                  options={GENDERS}
                  placeholder="Sélectionner…"
                  triggerClassName="w-full h-11"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Pays" icon={MapPin}>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Madagascar"
                  className="h-11"
                  required
                />
              </Field>
              <Field label="Ville" icon={MapPin}>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Antananarivo"
                  className="h-11"
                  required
                />
              </Field>
            </div>
            <Field label="Mot de passe" icon={Lock}>
              <Input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11"
                required
              />
            </Field>
            <Field label="Confirmer le mot de passe" icon={Lock}>
              <Input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11"
                required
              />
            </Field>
          </section>

          {/* Optional — about you */}
          <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-foreground/50">
                Pour mieux vous connaître
              </div>
              <p className="text-xs text-foreground/40 mt-1">
                Les champs suivants ne sont pas obligatoires, mais ils nous aident
                à mieux vous connaître.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date de naissance" icon={CalendarDays}>
                <Input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="h-11"
                />
              </Field>
              <Field label="Lieu de naissance" icon={Home}>
                <Input
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  placeholder="Ville"
                  className="h-11"
                />
              </Field>
            </div>
            <Field label="Date de conversion" icon={Heart}>
              <Input
                type="date"
                value={conversionDate}
                onChange={(e) => setConversionDate(e.target.value)}
                className="h-11"
              />
            </Field>
            <label className="flex items-center gap-3 rounded-xl border border-border p-3 cursor-pointer">
              <button
                type="button"
                onClick={() => setBaptized((b) => !b)}
                className={`h-5 w-5 rounded-md border-2 grid place-items-center shrink-0 transition ${
                  baptized
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border"
                }`}
              >
                {baptized && <Check className="h-3.5 w-3.5" />}
              </button>
              <span className="text-sm font-semibold">J'ai été baptisé(e)</span>
            </label>
            {baptized && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date de baptême" icon={Droplet}>
                  <Input
                    type="date"
                    value={baptismDate}
                    onChange={(e) => setBaptismDate(e.target.value)}
                    className="h-11"
                  />
                </Field>
                <Field label="Église" icon={Home}>
                  <Input
                    value={church}
                    onChange={(e) => setChurch(e.target.value)}
                    placeholder="Nom de l'église"
                    className="h-11"
                  />
                </Field>
              </div>
            )}
            <Field label="Bio">
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="Quelques mots sur vous…"
              />
            </Field>
            <Field label="Parcours spirituel">
              <Textarea
                value={spiritualJourney}
                onChange={(e) => setSpiritualJourney(e.target.value)}
                rows={2}
                placeholder="Votre cheminement avec Dieu…"
              />
            </Field>
            <Field label="Depuis quand avez-vous connu l'Église Chay ?" icon={CalendarDays}>
              <Input
                type="date"
                value={knownChaySince}
                onChange={(e) => setKnownChaySince(e.target.value)}
                className="h-11"
              />
            </Field>
          </section>

          {/* Location */}
          <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wide text-foreground/50 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> Localisation
            </div>
            <p className="text-xs text-foreground/50">
              L'activation de la localisation est obligatoire pour valider votre
              inscription.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                type="button"
                variant={locStatus === "granted" ? "secondary" : "default"}
                onClick={getLocation}
                className="h-11"
              >
                {locStatus === "loading" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : locStatus === "granted" ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <MapPin className="h-4 w-4 mr-2" />
                )}
                {locStatus === "granted"
                  ? "Localisation activée"
                  : "Activer ma localisation"}
              </Button>
              {locStatus === "denied" && (
                <span className="text-xs text-destructive font-medium">
                  Accès refusé — réessayez
                </span>
              )}
              {locStatus === "unsupported" && (
                <span className="text-xs text-destructive font-medium">
                  Non supporté sur cet appareil
                </span>
              )}
            </div>
          </section>

          {/* Respect consent */}
          <label className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 cursor-pointer">
            <button
              type="button"
              onClick={() => setRespectConsent((v) => !v)}
              className={`mt-0.5 h-5 w-5 rounded-md border-2 grid place-items-center shrink-0 transition ${
                respectConsent
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-border"
              }`}
            >
              {respectConsent && <Check className="h-3.5 w-3.5" />}
            </button>
            <span className="text-sm text-foreground/80 selectable">
              Malalaka ny fanehoan-kevitra sy "commentaires" amin'ny "actualités"
              ato amin'ny Application Chay fa atao am-panajana tanteraka.
            </span>
          </label>

          <Button
            type="submit"
            className="w-full h-12 font-medium brand-gradient text-white border-0"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Création…
              </>
            ) : (
              "Créer mon compte"
            )}
          </Button>

          <p className="text-center text-sm text-foreground/60">
            Déjà un compte ?{" "}
            <Link to={loginLink} className="text-primary font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, MapPin, Check, User, Phone, CalendarDays } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loc, setLoc] = useState(null);
  const [locStatus, setLocStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const getLocation = () => {
    if (!navigator.geolocation) { setLocStatus("unsupported"); return; }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Les mots de passe ne correspondent pas"); return; }
    if (!loc && !city.trim()) {
      setError("Activez votre localisation (ou indiquez votre ville) pour que nous puissions trouver une église près de vous.");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Échec de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      try {
        await base44.auth.updateMe({
          first_name: firstName,
          last_name: lastName,
          birth_date: birthDate,
          phone,
          location_lat: loc?.lat ?? null,
          location_lng: loc?.lng ?? null,
          location_label: city,
        });
      } catch { /* profile save is best-effort */ }
      window.location.href = safeReturnTo();
    } catch (err) {
      setError(err.message || "Code de vérification invalide");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({ title: "Code envoyé", description: "Vérifiez votre e-mail pour le nouveau code." });
    } catch (err) {
      setError(err.message || "Échec du renvoi du code");
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", safeReturnTo());
  };

  if (showOtp) {
    return (
      <AuthLayout icon={Mail} title="Vérifiez votre e-mail" subtitle={`Nous avons envoyé un code à ${email}`}>
        {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>
              <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
              <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button className="w-full h-12 font-medium" onClick={handleVerify} disabled={loading || otpCode.length < 6}>
          {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Vérification...</>) : "Vérifier"}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Pas reçu de code ?{" "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">Renvoyer</button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title="Rejoignez CHAY"
      subtitle="Créez votre compte pour rejoindre la communauté"
      footer={
        <>
          Déjà un compte ?{" "}
          <Link to={"/login" + (safeReturnTo() !== "/" ? "?returnTo=" + encodeURIComponent(safeReturnTo()) : "")} className="text-primary font-medium hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <Button variant="outline" className="w-full h-12 text-sm font-medium mb-6" onClick={handleGoogle}>
        <GoogleIcon className="w-5 h-5 mr-2" /> Continuer avec Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-3 text-muted-foreground">ou</span></div>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="firstName" placeholder="Jean" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="pl-10 h-12" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Nom</Label>
            <Input id="lastName" placeholder="Rakoto" value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-12" required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="email" type="email" autoComplete="email" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="birthDate">Date de naissance</Label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="pl-10 h-12" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="phone" type="tel" placeholder="+261 ..." value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10 h-12" />
            </div>
          </div>
        </div>

        {/* Localization */}
        <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="h-4 w-4 text-primary" /> Localisation
            <span className="text-muted-foreground font-normal">— pour trouver une église près de vous</span>
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant={locStatus === "granted" ? "secondary" : "default"} onClick={getLocation} className="h-10">
              {locStatus === "loading" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> :
                locStatus === "granted" ? <Check className="w-4 h-4 mr-2" /> : <MapPin className="w-4 h-4 mr-2" />}
              {locStatus === "granted" ? "Localisation activée" : "Activer ma localisation"}
            </Button>
            {locStatus === "denied" && <span className="text-xs text-destructive font-medium">Accès refusé — indiquez votre ville ci-dessous</span>}
            {locStatus === "unsupported" && <span className="text-xs text-muted-foreground">Non supporté — indiquez votre ville</span>}
          </div>
          <Input placeholder="Votre ville (ex. Antananarivo, Paris)" value={city} onChange={(e) => setCity(e.target.value)} className="h-11" />
          {loc && <p className="text-xs text-muted-foreground">Coordonnées enregistrées : {loc.lat.toFixed(3)}, {loc.lng.toFixed(3)}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmer le mot de passe</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="confirm" type="password" autoComplete="new-password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>

        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Création...</>) : "Créer mon compte"}
        </Button>
      </form>
    </AuthLayout>
  );
}
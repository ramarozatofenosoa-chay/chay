import React, { useEffect, useState } from "react";
import { MapPin, Loader2, CloudSun } from "lucide-react";

export default function WeatherCard() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const [wRes, geoRes] = await Promise.all([
            fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`
            ),
            fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=fr`
            ),
          ]);
          const wData = await wRes.json();
          const geoData = await geoRes.json();
          const city =
            geoData.city ||
            geoData.locality ||
            geoData.principalSubdivision ||
            "Votre position";
          setWeather({
            temp: Math.round(wData.current?.temperature_2m ?? 0),
            city,
            country: geoData.countryName || "",
          });
        } catch {
          /* ignore */
        }
        setLoading(false);
      },
      () => setLoading(false),
      { timeout: 8000 }
    );
  }, []);

  if (loading) {
    return (
      <div className="rounded-[1.5rem] border border-border bg-card p-5 flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm font-semibold text-foreground/50">
          Localisation de la météo…
        </span>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="rounded-[1.5rem] border border-border bg-card p-5 flex items-center gap-4">
      <div className="h-12 w-12 rounded-2xl bg-primary/10 grid place-items-center text-primary shrink-0">
        <CloudSun className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-bold uppercase tracking-wide text-foreground/50 flex items-center gap-1 truncate">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {weather.city}
            {weather.country ? `, ${weather.country}` : ""}
          </span>
        </div>
        <div className="font-display font-extrabold text-2xl tabular-nums">
          {weather.temp}°
        </div>
      </div>
    </div>
  );
}
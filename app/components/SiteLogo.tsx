"use client";

import { useEffect, useState } from "react";
import Image from "next/image"; // next/image verwendet internen Loader

export default function SiteLogo() {
  // Zustand für die Logo-URL
  const [src, setSrc] = useState<string | null>(null);
  // Zustand für die Ausrichtung: links, zentriert oder rechts
  const [align, setAlign] = useState<"left" | "center" | "right">("center");
  // Zustand zum Verstecken des Logos bei Fehlern
  const [hide, setHide] = useState(false);

  // Beim Laden der Komponente: Logo-URL und Ausrichtung aus localStorage lesen
  useEffect(() => {
    const stored = localStorage.getItem("siteLogo");
    const position = localStorage.getItem("siteLogoAlign");
    if (stored) setSrc(stored);
    if (position === "left" || position === "center" || position === "right") {
      setAlign(position);
    }
  }, []);

  // Wenn kein Logo geladen oder Fehler beim Laden, nicht anzeigen
  if (!src || hide) return null;

  // Nur absolute URLs funktionieren mit <Image unoptimized /> oder img
  // Da Benutzer lokale Dateien auswählen können, besser <img> verwenden
  return (
    <div
      className={`w-full ${
        align === "left"
          ? "text-left"
          : align === "right"
          ? "text-right"
          : "text-center"
      } mb-4`}
    >
      <img
        src={src} // Bildquelle
        alt="Logo" // Alternativtext für Screenreader
        onError={() => setHide(true)} // Fehler beim Laden -> nicht anzeigen
        className="inline-block h-14"
      />
    </div>
  );
}

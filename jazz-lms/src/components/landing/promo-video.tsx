"use client";

import { useLanguage } from "@/components/providers/language-provider";
import MuxPlayer from "@mux/mux-player-react";
import type MuxPlayerElement from "@mux/mux-player";
import { LogIn, Volume2, VolumeX } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function PromoVideo() {
  const router = useRouter();
  const { language } = useLanguage();
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const muxPlayerRef = useRef<MuxPlayerElement | null>(null);
  const nativeVideoRef = useRef<HTMLVideoElement | null>(null);
  const [shouldLoadPlayer, setShouldLoadPlayer] = useState(false);
  const [shouldUseMuxPlayer, setShouldUseMuxPlayer] = useState(true);
  const [playbackId, setPlaybackId] = useState("");
  const [playbackToken, setPlaybackToken] = useState("");
  const [thumbnailToken, setThumbnailToken] = useState("");
  const [storyboardToken, setStoryboardToken] = useState("");
  const [muxRuntimeError, setMuxRuntimeError] = useState("");
  const [playerRetryCount, setPlayerRetryCount] = useState(0);
  const posterUrl = playbackId
    ? `https://image.mux.com/${playbackId}/thumbnail.webp?time=1${thumbnailToken ? `&token=${encodeURIComponent(thumbnailToken)}` : ""}`
    : "";
  const streamTokenQuery = playbackToken
    ? `?token=${encodeURIComponent(playbackToken)}`
    : "";
  const promoHlsUrl = playbackId
    ? `https://stream.mux.com/${playbackId}.m3u8${streamTokenQuery}`
    : "";
  const promoMp4Url = playbackId
    ? `https://stream.mux.com/${playbackId}/high.mp4${streamTokenQuery}`
    : "";
  const hasMuxPlayback = Boolean(playbackId && !muxRuntimeError);
  const copy = {
    es: {
      promotionMessage: "Regístrate y recibe la primera clase gratis",
      pretitle: "Curso Online · Con Enric Vazquez Ramonich",
      titleTop: "La Cultura",
      titleBottomPrefix: "del",
      subtitle: "Entra en el mundo del jazz",
      paragraph:
        "Vive una experiencia que cambiará para siempre tu forma de sentir la música. No necesitas ser músico ni experto para disfrutar el jazz.",
      cta: "Regístrate",
      muxError: "No se pudo cargar el video promocional de Mux.",
      fallbackLabel: "Vista previa de la primera clase",
      loading: "Cargando video promocional...",
      mute: "Silenciar",
      unmute: "Activar sonido",
    },
    en: {
      promotionMessage: "Register and receive the first course for free",
      pretitle: "Online Course · With Enric Vazquez Ramonich",
      titleTop: "The Culture",
      titleBottomPrefix: "of",
      subtitle: "Enter the world of jazz",
      paragraph:
        "Live an experience that will forever change the way you feel music. You do not need to be a musician or an expert to enjoy jazz.",
      cta: "Sign Up",
      muxError: "Unable to load the Mux promo video.",
      fallbackLabel: "First class preview",
      loading: "Loading promo video...",
      mute: "Mute",
      unmute: "Unmute",
    },
    fr: {
      promotionMessage: "Inscrivez-vous et recevez le premier cours gratuitement",
      pretitle: "Cours en ligne · Avec Enric Vazquez Ramonich",
      titleTop: "La Culture",
      titleBottomPrefix: "du",
      subtitle: "Entrez dans le monde du jazz",
      paragraph:
        "Vivez une expérience qui changera à jamais votre façon de ressentir la musique. Vous n’avez pas besoin d’être musicien ou expert pour apprécier le jazz.",
      cta: "S’inscrire",
      muxError: "Impossible de charger la vidéo promo Mux.",
      fallbackLabel: "Aperçu du premier cours",
      loading: "Chargement de la vidéo promo...",
      mute: "Couper le son",
      unmute: "Activer le son",
    },
    pt: {
      promotionMessage: "Regístrate y recibe la primera clase gratis",
      pretitle: "Curso Online · Con Enric Vazquez Ramonich",
      titleTop: "La Cultura",
      titleBottomPrefix: "del",
      subtitle: "Entra en el mundo del jazz",
      paragraph:
        "Vive una experiencia que cambiará para siempre la forma en que sientes la música. No necesitas ser músico ni especialista para disfrutar el jazz.",
      cta: "Regístrate",
      muxError: "No fue posible cargar el video promocional de Mux.",
      fallbackLabel: "Vista previa de la primera clase",
      loading: "Cargando video promocional...",
      mute: "Silenciar",
      unmute: "Activar sonido",
    },
  }[language === 'pt' ? 'es' : language];

  useEffect(() => {
    const idleCallback = window.requestIdleCallback?.(
      () => {
        setShouldLoadPlayer(true);
      },
      { timeout: 1500 },
    );

    if (idleCallback !== undefined) {
      return () => window.cancelIdleCallback?.(idleCallback);
    }

    const timeoutId = window.setTimeout(() => {
      setShouldLoadPlayer(true);
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!shouldLoadPlayer) {
      return;
    }

    let cancelled = false;

    const loadPromoPlayback = async () => {
      try {
        const response = await fetch("/api/mux/promo-playback", {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Promo playback request failed");
        }
        const data = await response.json();
        if (cancelled) return;

        setPlaybackId(data.playbackId || "");
        setPlaybackToken(data.playbackToken || "");
        setThumbnailToken(data.thumbnailToken || "");
        setStoryboardToken(data.storyboardToken || "");
        setShouldUseMuxPlayer(true);
        setMuxRuntimeError("");
        setPlayerRetryCount(0);
      } catch {
        if (cancelled) return;
        setMuxRuntimeError(copy.muxError);
      }
    };

    loadPromoPlayback();

    return () => {
      cancelled = true;
    };
  }, [copy.muxError, shouldLoadPlayer]);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    if (muxPlayerRef.current) {
      muxPlayerRef.current.muted = nextMuted;
    }
    if (nativeVideoRef.current) {
      nativeVideoRef.current.muted = nextMuted;
    }
    setIsMuted(!isMuted);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] w-full bg-gray-100 dark:bg-black flex items-start">
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-6 sm:py-8">
        <div
          data-testid="home-promo-message"
          className="mb-6 rounded-xl border border-[var(--color-jazz-title-accent)]/60 bg-gradient-to-r from-[var(--color-jazz-cta)]/20 via-[var(--color-jazz-title-accent)]/12 to-transparent px-4 py-3 sm:px-5 sm:py-3.5 shadow-[0_10px_30px_rgba(212,175,55,0.16)]"
        >
          <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white tracking-wide">
            {copy.promotionMessage}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start min-h-[72vh]">
          {/* Left side - Text & CTA */}
          <div className="flex flex-col justify-center space-y-8">
            <div>
              <p
                data-testid="home-promo-pretitle"
                className="title-accent text-sm sm:text-base uppercase tracking-widest mb-4 font-medium"
              >
                {copy.pretitle}
              </p>
              <h1 className="text-gray-900 dark:text-white text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-2">
                {copy.titleTop}
              </h1>
              <h1 className="text-gray-900 dark:text-white text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-4">
                {copy.titleBottomPrefix} <em className="title-accent">Jazz</em>
              </h1>
            </div>

            <div className="border-l-4 title-accent-border pl-6">
              <h2 className="title-accent text-3xl sm:text-4xl font-bold italic mb-4">
                {copy.subtitle}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg leading-relaxed">
                {copy.paragraph}
              </p>
            </div>

            <button
              onClick={() => router.push("/auth?tab=register")}
              className="cta-highlight flex items-center gap-3 py-4 px-10 rounded-lg transition-all duration-300 hover:shadow-xl hover:scale-105 w-fit text-lg"
            >
              <LogIn className="h-5 w-5" />
              {copy.cta}
            </button>
          </div>

          {/* Right side - Promo Video */}
          <div
            data-testid="home-promo-video-frame"
            className="relative w-full aspect-[16/10] lg:max-h-[62vh] rounded-xl overflow-hidden shadow-2xl border border-[var(--color-jazz-title-accent)]/60"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {hasMuxPlayback ? (
              shouldUseMuxPlayer ? (
                <MuxPlayer
                  ref={muxPlayerRef}
                  playbackId={playbackId}
                  tokens={{
                    playback: playbackToken || undefined,
                    thumbnail: thumbnailToken || undefined,
                    storyboard: storyboardToken || undefined,
                  }}
                  poster={posterUrl || undefined}
                  autoPlay
                  muted={isMuted}
                  loop
                  playsInline
                  preload="auto"
                  primaryColor="#FBBF24"
                  secondaryColor="#1f2937"
                  className="absolute inset-0 w-full h-full"
                  onError={() => {
                    // Fallback to native video player
                    setShouldUseMuxPlayer(false);
                  }}
                />
              ) : (
                <video
                  ref={nativeVideoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  poster={posterUrl || undefined}
                  autoPlay
                  muted={isMuted}
                  loop
                  playsInline
                  preload="auto"
                  disableRemotePlayback
                  controlsList="noremoteplayback nodownload noplaybackrate"
                  onLoadedData={() => {
                    setMuxRuntimeError("");
                  }}
                  onError={async () => {
                    if (playerRetryCount < 1) {
                      try {
                        const response = await fetch(
                          "/api/mux/promo-playback?retry=1",
                          { cache: "no-store" },
                        );
                        if (!response.ok) {
                          throw new Error("Promo playback retry request failed");
                        }

                        const data = await response.json();
                        setPlaybackId(data.playbackId || "");
                        setPlaybackToken(data.playbackToken || "");
                        setThumbnailToken(data.thumbnailToken || "");
                        setStoryboardToken(data.storyboardToken || "");
                        setShouldUseMuxPlayer(true);
                        setMuxRuntimeError("");
                        setPlayerRetryCount(1);
                        return;
                      } catch {
                        // Fall through and render the visual fallback preview.
                      }
                    }

                    setMuxRuntimeError(copy.muxError);
                  }}
                >
                  {promoHlsUrl ? (
                    <source src={promoHlsUrl} type="application/x-mpegURL" />
                  ) : null}
                  {promoMp4Url ? (
                    <source src={promoMp4Url} type="video/mp4" />
                  ) : null}
                </video>
              )
            ) : (
              <div
                data-testid="home-promo-video-fallback"
                className="absolute inset-0"
              >
                <Image
                  src="/images/clase1.jpg"
                  alt={copy.fallbackLabel}
                  fill
                  priority
                  className="object-cover"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                <div className="absolute left-4 bottom-4 rounded-lg border border-white/20 bg-black/55 px-3 py-2 backdrop-blur-sm">
                  <p className="text-xs font-semibold tracking-wide text-white/95">
                    {copy.fallbackLabel}
                  </p>
                </div>
              </div>
            )}

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/20 pointer-events-none" />

            {/* Mute/Unmute button */}
            {hasMuxPlayback ? (
              <button
                onClick={toggleMute}
                className={`absolute bottom-4 right-4 z-20 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all duration-300 ${
                  isHovered ? "opacity-100" : "opacity-0"
                }`}
                aria-label={isMuted ? copy.unmute : copy.mute}
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

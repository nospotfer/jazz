import {
  createMuxPlaybackTokens,
  hasMuxSigningConfig,
  PROMO_MUX_PLAYBACK_ID,
} from "@/lib/mux";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type JwtPayload = {
  aud?: string;
  sub?: string;
  exp?: number;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const payloadJson = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(payloadJson) as JwtPayload;
  } catch {
    return null;
  }
}

function validatePromoTokenPayloads(
  playbackId: string,
  tokens: {
    playbackToken: string;
    thumbnailToken: string;
    storyboardToken: string;
  },
) {
  const playback = decodeJwtPayload(tokens.playbackToken);
  const thumbnail = decodeJwtPayload(tokens.thumbnailToken);
  const storyboard = decodeJwtPayload(tokens.storyboardToken);

  const playbackValid =
    playback?.aud === "v" && playback?.sub === playbackId && !!playback?.exp;
  const thumbnailValid =
    thumbnail?.aud === "t" && thumbnail?.sub === playbackId && !!thumbnail?.exp;
  const storyboardValid =
    storyboard?.aud === "s" && storyboard?.sub === playbackId && !!storyboard?.exp;

  return {
    isValid: playbackValid && thumbnailValid && storyboardValid,
    details: {
      playbackValid,
      thumbnailValid,
      storyboardValid,
    },
  };
}

export async function GET() {
  const missingMuxConfig = !hasMuxSigningConfig();

  if (missingMuxConfig) {
    return NextResponse.json(
      {
        playbackId: PROMO_MUX_PLAYBACK_ID,
        playbackToken: "",
        thumbnailToken: "",
        storyboardToken: "",
        tokenMode: "none",
      },
      {
        headers: {
          "Cache-Control": "no-store, private, max-age=0",
          Pragma: "no-cache",
        },
      },
    );
  }

  try {
    const tokens = createMuxPlaybackTokens(PROMO_MUX_PLAYBACK_ID, 300);
    const tokenValidation = validatePromoTokenPayloads(
      PROMO_MUX_PLAYBACK_ID,
      tokens,
    );

    if (!tokenValidation.isValid) {
      throw new Error(
        `[MUX_PROMO_TOKEN_VALIDATION_FAILED] ${JSON.stringify(tokenValidation.details)}`,
      );
    }

    return NextResponse.json(
      {
        playbackId: PROMO_MUX_PLAYBACK_ID,
        tokenMode: "signed",
        ...tokens,
      },
      {
        headers: {
          "Cache-Control": "no-store, private, max-age=0",
          Pragma: "no-cache",
        },
      },
    );
  } catch (error) {
    console.error("[MUX_PROMO_PLAYBACK_ROUTE_ERROR]", error);
    // Keep the landing promo available even if Mux signing key rotation is temporarily inconsistent.
    return NextResponse.json(
      {
        playbackId: PROMO_MUX_PLAYBACK_ID,
        playbackToken: "",
        thumbnailToken: "",
        storyboardToken: "",
        tokenMode: "none",
      },
      {
        headers: {
          "Cache-Control": "no-store, private, max-age=0",
          Pragma: "no-cache",
        },
      },
    );
  }
}

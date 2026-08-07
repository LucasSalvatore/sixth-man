import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Geometric, not lettered — a favicon this small doesn't have room for a
 * legible glyph, and this way it needs no font fetch to build. The bar is the
 * same shape as the site's diverging bars and section-head ticks: a single
 * gold mark on near-black.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a09",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 18,
            height: 5,
            borderRadius: 1,
            background: "#c8a44d",
          }}
        />
      </div>
    ),
    { ...size },
  );
}

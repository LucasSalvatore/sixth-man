import { cache } from "react";

export const loadGoogleFont = cache(async (family: string, text: string): Promise<ArrayBuffer> => {
  // Built by hand rather than via URLSearchParams: Google's css2 endpoint
  // requires a literal "+" in `family` to mean a space (e.g. "Instrument+Sans"),
  // and URLSearchParams percent-encodes that "+" to %2B, which the endpoint
  // rejects with "400: Invalid selector". Only `text` needs encoding.
  const url = `https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const match = css.match(/src: url\(([^)]+)\) format\('(opentype|truetype)'\)/);
  if (!match) throw new Error(`Could not find a loadable font for ${family}`);
  const response = await fetch(match[1]);
  return response.arrayBuffer();
});

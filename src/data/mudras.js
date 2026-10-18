import images from "./mudra-images.json";
import { MUDRA_INFO } from "./mudraInfo";

// Image paths in mudra-images.json are root-relative (e.g. "/mudras/foo/0.jpg").
// Prefix with Vite's base URL so they resolve correctly when the site is
// deployed under a subpath (e.g. GitHub Pages' /mudra/).
function withBase(path) {
  return import.meta.env.BASE_URL.replace(/\/$/, "") + path;
}

export const MUDRAS = images.map((entry) => {
  const info = MUDRA_INFO[entry.slug] || {
    name: entry.displayName,
    category: "single",
    description: "Description coming soon.",
  };
  return {
    slug: entry.slug,
    name: info.name,
    category: info.category, // "single" | "double"
    description: info.description,
    images: entry.images.map(withBase),
    totalImages: entry.totalImages,
  };
});

export const SINGLE_HAND = MUDRAS.filter((m) => m.category === "single");
export const DOUBLE_HAND = MUDRAS.filter((m) => m.category === "double");

export function getMudra(slug) {
  return MUDRAS.find((m) => m.slug === slug);
}

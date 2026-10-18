import images from "./mudra-images.json";
import { MUDRA_INFO } from "./mudraInfo";

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
    images: entry.images,
    totalImages: entry.totalImages,
  };
});

export const SINGLE_HAND = MUDRAS.filter((m) => m.category === "single");
export const DOUBLE_HAND = MUDRAS.filter((m) => m.category === "double");

export function getMudra(slug) {
  return MUDRAS.find((m) => m.slug === slug);
}

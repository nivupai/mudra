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

// Traditional Abhinaya Darpana order of the 28 Asamyukta Hastas. Katakamukha
// has three recorded variants in this dataset, kept together in its slot;
// Samdamsha has no corresponding folder in the dataset and is omitted.
const SINGLE_HAND_ORDER = [
  "pathaka",
  "tripathaka",
  "ardhapathaka",
  "katrimukha",
  "mayura",
  "ardhachandran",
  "aralam",
  "shukatundam",
  "mushti",
  "sikharam",
  "kapith",
  "katakamukha-1",
  "katakamukha-2",
  "katakamukha-3",
  "suchi",
  "chandrakala",
  "padmakosha",
  "sarpasirsha",
  "mrigasirsha",
  "simhamukham",
  "kangulam",
  "alapadmam",
  "chaturam",
  "bramaram",
  "hamsasyam",
  "hamsapaksha",
  "mukulam",
  "tamarachudam",
  "trishulam",
];

// Traditional Abhinaya Darpana order of the 24 Samyukta Hastas. Dola and
// Utsanga have no corresponding folder in this dataset and are omitted;
// Samputa isn't part of the traditional 24 and is appended at the end.
const DOUBLE_HAND_ORDER = [
  "anjali",
  "kapotham",
  "karkatta",
  "swastikam",
  "pushpaputa",
  "shivalinga",
  "katakavardhana",
  "kartariswastika",
  "sakata",
  "shanka",
  "chakra",
  "pasha",
  "kilaka",
  "matsya",
  "kurma",
  "varaha",
  "garuda",
  "nagabandha",
  "khatva",
  "berunda",
];

function byOrder(order) {
  return (a, b) => {
    const ai = order.indexOf(a.slug);
    const bi = order.indexOf(b.slug);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  };
}

export const SINGLE_HAND = MUDRAS.filter((m) => m.category === "single").sort(
  byOrder(SINGLE_HAND_ORDER)
);
export const DOUBLE_HAND = MUDRAS.filter((m) => m.category === "double").sort(
  byOrder(DOUBLE_HAND_ORDER)
);

export function getMudra(slug) {
  return MUDRAS.find((m) => m.slug === slug);
}

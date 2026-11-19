export const DEFAULT_BACKGROUND_THEME = "supermarket, food";

export const CURATED_BACKGROUNDS = [
  {
    imageUrl:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    imageUrl:
      "https://images.unsplash.com/photo-1506617420156-8e4536971650?auto=format&fit=crop&w=1200&q=80",
  },
  {
    imageUrl:
      "https://images.unsplash.com/photo-1543168256-418811576931?auto=format&fit=crop&w=1200&q=80",
  },
  {
    imageUrl:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80",
  },
];

export function chooseRandomBackground(random = Math.random) {
  const index = Math.min(
    CURATED_BACKGROUNDS.length - 1,
    Math.floor(random() * CURATED_BACKGROUNDS.length),
  );
  return CURATED_BACKGROUNDS[index];
}

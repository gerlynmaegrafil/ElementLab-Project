// Colors for periodic-table element categories.
// Kept separate from theme-colors.ts because these are chemistry
// categories, not general app UI colors.

export const categoryColors: Record<string, string> = {
  "alkali-metal": "#E4572E",
  "alkaline-earth-metal": "#F3A712",
  "transition-metal": "#7FA33B",
  "post-transition-metal": "#2E9E6D",
  metalloid: "#1FA5B8",
  "diatomic-nonmetal": "#3178C6",
  "polyatomic-nonmetal": "#5C6BC0",
  "noble-gas": "#9457B5",
  lanthanide: "#C2185B",
  actinide: "#8D6E63",
  unknown: "#5A6E80",
};

export const categoryLabels: Record<string, string> = {
  "alkali-metal": "Alkali metal",
  "alkaline-earth-metal": "Alkaline earth metal",
  "transition-metal": "Transition metal",
  "post-transition-metal": "Post-transition metal",
  metalloid: "Metalloid",
  "diatomic-nonmetal": "Diatomic nonmetal",
  "polyatomic-nonmetal": "Polyatomic nonmetal",
  "noble-gas": "Noble gas",
  lanthanide: "Lanthanide",
  actinide: "Actinide",
  unknown: "Unknown",
};

export function categoryColor(category: string): string {
  return categoryColors[category] ?? categoryColors.unknown;
}

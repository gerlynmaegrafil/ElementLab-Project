import raw from "./elements.json";

export type ElementData = {
  number: number;
  symbol: string;
  name: string;
  mass: number | null;
  category: string;
  period: number;
  group: number | null;
  xpos: number;
  ypos: number;
  phase: string | null;
  block: string | null;
  density: number | null;
  meltK: number | null;
  boilK: number | null;
  electronegativity: number | null;
  electronConfig: string | null;
  shells: number[];
  protons: number;
  neutrons: number | null;
  electrons: number;
  ionizationEnergy: number | null;
  discoveredBy: string | null;
};

export const ELEMENTS: ElementData[] = raw as ElementData[];

const bySymbol = new Map(ELEMENTS.map((e) => [e.symbol.toUpperCase(), e]));
const byNumber = new Map(ELEMENTS.map((e) => [e.number, e]));

export function getElementBySymbol(symbol: string): ElementData | undefined {
  return bySymbol.get(symbol.toUpperCase());
}

export function getElementByNumber(number: number): ElementData | undefined {
  return byNumber.get(number);
}

export function kelvinToCelsius(k: number | null): number | null {
  if (k === null || k === undefined) return null;
  return Math.round((k - 273.15) * 10) / 10;
}

export function propertyRange(
  prop: "electronegativity" | "ionizationEnergy" | "mass" | "density",
) {
  const values = ELEMENTS.map((e) => e[prop]).filter(
    (v): v is number => typeof v === "number",
  );
  return { min: Math.min(...values), max: Math.max(...values) };
}

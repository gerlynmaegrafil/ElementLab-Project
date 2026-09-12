// Thin wrapper around the free PSGC Cloud API (https://psgc.cloud)
// No API key needed. Data is cached in-memory per app session.

const BASE = "https://psgc.cloud/api";

export type PSGCOption = { code: string; name: string };

export type CityMuni = {
  code: string;
  name: string;
  type: "City" | "Municipality";
  zip_code: string;
  district?: string;
};

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`PSGC request failed (${res.status}) for ${url}`);
  }
  return res.json();
}

let regionsCache: PSGCOption[] | null = null;
let provincesCache: PSGCOption[] | null = null;
let citiesMunisCache: CityMuni[] | null = null;
const barangayCache = new Map<string, PSGCOption[]>();

export async function fetchRegions(): Promise<PSGCOption[]> {
  if (regionsCache) return regionsCache;
  const data = await getJSON<PSGCOption[]>(`${BASE}/regions`);
  regionsCache = [...data].sort((a, b) => a.name.localeCompare(b.name));
  return regionsCache;
}

export async function fetchProvinces(): Promise<PSGCOption[]> {
  if (provincesCache) return provincesCache;
  provincesCache = await getJSON<PSGCOption[]>(`${BASE}/provinces`);
  return provincesCache;
}

export async function fetchCitiesMunicipalities(): Promise<CityMuni[]> {
  if (citiesMunisCache) return citiesMunisCache;
  const [cities, munis] = await Promise.all([
    getJSON<any[]>(`${BASE}/cities`),
    getJSON<any[]>(`${BASE}/municipalities`),
  ]);
  citiesMunisCache = [
    ...cities.map((c) => ({
      ...c,
      name: c.name.trim(),
      type: "City" as const,
    })),
    ...munis.map((m) => ({
      ...m,
      name: m.name.trim(),
      type: "Municipality" as const,
    })),
  ];
  return citiesMunisCache;
}

export async function fetchBarangays(
  cityMuniCode: string,
): Promise<PSGCOption[]> {
  const cached = barangayCache.get(cityMuniCode);
  if (cached) return cached;
  const data = await getJSON<{ code: string; name: string }[]>(
    `${BASE}/cities-municipalities/${cityMuniCode}/barangays`,
  );
  const options = data
    .map((b) => ({ code: b.code, name: b.name.trim() }))
    .sort((a, b) => a.name.localeCompare(b.name));
  barangayCache.set(cityMuniCode, options);
  return options;
}

// --- Cascading helpers (all client-side, based on PSGC code prefixes) ---

export function provincesForRegion(
  allProvinces: PSGCOption[],
  regionCode: string,
): PSGCOption[] {
  const prefix = regionCode.slice(0, 2);
  return allProvinces
    .filter((p) => p.code.startsWith(prefix))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function citiesForProvince(
  all: CityMuni[],
  provinceCode: string,
): CityMuni[] {
  const prefix = provinceCode.slice(0, 6);
  return all
    .filter((c) => c.code.startsWith(prefix))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Cities/municipalities that belong to a region but NOT to any of that
// region's provinces (NCR cities, and independent/highly-urbanized cities
// like Angeles, Olongapo, Cebu City, Davao City, Baguio, etc.)
export function independentCitiesForRegion(
  all: CityMuni[],
  allProvinces: PSGCOption[],
  regionCode: string,
): CityMuni[] {
  const regionPrefix = regionCode.slice(0, 2);
  const provincePrefixes = allProvinces
    .filter((p) => p.code.startsWith(regionPrefix))
    .map((p) => p.code.slice(0, 6));

  return all
    .filter((c) => c.code.startsWith(regionPrefix))
    .filter((c) => !provincePrefixes.some((pref) => c.code.startsWith(pref)))
    .sort((a, b) => a.name.localeCompare(b.name));
}

import { COMMON_WORDS, EXPLICIT_EXCLUSIONS, GEOGRAPHIC_NAMES, MAJOR_TECH_BRANDS, NEGATIVE_FRAGMENTS, PERSONAL_NAMES } from "../data/reference-data.mjs";

export function levenshtein(a, b) {
  const row = [...Array(b.length + 1).keys()];
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const saved = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = saved;
    }
  }
  return row[b.length];
}

export const normalizedSimilarity = (a, b) => 1 - levenshtein(a, b) / Math.max(a.length, b.length, 1);
export const phoneticKey = (name) => name.toLowerCase().replace(/ph/g, "f").replace(/[cq]/g, "k").replace(/x/g, "ks").replace(/[aeiouy]/g, "").replace(/(.)\1+/g, "$1");
export const phoneticSimilarity = (a, b) => normalizedSimilarity(phoneticKey(a), phoneticKey(b));
export const combinedSimilarity = (a, b) => 0.65 * normalizedSimilarity(a, b) + 0.35 * phoneticSimilarity(a, b);

const exactSets = {
  "explicit-exclusion": new Set(EXPLICIT_EXCLUSIONS),
  "dictionary-common": new Set(COMMON_WORDS),
  "personal-name": new Set(PERSONAL_NAMES),
  geographic: new Set(GEOGRAPHIC_NAMES)
};

const ambiguousPatterns = [/[aeiouy]{2}/, /[cg][eiy]/, /[sx]c/, /qu[^aeiou]/];
const confusingPatterns = [/[ijl]{2}/, /[o]{2}/, /rn/, /vv/, /cl/, /[qwx]{2}/];

export const FILTER_ORDER = [
  ["explicit-exclusion", (n) => exactSets["explicit-exclusion"].has(n)],
  ["dictionary-common", (n) => exactSets["dictionary-common"].has(n)],
  ["personal-name", (n) => exactSets["personal-name"].has(n)],
  ["geographic", (n) => exactSets.geographic.has(n)],
  ["offensive-negative", (n) => NEGATIVE_FRAGMENTS.some((term) => n.includes(term))],
  ["difficult-cluster", (n) => /[^aeiouy]{4}|[^aeiouy]{3}[^aeiouy]/.test(n)],
  ["ambiguous-pronunciation", (n) => ambiguousPatterns.some((pattern) => pattern.test(n))],
  ["visually-confusing", (n) => confusingPatterns.some((pattern) => pattern.test(n))],
  ["rejected-shortlist-similarity", (n) => EXPLICIT_EXCLUSIONS.some((x) => combinedSimilarity(n, x) >= 0.72)],
  ["major-tech-similarity", (n) => MAJOR_TECH_BRANDS.some((x) => combinedSimilarity(n, x) >= 0.78)]
];

export function applyFilters(candidates) {
  let survivors = candidates;
  const counts = [{ filter: "generated", before: candidates.length, removed: 0, surviving: candidates.length }];
  const rejected = [];
  for (const [filter, predicate] of FILTER_ORDER) {
    const kept = [];
    for (const candidate of survivors) {
      if (predicate(candidate.name)) rejected.push({ ...candidate, reason: filter });
      else kept.push(candidate);
    }
    counts.push({ filter, before: survivors.length, removed: survivors.length - kept.length, surviving: kept.length });
    survivors = kept;
  }
  return { survivors, rejected, counts };
}

export function closestBrand(name) {
  return MAJOR_TECH_BRANDS.map((brand) => ({ brand, similarity: combinedSimilarity(name, brand) }))
    .sort((a, b) => b.similarity - a.similarity || a.brand.localeCompare(b.brand))[0];
}

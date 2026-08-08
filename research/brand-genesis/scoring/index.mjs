import { closestBrand } from "../filters/index.mjs";
import { PRODUCT_SUFFIXES } from "../data/reference-data.mjs";

export const syllables = (name) => Math.max(1, (name.match(/[aeiouy]+/g) || []).length);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const round = (value) => Math.round(value * 100) / 100;

export function stressTest(name) {
  const families = PRODUCT_SUFFIXES.map((suffix) => `${name.toUpperCase()}${suffix}`);
  const awkward = [];
  if (/[sx]$/.test(name)) awkward.push("sibilant ending weakens OS/Studio pairing");
  if (name.length > 8) awkward.push("long product-family lockup");
  if (syllables(name) > 3) awkward.push("too many syllables for repeated architecture");
  return { families, awkward, passed: awkward.length === 0, score: clamp(10 - awkward.length * 2.5, 0, 10) };
}

export function scoreCandidate(candidate) {
  const { name, strategy } = candidate;
  const length = name.length;
  const syl = syllables(name);
  const vowelRatio = (name.match(/[aeiouy]/g) || []).length / length;
  const closest = closestBrand(name);
  const stress = stressTest(name);
  const components = {
    pronounceability: clamp(20 - Math.abs(vowelRatio - 0.45) * 22 - Math.abs(syl - 2.4) * 1.6 - ((name.match(/[jfh]/g) || []).length * 0.45), 0, 20),
    memorability: clamp(15 - Math.abs(length - 6) * 2 - (new Set(name).size < length - 2 ? 1.5 : 0), 0, 15),
    visualStrength: clamp(10 - (/[ij]{2}|rn|vv/.test(name) ? 3 : 0) - Math.abs(length - 6.5) * 0.7, 0, 10),
    globalNeutrality: clamp(10 - (/[qwx]/.test(name) ? 1.8 : 0) - (syl < 2 || syl > 3 ? 2 : 0), 0, 10),
    technologyFit: clamp(7.8 + (/[vxzk]/.test(name) ? 0.6 : 0) + (/^[knrvz]/.test(name) ? 0.3 : 0), 0, 10),
    premiumPerception: clamp(7.2 + (/[vrlmn]/.test(name) ? 1.2 : 0) + (length >= 5 && length <= 7 ? 0.8 : 0) + (strategy === "invented-morphemes" ? 0.8 : strategy === "pronounceability-weighted" ? 0.35 : 0), 0, 10),
    expansionPotential: stress.score,
    distinctiveness: clamp((1 - closest.similarity) * 18.5, 0, 15)
  };
  for (const key of Object.keys(components)) components[key] = round(components[key]);
  const score = round(Object.values(components).reduce((sum, value) => sum + value, 0));
  return { ...candidate, displayName: name.toUpperCase(), syllables: syl, components, score, stress, closestBrand: closest.brand, similarity: round(closest.similarity * 100) };
}

export const rankCandidates = (candidates) => candidates.map(scoreCandidate)
  .filter((candidate) => candidate.stress.passed)
  .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
  .map((candidate, index) => ({ ...candidate, rank: index + 1 }));

import assert from "node:assert/strict";
import test from "node:test";
import { EXPLICIT_EXCLUSIONS, SEED } from "../data/reference-data.mjs";
import { generateCandidates } from "../generator/index.mjs";
import { applyFilters } from "../filters/index.mjs";
import { rankCandidates, scoreCandidate, syllables } from "../scoring/index.mjs";

test("generation is deterministic and produces 120,000 unique names", () => {
  const first = generateCandidates({ count: 120000, seed: SEED });
  const second = generateCandidates({ count: 120000, seed: SEED });
  assert.equal(first.length, 120000);
  assert.equal(new Set(first.map((x) => x.name)).size, first.length);
  assert.deepEqual(first, second);
});

test("filters enforce explicit exclusions and keep counts monotonic", () => {
  const candidates = [...EXPLICIT_EXCLUSIONS, "velora"].map((name, id) => ({ id, name, strategy: "test" }));
  const result = applyFilters(candidates);
  assert.equal(result.survivors.some((x) => EXPLICIT_EXCLUSIONS.includes(x.name)), false);
  for (let i = 1; i < result.counts.length; i += 1) assert.ok(result.counts[i].surviving <= result.counts[i - 1].surviving);
});

test("pronunciation rules return one to three syllables for finalists", () => {
  const ranked = rankCandidates(applyFilters(generateCandidates({ count: 5000, seed: SEED })).survivors).slice(0, 100);
  assert.ok(ranked.length > 0);
  for (const candidate of ranked) assert.ok(syllables(candidate.name) >= 1 && syllables(candidate.name) <= 3);
});

test("component and total scores remain in declared ranges", () => {
  const scored = scoreCandidate({ id: 1, name: "velora", strategy: "test" });
  const maxima = { pronounceability: 20, memorability: 15, visualStrength: 10, globalNeutrality: 10, technologyFit: 10, premiumPerception: 10, expansionPotential: 10, distinctiveness: 15 };
  for (const [key, maximum] of Object.entries(maxima)) assert.ok(scored.components[key] >= 0 && scored.components[key] <= maximum, key);
  assert.ok(scored.score >= 0 && scored.score <= 100);
});

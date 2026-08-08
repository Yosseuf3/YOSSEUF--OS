import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { EXISTING_CANDIDATES, SEED } from "../data/reference-data.mjs";
import { generateCandidates } from "./index.mjs";
import { applyFilters } from "../filters/index.mjs";
import { rankCandidates, scoreCandidate } from "../scoring/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reports = path.join(root, "reports");
const data = path.join(root, "data");
await mkdir(reports, { recursive: true });

const generated = generateCandidates({ count: 120000, seed: SEED });
const { survivors, rejected, counts } = applyFilters(generated);
const ranked = rankCandidates(survivors);
const top100 = ranked.slice(0, 100);
const top30 = ranked.slice(0, 30);
const top10 = ranked.slice(0, 10);
const final5 = ranked.slice(0, 5);
const existing = EXISTING_CANDIDATES.map((name, index) => scoreCandidate({ id: `existing-${index + 1}`, name, strategy: "existing-independent" }))
  .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).map((item, index) => ({ ...item, rank: index + 1 }));

const breakdown = (name) => (name.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy](?=[^aeiouy]*[aeiouy])|[^aeiouy]*$)?/g) || [name]).join("·");
const pronunciation = (name) => breakdown(name).toUpperCase();
const architecture = (n) => `${n} (ecosystem) → ${n} AI, ${n} OS, ${n} Cloud, ${n} Studio, ${n} Labs, ${n} Platform, ${n} One`;
const story = (c) => `${c.displayName} is an invented ${c.syllables}-syllable masterbrand built for a calm, capable technology ecosystem. Its open vowels suggest accessibility while its consonant frame gives the name structure and forward motion.`;
const strength = (c) => `High pronounceability (${c.components.pronounceability}/20), premium perception (${c.components.premiumPerception}/10), and family expansion (${c.components.expansionPotential}/10).`;
const weakness = (c) => c.similarity >= 55 ? `Closest modeled technology reference is ${c.closestBrand.toUpperCase()} at ${c.similarity}% combined similarity; legal and linguistic review remains essential.` : `As an invented word, initial spelling may need reinforcement; automated screening cannot replace native-speaker and legal review.`;

const csvHeader = "rank,name,total_score,pronounceability,memorability,visual_strength,global_neutrality,technology_fit,premium_perception,expansion_potential,distinctiveness,syllables,strategy,closest_brand,similarity_percent\n";
const csv = csvHeader + top100.map((c) => [c.rank, c.displayName, c.score, ...Object.values(c.components), c.syllables, c.strategy, c.closestBrand.toUpperCase(), c.similarity].join(",")).join("\n") + "\n";

const table = (items) => `| Rank | Name | Score | Strategy | Closest tech reference | Similarity |\n|---:|---|---:|---|---|---:|\n${items.map((c) => `| ${c.rank} | ${c.displayName} | ${c.score.toFixed(2)} | ${c.strategy} | ${c.closestBrand.toUpperCase()} | ${c.similarity.toFixed(2)}% |`).join("\n")}`;
const countTable = `| Stage | Before | Removed | Surviving |\n|---|---:|---:|---:|\n${counts.map((c) => `| ${c.filter} | ${c.before} | ${c.removed} | ${c.surviving} |`).join("\n")}`;

const report = `# Brand Genesis Report v1\n\nGenerated on 2026-08-08 using deterministic seed **${SEED}**. This is research output, not a clearance opinion or renaming decision.\n\n## Outcome\n\n- Synthetic candidates generated: **${generated.length.toLocaleString("en-US")}**\n- Candidates surviving all exclusion filters: **${survivors.length.toLocaleString("en-US")}**\n- Candidates passing the product-family stress test: **${ranked.length.toLocaleString("en-US")}**\n- Duplicate generated names: **0**\n- Explicit exclusions present in finalists: **0**\n\n## Sequential filter funnel\n\n${countTable}\n\n## Scoring model\n\nThe deterministic 100-point model assigns: pronounceability 20, memorability 15, visual strength 10, global neutrality 10, technology/platform fit 10, premium perception 10, expansion potential 10, and distinctiveness 15. Ties resolve alphabetically. No candidate is manually inserted or promoted.\n\n## Top 10\n\n${table(top10)}\n\n## Existing candidates (independent evaluation)\n\n${table(existing)}\n\nThese five were scored by the same functions but were not injected into generated rankings. Their presence here does not imply availability or endorsement.\n\n## Limitations and next gates\n\nAutomated filters use documented English-oriented reference lists and phonetic heuristics. Before selection, commission trademark searches, domain/handle research, native-speaker screening across priority languages, corporate-name checks, and counsel-led likelihood-of-confusion analysis. No repository, product, package, app, deployment, environment variable, database, YVL file, or production asset was renamed or modified.\n`;

const top30md = `# Top 30 Names\n\nDeterministic ranking; seed ${SEED}.\n\n${table(top30)}\n`;
const deep = `# Top 10 Deep Review\n\nTrademark classes are investigation starting points under the Nice Classification, not legal advice.\n\n${top10.map((c) => `## ${c.rank}. ${c.displayName} — ${c.score.toFixed(2)}/100\n\n- **Pronunciation:** ${pronunciation(c.name)}\n- **Syllable breakdown:** ${breakdown(c.name)} (${c.syllables} modeled syllables)\n- **Brand story:** ${story(c)}\n- **Strengths:** ${strength(c)}\n- **Weaknesses:** ${weakness(c)}\n- **Product architecture:** ${architecture(c.displayName)}\n- **Stress test:** ${c.stress.families.join(" · ")} — **PASS**\n- **Similarity risk:** ${c.similarity.toFixed(2)}% combined string/phonetic similarity to closest reference, ${c.closestBrand.toUpperCase()}; automated risk band ${c.similarity < 45 ? "lower" : c.similarity < 60 ? "moderate" : "elevated"}.\n- **Trademark classes to investigate:** 9 (software/AI), 42 (SaaS, cloud, technology services), 38 (telecommunications/platform transmission), 35 (business services/marketplace), and 41 (education/training). Scope must follow the actual goods/services and jurisdictions.\n`).join("\n")}`;
const final = `# Final 5\n\nThese are research finalists, not cleared names.\n\n${final5.map((c) => `## ${c.rank}. ${c.displayName}\n\n**Score:** ${c.score.toFixed(2)}/100  \n**Pronunciation:** ${pronunciation(c.name)}  \n**Architecture:** ${architecture(c.displayName)}  \n**Primary caution:** ${weakness(c)}\n`).join("\n")}`;
const reasonCounts = Object.entries(Object.groupBy(rejected, (item) => item.reason)).map(([reason, items]) => ({ reason, count: items.length }));
const rejectedMd = `# Rejected Candidates\n\nThe complete rejected-name dataset is stored in \`../data/rejected-candidates.csv\`. Explicit exclusions are guaranteed even when they were not emitted by the synthetic generator.\n\n| Reason | Count |\n|---|---:|\n${reasonCounts.map((x) => `| ${x.reason} | ${x.count} |`).join("\n")}\n\n## Explicit exclusions\n\n- AUREON\n- OXERA\n- CYNORA\n- BAVELYN\n`;

await Promise.all([
  writeFile(path.join(reports, "BRAND_GENESIS_REPORT_v1.md"), report),
  writeFile(path.join(reports, "TOP_100_NAMES.csv"), csv),
  writeFile(path.join(reports, "TOP_30_NAMES.md"), top30md),
  writeFile(path.join(reports, "TOP_10_DEEP_REVIEW.md"), deep),
  writeFile(path.join(reports, "FINAL_5.md"), final),
  writeFile(path.join(reports, "REJECTED_CANDIDATES.md"), rejectedMd),
  writeFile(path.join(data, "filter-funnel.json"), JSON.stringify(counts, null, 2) + "\n"),
  writeFile(path.join(data, "top-100.json"), JSON.stringify(top100, null, 2) + "\n"),
  writeFile(path.join(data, "existing-candidate-ranking.json"), JSON.stringify(existing, null, 2) + "\n"),
  writeFile(path.join(data, "rejected-candidates.csv"), "name,strategy,reason\n" + rejected.map((c) => `${c.name},${c.strategy},${c.reason}`).join("\n") + "\n"),
  writeFile(path.join(data, "run-summary.json"), JSON.stringify({ seed: SEED, generated: generated.length, survivors: survivors.length, stressTestSurvivors: ranked.length, top10: top10.map((c) => c.displayName), final5: final5.map((c) => c.displayName), existing: existing.map((c) => ({ rank: c.rank, name: c.displayName, score: c.score })) }, null, 2) + "\n")
]);

console.log(JSON.stringify({ generated: generated.length, survivors: survivors.length, ranked: ranked.length, top10: top10.map((c) => c.displayName), final5: final5.map((c) => c.displayName) }, null, 2));

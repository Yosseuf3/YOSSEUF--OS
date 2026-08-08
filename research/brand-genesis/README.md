# Brand Genesis Engine v1

Deterministic research tooling for generating, excluding, scoring, stress-testing, and ranking synthetic masterbrand candidates for a broad AI/software/platform ecosystem.

## Safety boundary

This directory is research only. It does not rename or modify any repository, product, package, app, deployment, environment variable, database, production asset, runtime path, or YVL artifact. Outputs are not trademark clearance, linguistic clearance, domain research, or a recommendation to launch.

## Reproduce

Requirements: Node.js 20 or later. No third-party packages are required.

```powershell
node research/brand-genesis/generator/run.mjs
node --test research/brand-genesis/tests/*.test.mjs
```

The fixed seed is `20260808`. A run creates 120,000 unique candidates across seven strategies: phonetic construction, syllable recombination, consonant/vowel modeling, pronounceability-weighted generation, invented morphemes, multilingual-neutral phoneme combinations, and short premium construction. Generation prefers 5–8 letters and 2–3 syllables through scoring, then uses sequential exclusion filters and a declared 100-point rubric. The premium component gives a small, declared structural prior to invented-morpheme (+0.8) and pronounceability-weighted (+0.35) strategies. Ranking has no manual insertion; ties resolve alphabetically.

## Structure

- `generator/`: seeded PRNG, generation strategies, and report build entry point.
- `filters/`: sequential exclusions, Levenshtein similarity, and simplified phonetic similarity.
- `scoring/`: component scoring and the eight-form product-family stress test.
- `data/`: versioned reference lists and generated audit datasets.
- `reports/`: required human-readable and CSV deliverables.
- `tests/`: determinism, duplicate, filter, pronunciation, and score-range checks.

## Method notes

String similarity is normalized Levenshtein similarity. Phonetic similarity uses a documented neutralized consonant key (`ph→f`, `c/q→k`, `x→ks`, vowel removal, repeated-letter collapse). Combined similarity weights string similarity at 65% and phonetic similarity at 35%. The repository contained no earlier major-technology-brand research list on the base branch, so `data/reference-data.mjs` supplies an auditable reference set beginning with all brands mandated by the mission and extending to other major global technology brands.

Every finalist is tested as `NAME`, `NAME AI`, `NAME OS`, `NAME Cloud`, `NAME Studio`, `NAME Labs`, `NAME Platform`, and `NAME One`. Any modeled awkwardness condition rejects the name from the ranked pool.

## Known limitations

Heuristics cannot determine trademark availability, consumer confusion, domain/handle availability, cultural meaning, or pronunciation in every language. The final five require counsel-led searches and native-speaker review in priority markets before any naming decision.

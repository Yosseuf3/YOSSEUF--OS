import { SEED } from "../data/reference-data.mjs";

const ONSETS = ["b", "br", "c", "d", "dr", "f", "g", "h", "j", "k", "kr", "l", "m", "n", "p", "pr", "r", "s", "t", "tr", "v", "z"];
const VOWELS = ["a", "e", "i", "o", "u", "ae", "ai", "eo", "ia", "io", "oa"];
const CODAS = ["", "l", "m", "n", "r", "s", "v", "x"];
const SYLLABLES = ["ba", "be", "bi", "bo", "bu", "ca", "ce", "da", "de", "di", "do", "fa", "fi", "ga", "ha", "ja", "ka", "ke", "ki", "ko", "la", "le", "li", "lo", "ma", "me", "mi", "mo", "na", "ne", "ni", "no", "pa", "pe", "ra", "re", "ri", "ro", "sa", "se", "si", "so", "ta", "te", "ti", "to", "va", "ve", "vi", "vo", "za", "ze", "zi", "zo"];
const MORPHEMES = ["avi", "elo", "ena", "evo", "ira", "ivo", "luma", "mira", "nexa", "ora", "ori", "ova", "riva", "sena", "tiva", "uma", "vera", "vora", "yra", "zeno"];

export function mulberry32(seed = SEED) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (items, random) => items[Math.floor(random() * items.length)];

const strategies = [
  ["phonetic-construction", (r) => pick(ONSETS, r) + pick(VOWELS, r) + pick(CODAS, r) + pick(ONSETS, r) + pick(VOWELS, r)],
  ["syllable-recombination", (r) => pick(SYLLABLES, r) + pick(SYLLABLES, r) + (r() < 0.42 ? pick(SYLLABLES, r) : "")],
  ["consonant-vowel-model", (r) => pick(ONSETS, r) + pick(VOWELS, r) + pick(ONSETS, r) + pick(VOWELS, r) + (r() < 0.34 ? pick(CODAS, r) : "")],
  ["pronounceability-weighted", (r) => pick(SYLLABLES, r) + pick(["l", "m", "n", "r", "v", "z"], r) + pick(["a", "e", "i", "o"], r) + (r() < 0.28 ? pick(["n", "r", "s"], r) : "")],
  ["invented-morphemes", (r) => pick(["ba", "de", "ke", "mi", "no", "ra", "se", "ve", "za"], r) + pick(MORPHEMES, r)],
  ["multilingual-neutral", (r) => pick(["ba", "da", "ka", "la", "ma", "na", "ra", "sa", "ta", "va", "za"], r) + pick(["li", "mi", "ni", "ri", "si", "vi"], r) + pick(["a", "o", "u"], r)],
  ["short-premium", (r) => pick(["a", "e", "i", "o", "u", "y"], r) + pick(["b", "d", "k", "l", "m", "n", "r", "s", "v", "z"], r) + pick(["a", "e", "i", "o"], r) + pick(["l", "n", "r", "s", "v", "x"], r) + (r() < 0.55 ? pick(["a", "e", "i", "o"], r) : "")]
];

export function generateCandidates({ count = 120000, seed = SEED } = {}) {
  const random = mulberry32(seed);
  const candidates = new Map();
  let attempts = 0;
  const maxAttempts = count * 80;
  while (candidates.size < count && attempts < maxAttempts) {
    const [strategy, build] = strategies[attempts % strategies.length];
    const name = build(random).toLowerCase().replace(/[^a-z]/g, "");
    attempts += 1;
    if (name.length >= 4 && name.length <= 9 && !candidates.has(name)) candidates.set(name, strategy);
  }
  if (candidates.size < count) throw new Error(`Generator exhausted at ${candidates.size}/${count}`);
  return [...candidates].map(([name, strategy], index) => ({ id: index + 1, name, strategy }));
}

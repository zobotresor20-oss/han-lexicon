// han-Lexicon — fuzzy bidirectional search engine.
// Supports Korean -> English and English -> Korean, partial matches,
// typo tolerance via Levenshtein distance, and word-order flexibility.

import type { WordEntry, SearchResult, ElementType } from "./types";
import { normalizeText } from "./utils-han";

// ---------------------------------------------------------------------------
// Levenshtein distance (iterative, bounded)
// ---------------------------------------------------------------------------
export function levenshtein(a: string, b: string, maxCost?: number): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  // Trim memory by using two rows
  let prevRow = new Array<number>(bl + 1);
  for (let j = 0; j <= bl; j++) prevRow[j] = j;
  let currRow = new Array<number>(bl + 1);

  const bound = maxCost ?? Math.max(al, bl);

  for (let i = 1; i <= al; i++) {
    currRow[0] = i;
    let rowMin = currRow[0];
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        currRow[j - 1] + 1,        // insertion
        prevRow[j] + 1,            // deletion
        prevRow[j - 1] + cost      // substitution
      );
      if (currRow[j] < rowMin) rowMin = currRow[j];
    }
    if (rowMin > bound) return bound + 1;
    [prevRow, currRow] = [currRow, prevRow];
  }
  return prevRow[bl];
}

// Tokenize a normalized string into individual search tokens.
export function tokenize(s: string): string[] {
  return normalizeText(s).split(" ").filter(Boolean);
}

// Score how well the query tokens match a target string.
// Lower score = better match. Returns Number.POSITIVE_INFINITY if no overlap.
//
// Strategy:
//   - Exact substring match -> score 0
//   - Token-level: every query token must match a target token (or be a
//     substring of one) within a Levenshtein tolerance proportional to length.
export function scoreMatch(query: string, target: string): number {
  const q = normalizeText(query);
  const t = normalizeText(target);
  if (!q || !t) return Number.POSITIVE_INFINITY;

  // Direct substring win
  if (t.includes(q)) return 0;
  if (q.includes(t) && t.length >= 2) return 0.5;

  const qTokens = tokenize(q);
  const tTokens = tokenize(t);

  if (qTokens.length === 0 || tTokens.length === 0) return Number.POSITIVE_INFINITY;

  let totalScore = 0;
  for (const qt of qTokens) {
    let bestForToken = Number.POSITIVE_INFINITY;
    for (const tt of tTokens) {
      // exact token
      if (qt === tt) {
        bestForToken = 0;
        break;
      }
      // substring of token (partial)
      if (tt.includes(qt)) {
        bestForToken = Math.min(bestForToken, 0.3);
        continue;
      }
      if (qt.includes(tt) && tt.length >= 2) {
        bestForToken = Math.min(bestForToken, 0.5);
        continue;
      }
      // fuzzy with length-scaled tolerance
      const tolerance = Math.max(1, Math.floor(qt.length / 3));
      const d = levenshtein(qt, tt, tolerance + 1);
      if (d <= tolerance) {
        const normalized = d / Math.max(qt.length, tt.length);
        bestForToken = Math.min(bestForToken, 0.7 + normalized);
      }
    }
    if (!Number.isFinite(bestForToken)) {
      // Whole query token absent -> not a match
      return Number.POSITIVE_INFINITY;
    }
    totalScore += bestForToken;
  }
  return totalScore;
}

// ---------------------------------------------------------------------------
// Build the candidate index from a WordEntry.
// Each candidate is a discrete searchable item with korean + english text
// and a type, so the search engine can return a precise result.
// ---------------------------------------------------------------------------
interface Candidate {
  wordId: string;
  wordKorean: string;
  wordEnglish: string;
  matchType: ElementType;
  koreanText: string;
  englishText: string;
  ipa?: string;
  path: string[];
}

export function buildCandidates(entry: WordEntry): Candidate[] {
  const out: Candidate[] = [];
  out.push({
    wordId: entry.id,
    wordKorean: entry.korean,
    wordEnglish: entry.english,
    matchType: "word",
    koreanText: entry.korean,
    englishText: entry.english,
    ipa: entry.ipa,
    path: ["Word"],
  });
  for (const c of entry.chunks) {
    out.push({
      wordId: entry.id,
      wordKorean: entry.korean,
      wordEnglish: entry.english,
      matchType: "chunk",
      koreanText: c.korean,
      englishText: c.english,
      ipa: c.ipa,
      path: ["Word", entry.korean, "Chunk", c.korean],
    });
    for (const ex of c.examples) {
      out.push({
        wordId: entry.id,
        wordKorean: entry.korean,
        wordEnglish: entry.english,
        matchType: "example",
        koreanText: ex.korean,
        englishText: ex.english,
        ipa: ex.ipa,
        path: ["Word", entry.korean, "Chunk", c.korean, "Example"],
      });
    }
  }
  for (const c of entry.collocations) {
    out.push({
      wordId: entry.id,
      wordKorean: entry.korean,
      wordEnglish: entry.english,
      matchType: "collocation",
      koreanText: c.korean,
      englishText: c.english,
      ipa: c.ipa,
      path: ["Word", entry.korean, "Collocation", c.korean],
    });
    for (const ex of c.examples) {
      out.push({
        wordId: entry.id,
        wordKorean: entry.korean,
        wordEnglish: entry.english,
        matchType: "example",
        koreanText: ex.korean,
        englishText: ex.english,
        ipa: ex.ipa,
        path: ["Word", entry.korean, "Collocation", c.korean, "Example"],
      });
    }
  }
  for (const i of entry.idioms) {
    out.push({
      wordId: entry.id,
      wordKorean: entry.korean,
      wordEnglish: entry.english,
      matchType: "idiom",
      koreanText: i.korean,
      englishText: i.english,
      ipa: i.ipa,
      path: ["Word", entry.korean, "Idiom", i.korean],
    });
    for (const ex of i.examples) {
      out.push({
        wordId: entry.id,
        wordKorean: entry.korean,
        wordEnglish: entry.english,
        matchType: "example",
        koreanText: ex.korean,
        englishText: ex.english,
        ipa: ex.ipa,
        path: ["Word", entry.korean, "Idiom", i.korean, "Example"],
      });
    }
  }
  for (const ex of entry.examples) {
    out.push({
      wordId: entry.id,
      wordKorean: entry.korean,
      wordEnglish: entry.english,
      matchType: "example",
      koreanText: ex.korean,
      englishText: ex.english,
      ipa: ex.ipa,
      path: ["Word", entry.korean, "Example"],
    });
  }
  // Also expose usage context & notes as searchable text via synthetic
  // "word" candidates (cheap because they're cheap to construct).
  if (entry.usageContext) {
    out.push({
      wordId: entry.id,
      wordKorean: entry.korean,
      wordEnglish: entry.english,
      matchType: "word",
      koreanText: "",
      englishText: entry.usageContext,
      ipa: undefined,
      path: ["Word", entry.korean, "Usage context"],
    });
  }
  if (entry.notes) {
    out.push({
      wordId: entry.id,
      wordKorean: entry.korean,
      wordEnglish: entry.english,
      matchType: "word",
      koreanText: "",
      englishText: entry.notes,
      ipa: undefined,
      path: ["Word", entry.korean, "Notes"],
    });
  }
  if (entry.ipa) {
    out.push({
      wordId: entry.id,
      wordKorean: entry.korean,
      wordEnglish: entry.english,
      matchType: "word",
      koreanText: "",
      englishText: entry.ipa,
      ipa: entry.ipa,
      path: ["Word", entry.korean, "IPA"],
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Run a search. Direction:
//   - ko-en : query is Korean; we search the koreanText of candidates.
//   - en-ko : query is English; we search the englishText of candidates.
// Returns at most `limit` results sorted by score.
// ---------------------------------------------------------------------------
export function searchEntries(
  query: string,
  entries: WordEntry[],
  direction: "ko-en" | "en-ko",
  limit = 50
): SearchResult[] {
  const q = query.trim();
  if (!q) return [];

  const candidates: Candidate[] = [];
  for (const e of entries) candidates.push(...buildCandidates(e));

  const results: SearchResult[] = [];
  for (const c of candidates) {
    const target = direction === "ko-en" ? c.koreanText : c.englishText;
    if (!target) continue;
    const score = scoreMatch(q, target);
    if (!Number.isFinite(score)) continue;
    results.push({
      wordId: c.wordId,
      wordKorean: c.wordKorean,
      wordEnglish: c.wordEnglish,
      matchType: c.matchType,
      matchedKorean: c.koreanText,
      matchedEnglish: c.englishText,
      matchedIpa: c.ipa,
      score,
      path: c.path,
    });
  }

  results.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    // Tie-break: word-level matches first, then alphabetical
    const typeRank = (t: ElementType) =>
      t === "word" ? 0 : t === "chunk" ? 1 : t === "collocation" ? 2 : t === "idiom" ? 3 : 4;
    if (typeRank(a.matchType) !== typeRank(b.matchType)) {
      return typeRank(a.matchType) - typeRank(b.matchType);
    }
    return a.wordKorean.localeCompare(b.wordKorean);
  });
  return results.slice(0, limit);
}

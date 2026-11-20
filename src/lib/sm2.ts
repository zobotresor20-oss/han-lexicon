// han-Lexicon — SM-2 spaced repetition algorithm.
// https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method

import type { SrsState, Quality } from "./types";

export function initialSrsState(): SrsState {
  return {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: Date.now(), // due immediately
    totalReviews: 0,
    correctReviews: 0,
    missedReviews: 0,
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Apply a single review to an SRS state, returning a NEW state object.
 *
 * Quality scale (SM-2):
 *   5 - perfect response
 *   4 - correct after hesitation
 *   3 - correct with serious difficulty
 *   2 - incorrect, but the correct answer seemed easy to recall
 *   1 - incorrect, but the correct answer was remembered upon seeing it
 *   0 - complete blackout
 *
 * In han-Lexicon the UI only exposes a binary "I knew it / I didn't know it",
 * which maps to quality 5 / 2 by default. The difficulty selector nudges this:
 *   easy   -> knew=5,  missed=3
 *   normal -> knew=5,  missed=2
 *   hard   -> knew=4,  missed=1
 */
export function reviewSrs(
  prev: SrsState,
  quality: Quality,
  now: number = Date.now()
): SrsState {
  let { easeFactor, interval, repetitions } = prev;

  // Update ease factor: EF' = EF + (0.1 - (5-q)*(0.08 + (5-q)*0.02))
  const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  easeFactor = Math.max(1.3, easeFactor + delta);

  if (quality < 3) {
    // Failed — reset repetitions, short re-display today (10 min)
    repetitions = 0;
    interval = 0; // due again very soon
  } else {
    // Passed
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  const dueDate = now + interval * DAY_MS;

  return {
    easeFactor,
    interval,
    repetitions,
    dueDate,
    lastReviewDate: now,
    totalReviews: prev.totalReviews + 1,
    correctReviews: prev.correctReviews + (quality >= 3 ? 1 : 0),
    missedReviews: prev.missedReviews + (quality < 3 ? 1 : 0),
    lastQuality: quality,
  };
}

// Map the UI binary choice + difficulty to a SM-2 quality
export function qualityFromUi(
  knew: boolean,
  difficulty: "easy" | "normal" | "hard"
): Quality {
  if (knew) {
    return difficulty === "easy" ? 5 : difficulty === "hard" ? 4 : 5;
  }
  return difficulty === "easy" ? 3 : difficulty === "hard" ? 1 : 2;
}

// Categorize an item into a review bucket for the SRS dashboard
export type SrsBucket = "due" | "upcoming" | "learning" | "mastered" | "missed";

export function srsBucket(state: SrsState, now: number = Date.now()): SrsBucket {
  // Mastered: at least 4 successful repetitions and interval >= 21 days
  if (state.repetitions >= 4 && state.interval >= 21) return "mastered";
  // Missed: last review was a failure
  if (state.lastQuality !== undefined && state.lastQuality < 3) return "missed";
  // Learning: in the first 2 repetitions
  if (state.repetitions < 2) return "learning";
  // Due / upcoming
  if (state.dueDate <= now) return "due";
  return "upcoming";
}

// han-Lexicon — demo data, seeded exactly once on first launch.

import type { WordEntry } from "./types";
import { initialSrsState } from "./sm2";
import { uid } from "./utils-han";

const now = Date.now();

function mkExample(
  parentId: string,
  parentType: "word" | "chunk" | "collocation" | "idiom",
  korean: string,
  english: string,
  ipa?: string,
  note?: string
) {
  return {
    id: uid("ex_"),
    parentId,
    parentType,
    korean,
    english,
    ipa,
    note,
    createdAt: now,
    updatedAt: now,
  };
}

function mkChunk(wordId: string, korean: string, english: string, ipa?: string) {
  const id = uid("c_");
  return {
    id,
    wordId,
    korean,
    english,
    ipa,
    examples: [] as any[],
    createdAt: now,
    updatedAt: now,
  };
}
function mkCollocation(wordId: string, korean: string, english: string, ipa?: string) {
  const id = uid("co_");
  return {
    id,
    wordId,
    korean,
    english,
    ipa,
    examples: [] as any[],
    createdAt: now,
    updatedAt: now,
  };
}
function mkIdiom(wordId: string, korean: string, english: string, ipa?: string) {
  const id = uid("id_");
  return {
    id,
    wordId,
    korean,
    english,
    ipa,
    examples: [] as any[],
    createdAt: now,
    updatedAt: now,
  };
}

function mkWord(partial: Partial<WordEntry> & {
  korean: string;
  english: string;
  partOfSpeech: WordEntry["partOfSpeech"];
}): WordEntry {
  const id = uid("w_");
  return {
    id,
    korean: partial.korean,
    english: partial.english,
    romanization: partial.romanization,
    ipa: partial.ipa,
    partOfSpeech: partial.partOfSpeech,
    usageContext: partial.usageContext,
    notes: partial.notes,
    tags: partial.tags ?? [],
    chunks: partial.chunks ?? [],
    collocations: partial.collocations ?? [],
    idioms: partial.idioms ?? [],
    examples: partial.examples ?? [],
    srs: initialSrsState(),
    status: partial.status ?? "incomplete",
    createdAt: now,
    updatedAt: now,
  };
}

// ---------------------------------------------------------------------------
// 5 complete + 2 incomplete entries
// ---------------------------------------------------------------------------
export function buildDemoWords(): WordEntry[] {
  // 1. 사랑 — love
  const sarang = mkWord({
    korean: "사랑",
    english: "love",
    romanization: "sarang",
    ipa: "sa.ɾaŋ",
    partOfSpeech: "noun",
    usageContext: "Used for deep affection — between lovers, family, or for things one is passionate about.",
    notes: "Often paired with 하다 (to do) to form the verb 사랑하다 (to love).",
    tags: ["emotion", "core"],
  });
  {
    const c1 = mkChunk(sarang.id, "사랑하다", "to love", "sa.ɾaŋ.ha.da");
    c1.examples.push(
      mkExample(c1.id, "chunk", "나는 너를 사랑해.", "I love you."),
      mkExample(c1.id, "chunk", "그는 음악을 사랑한다.", "He loves music.")
    );
    const c2 = mkChunk(sarang.id, "사랑에 빠지다", "to fall in love", "sa.ɾaŋ.e ppa.dʒi.da");
    c2.examples.push(
      mkExample(c2.id, "chunk", "두 사람은 사랑에 빠졌다.", "The two people fell in love.")
    );
    sarang.chunks.push(c1, c2);

    const co1 = mkCollocation(sarang.id, "큰 사랑", "great love", "kʰɯn sa.ɾaŋ");
    const co2 = mkCollocation(sarang.id, "사랑 고백", "love confession", "sa.ɾaŋ ko.bɛk");
    co2.examples.push(
      mkExample(co2.id, "collocation", "그는 사랑 고백을 했다.", "He made a confession of love.")
    );
    sarang.collocations.push(co1, co2);

    const id1 = mkIdiom(sarang.id, "사랑은 눈이 멀게 한다", "Love is blind", "sa.ɾaŋ.ɯn nu.ni mɤl.ge ha.nda");
    id1.examples.push(
      mkExample(id1.id, "idiom", "사랑은 눈이 멀게 한다더니 정말이었다.", "They say love is blind, and it really was.")
    );
    sarang.idioms.push(id1);

    sarang.examples.push(
      mkExample(sarang.id, "word", "사랑은 인생에서 가장 중요하다.", "Love is the most important thing in life."),
      mkExample(sarang.id, "word", "어머니의 사랑을 느낀다.", "I feel my mother's love.")
    );
    sarang.status = "complete";
  }

  // 2. 학교 — school
  const hakgyo = mkWord({
    korean: "학교",
    english: "school",
    romanization: "hakgyo",
    ipa: "hak.kjo",
    partOfSpeech: "noun",
    usageContext: "Refers to any educational institution, from elementary to university.",
    notes: "For university level, 대학교 (daehakgyo) is more precise.",
    tags: ["education", "core"],
  });
  {
    const c1 = mkChunk(hakgyo.id, "학교에 가다", "to go to school", "hak.kjo.e ka.da");
    c1.examples.push(
      mkExample(c1.id, "chunk", "아이들이 학교에 간다.", "The children go to school.")
    );
    const c2 = mkChunk(hakgyo.id, "학교를 졸업하다", "to graduate from school", "hak.kjo.ɾɯl tʃo.ɾʌp.ha.da");
    c2.examples.push(
      mkExample(c2.id, "chunk", "그녀는 작년에 학교를 졸업했다.", "She graduated from school last year.")
    );
    hakgyo.chunks.push(c1, c2);

    const co1 = mkCollocation(hakgyo.id, "큰 학교", "big school", "kʰɯn hak.kjo");
    const co2 = mkCollocation(hakgyo.id, "학교 생활", "school life", "hak.kjo sɛŋ.hwal");
    co2.examples.push(
      mkExample(co2.id, "collocation", "학교 생활이 즐겁다.", "School life is enjoyable.")
    );
    hakgyo.collocations.push(co1, co2);

    const id1 = mkIdiom(hakgyo.id, "학교가 멀다", "school is far away (used to express unwillingness to do something)", "hak.kjo.ga mʌl.da");
    id1.examples.push(
      mkExample(id1.id, "idiom", "일하기 싫어서 학교가 멀다는 말을 했다.", "He didn't want to work, so he said school was far — an excuse.")
    );
    hakgyo.idioms.push(id1);

    hakgyo.examples.push(
      mkExample(hakgyo.id, "word", "우리 학교는 도서관이 크다.", "Our school has a big library."),
      mkExample(hakgyo.id, "word", "학교 앞에서 만나자.", "Let's meet in front of the school.")
    );
    hakgyo.status = "complete";
  }

  // 3. 친구 — friend
  const chingu = mkWord({
    korean: "친구",
    english: "friend",
    romanization: "chingu",
    ipa: "tʃʰin.ku",
    partOfSpeech: "noun",
    usageContext: "Same-age friend by default; cross-age friendship is usually called 친하지만 친구는 아니다.",
    notes: "Koreans often reserve 친구 strictly for same-age acquaintances.",
    tags: ["people", "core"],
  });
  {
    const c1 = mkChunk(chingu.id, "친구가 되다", "to become friends", "tʃʰin.ku.ga tɛ.da");
    c1.examples.push(
      mkExample(c1.id, "chunk", "우리는 빨리 친구가 되었다.", "We became friends quickly.")
    );
    const c2 = mkChunk(chingu.id, "친구를 사귀다", "to make a friend", "tʃʰin.ku.ɾɯl sa.kʷi.da");
    c2.examples.push(
      mkExample(c2.id, "chunk", "새로운 학교에서 친구를 사귀었다.", "I made a friend at the new school.")
    );
    chingu.chunks.push(c1, c2);

    const co1 = mkCollocation(chingu.id, "오랜 친구", "old friend", "o.ɾɛn tʃʰin.ku");
    const co2 = mkCollocation(chingu.id, "친한 친구", "close friend", "tʃʰin.han tʃʰin.ku");
    co2.examples.push(
      mkExample(co2.id, "collocation", "그는 내 친한 친구다.", "He is my close friend.")
    );
    chingu.collocations.push(co1, co2);

    const id1 = mkIdiom(chingu.id, "친구 같은 사이", "a friend-like relationship (used even for non-friends)", "tʃʰin.ku ka.tɯn sa.i");
    id1.examples.push(
      mkExample(id1.id, "idiom", "둘은 친구 같은 사이다.", "The two are on friend-like terms.")
    );
    chingu.idioms.push(id1);

    chingu.examples.push(
      mkExample(chingu.id, "word", "친구와 영화를 봤다.", "I watched a movie with a friend."),
      mkExample(chingu.id, "word", "좋은 친구를 만나세요.", "May you meet a good friend.")
    );
    chingu.status = "complete";
  }

  // 4. 공부하다 — to study
  const gongbu = mkWord({
    korean: "공부하다",
    english: "to study",
    romanization: "gongbuhada",
    ipa: "koŋ.pu.ha.da",
    partOfSpeech: "verb",
    usageContext: "General studying, schoolwork, exam preparation.",
    notes: "공부 (study, noun) + 하다 (to do).",
    tags: ["action", "education", "core"],
  });
  {
    const c1 = mkChunk(gongbu.id, "열심히 공부하다", "to study hard", "jʌl.sim.hi koŋ.pu.ha.da");
    c1.examples.push(
      mkExample(c1.id, "chunk", "그는 시험을 위해 열심히 공부했다.", "He studied hard for the exam.")
    );
    const c2 = mkChunk(gongbu.id, "한국어를 공부하다", "to study Korean", "han.kuk.ʌ.ɾɯl koŋ.pu.ha.da");
    c2.examples.push(
      mkExample(c2.id, "chunk", "저는 매일 한국어를 공부해요.", "I study Korean every day.")
    );
    gongbu.chunks.push(c1, c2);

    const co1 = mkCollocation(gongbu.id, "혼자 공부하다", "to study alone", "hon.dʒa koŋ.pu.ha.da");
    const co2 = mkCollocation(gongbu.id, "공부 시간", "study time", "koŋ.pu si.dʒan");
    co2.examples.push(
      mkExample(co2.id, "collocation", "공부 시간이 부족하다.", "Study time is not enough.")
    );
    gongbu.collocations.push(co1, co2);

    const id1 = mkIdiom(gongbu.id, "가방이 무거울 정도로 공부하다", "to study so much that one's bag is heavy", "ka.baŋ.i mu.gʌ.ul dʒʌŋ.do.ɾo koŋ.pu.ha.da");
    id1.examples.push(
      mkExample(id1.id, "idiom", "그는 가방이 무거울 정도로 공부했다.", "He studied so much his bag was heavy — he studied a lot.")
    );
    gongbu.idioms.push(id1);

    gongbu.examples.push(
      mkExample(gongbu.id, "word", "도서관에서 공부합니다.", "I study at the library."),
      mkExample(gongbu.id, "word", "공부를 마치고 집에 간다.", "I finish studying and go home.")
    );
    gongbu.status = "complete";
  }

  // 5. 먹다 — to eat
  const meokda = mkWord({
    korean: "먹다",
    english: "to eat",
    romanization: "meokda",
    ipa: "mʌk.ta",
    partOfSpeech: "verb",
    usageContext: "Generic verb for eating. Slang-extended to absorbing or accepting things (e.g. losses, insults).",
    notes: "Stem form; conjugates irregularly: 먹어요 (informal polite), 먹었습니다 (formal past).",
    tags: ["action", "daily", "core"],
  });
  {
    const c1 = mkChunk(meokda.id, "밥을 먹다", "to eat a meal", "pa.pɯl mʌk.ta");
    c1.examples.push(
      mkExample(c1.id, "chunk", "점심에 밥을 먹었다.", "I ate lunch.")
    );
    const c2 = mkChunk(meokda.id, "맛있게 먹다", "to eat deliciously", "ma.si.tke mʌk.ta");
    c2.examples.push(
      mkExample(c2.id, "chunk", "아이들이 맛있게 먹었다.", "The children ate with enjoyment.")
    );
    meokda.chunks.push(c1, c2);

    const co1 = mkCollocation(meokda.id, "맛있는 음식을 먹다", "to eat delicious food", "ma.sin.nɯn ʌm.sik.ɯl mʌk.ta");
    const co2 = mkCollocation(meokda.id, "늦게 먹다", "to eat late", "nɯt.ke mʌk.ta");
    co2.examples.push(
      mkExample(co2.id, "collocation", "늦게 먹으면 살이 찐다.", "If you eat late, you gain weight.")
    );
    meokda.collocations.push(co1, co2);

    const id1 = mkIdiom(meokda.id, "눈을 먹다", "to eye someone / to look with desire (literally: to eat with the eyes)", "nu.nɯl mʌk.ta");
    id1.examples.push(
      mkExample(id1.id, "idiom", "그는 케이크를 눈으로 먹었다.", "He ate the cake with his eyes — he stared at it longingly.")
    );
    meokda.idioms.push(id1);

    meokda.examples.push(
      mkExample(meokda.id, "word", "뭐 먹을까요?", "What should we eat?"),
      mkExample(meokda.id, "word", "과일을 많이 먹어라.", "Eat lots of fruit.")
    );
    meokda.status = "complete";
  }

  // 6. 행복 — happiness (incomplete: missing idioms)
  const haengbok = mkWord({
    korean: "행복",
    english: "happiness",
    romanization: "haengbok",
    ipa: "hɛŋ.bok",
    partOfSpeech: "noun",
    usageContext: "Abstract noun for a state of being happy.",
    notes: "Paired with 하다 to form 행복하다 (to be happy).",
    tags: ["emotion"],
  });
  {
    const c1 = mkChunk(haengbok.id, "행복하다", "to be happy", "hɛŋ.bok.ha.da");
    c1.examples.push(
      mkExample(c1.id, "chunk", "나는 지금 행복해.", "I am happy right now.")
    );
    const c2 = mkChunk(haengbok.id, "행복을 느끼다", "to feel happiness", "hɛŋ.bok.ɯl nɯ.kʰi.da");
    haengbok.chunks.push(c1, c2);

    const co1 = mkCollocation(haengbok.id, "큰 행복", "great happiness", "kʰɯn hɛŋ.bok");
    const co2 = mkCollocation(haengbok.id, "행복한 삶", "happy life", "hɛŋ.bok.han sam");
    haengbok.collocations.push(co1, co2);

    // Missing: no idiom. Validate will flag as incomplete.
    haengbok.examples.push(
      mkExample(haengbok.id, "word", "행복은 어디에 있을까?", "Where could happiness be?")
    );
    haengbok.status = "incomplete";
  }

  // 7. 여행 — travel (incomplete: only 1 chunk, missing collocations)
  const yeohaeng = mkWord({
    korean: "여행",
    english: "travel",
    romanization: "yeohaeng",
    ipa: "jʌ.hɛŋ",
    partOfSpeech: "noun",
    usageContext: "A trip or journey, usually for pleasure.",
    notes: "Paired with 가다 to form 여행가다 (to go on a trip).",
    tags: ["leisure"],
  });
  {
    const c1 = mkChunk(yeohaeng.id, "여행을 가다", "to go on a trip", "jʌ.hɛŋ.ɯl ka.da");
    c1.examples.push(
      mkExample(c1.id, "chunk", "이번 주말에 여행을 간다.", "I am going on a trip this weekend.")
    );
    // Only one chunk — missing one
    yeohaeng.chunks.push(c1);

    // Missing collocations entirely
    const id1 = mkIdiom(yeohaeng.id, "여행은 떠나는 것이 아니라 돌아오는 것이다", "Travel is not about leaving but about returning", "jʌ.hɛŋ.ɯn tʌ.na.nɯn kʌ.si a.ni.ɾa to.ɾʌ.o.nɯn kʌ.si.da");
    yeohaeng.idioms.push(id1);

    yeohaeng.examples.push(
      mkExample(yeohaeng.id, "word", "여행이 좋아요.", "I like travel.")
    );
    yeohaeng.status = "incomplete";
  }

  return [sarang, hakgyo, chingu, gongbu, meokda, haengbok, yeohaeng];
}

// Seed demo data into the empty database.
// Returns the number of words inserted (0 if already seeded or non-empty).
export async function seedDemoDataIfNeeded(force = false): Promise<number> {
  const { getDb } = await import("./db");
  const db = getDb();
  const existingCount = await db.words.count();
  if (!force && existingCount > 0) return 0;
  const demo = buildDemoWords();
  await db.words.bulkPut(demo);
  return demo.length;
}

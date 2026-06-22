import { QUESTION_BY_ID, SCORED_QUESTIONS, questionsForLevel } from "../../shared/questions";
import { isAnswerCorrect, scoreAnswers, validateCompleteAnswerSet, type SubmittedAnswer } from "../../shared/scoring";

export interface SolveEvent {
  level: number;
  clearedAt: string;
  score: number;
  points: number;
}

export interface SubmissionPayload {
  playerId: string;
  attemptId: string;
  nickname: string;
  completedAt?: string;
  levelClearedAt?: Record<string, string>;
  answers: SubmittedAnswer[];
}

export interface ScoreRecord {
  playerId: string;
  attemptId: string;
  nickname: string;
  score: number;
  correct: number;
  total: number;
  topicBreakdown: Record<string, { correct: number; total: number }>;
  completedAt: string;
  events?: SolveEvent[];
}

export interface ProgressRecord {
  playerId: string;
  attemptId: string;
  nickname: string;
  score: number;
  correct: number;
  total: number;
  solved: number;
  updatedAt: string;
  events: SolveEvent[];
}

const safeId = /^[a-zA-Z0-9-]{8,80}$/;
const forbiddenNickname = /[<>{}\u0000-\u001f\u007f]/;

export const sanitizeNickname = (value: unknown) => {
  if (typeof value !== "string") return null;
  const nickname = value.normalize("NFKC").trim().replace(/\s+/g, " ");
  const length = Array.from(nickname).length;
  if (length < 2 || length > 12 || forbiddenNickname.test(nickname)) return null;
  return nickname;
};

const validId = (value: unknown) => typeof value === "string" && safeId.test(value);
const validDate = (value: unknown) => {
  if (typeof value !== "string") return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && time >= Date.parse("2024-01-01") && time <= Date.now() + 300_000;
};

const buildEvents = (answers: SubmittedAnswer[], completedLevels: number[], levelClearedAt: Record<string, string>) => {
  const byId = new Map(answers.map((answer) => [answer.questionId, answer.firstAnswer]));
  let cumulativeCorrect = 0;
  let previousScore = 0;
  return completedLevels.map((level) => {
    cumulativeCorrect += questionsForLevel(level).filter((question) =>
      isAnswerCorrect(question, byId.get(question.id) ?? ""),
    ).length;
    const score = Math.round((cumulativeCorrect / SCORED_QUESTIONS.length) * 100);
    const event = { level, clearedAt: levelClearedAt[String(level)], score, points: score - previousScore };
    previousScore = score;
    return event;
  });
};

export const validateProgressSubmission = (value: unknown): { ok: true; record: ProgressRecord } | { ok: false; error: string } => {
  if (!value || typeof value !== "object") return { ok: false, error: "INVALID_BODY" };
  const payload = value as Partial<SubmissionPayload> & { completedLevels?: number[] };
  const nickname = sanitizeNickname(payload.nickname);
  if (!nickname || !validId(payload.playerId) || !validId(payload.attemptId)) return { ok: false, error: "INVALID_PLAYER" };
  if (!Array.isArray(payload.completedLevels) || !Array.isArray(payload.answers) || !payload.levelClearedAt) return { ok: false, error: "INVALID_PROGRESS" };
  const levels = [...new Set(payload.completedLevels)].sort((a, b) => a - b);
  if (levels.length < 1 || levels.length > 8 || levels.some((level, index) => level !== index + 1)) return { ok: false, error: "INVALID_LEVELS" };
  if (levels.some((level) => !validDate(payload.levelClearedAt?.[String(level)]))) return { ok: false, error: "INVALID_EVENT_TIME" };
  if (payload.answers.some((answer) => !answer || typeof answer.questionId !== "string" || typeof answer.firstAnswer !== "string" || !QUESTION_BY_ID.has(answer.questionId))) return { ok: false, error: "INVALID_ANSWERS" };
  const answerIds = new Set(payload.answers.map((answer) => answer.questionId));
  if (answerIds.size !== payload.answers.length || levels.some((level) => questionsForLevel(level).some((question) => !answerIds.has(question.id)))) return { ok: false, error: "INCOMPLETE_PROGRESS" };
  const relevantAnswers = payload.answers.filter((answer) => (QUESTION_BY_ID.get(answer.questionId)?.level ?? 9) <= levels.length);
  const events = buildEvents(relevantAnswers, levels, payload.levelClearedAt);
  const correct = relevantAnswers.filter((answer) => isAnswerCorrect(QUESTION_BY_ID.get(answer.questionId)!, answer.firstAnswer)).length;
  return { ok: true, record: { playerId: payload.playerId!, attemptId: payload.attemptId!, nickname, score: events.at(-1)?.score ?? 0, correct, total: SCORED_QUESTIONS.length, solved: levels.length, updatedAt: new Date().toISOString(), events } };
};

export const validateSubmission = (value: unknown): { ok: true; record: ScoreRecord } | { ok: false; error: string } => {
  if (!value || typeof value !== "object") return { ok: false, error: "INVALID_BODY" };
  const payload = value as Partial<SubmissionPayload>;
  const nickname = sanitizeNickname(payload.nickname);
  if (!nickname) return { ok: false, error: "INVALID_NICKNAME" };
  if (!validId(payload.playerId)) return { ok: false, error: "INVALID_PLAYER_ID" };
  if (!validId(payload.attemptId)) return { ok: false, error: "INVALID_ATTEMPT_ID" };
  if (!Array.isArray(payload.answers)) return { ok: false, error: "INVALID_ANSWERS" };
  if (payload.answers.some((answer) =>
    !answer || typeof answer.questionId !== "string" || typeof answer.firstAnswer !== "string" || answer.firstAnswer.length > 220,
  )) return { ok: false, error: "INVALID_ANSWER_VALUE" };
  if (!validateCompleteAnswerSet(payload.answers)) return { ok: false, error: "INCOMPLETE_ANSWER_SET" };

  const result = scoreAnswers(payload.answers);
  return {
    ok: true,
    record: {
      playerId: payload.playerId as string,
      attemptId: payload.attemptId as string,
      nickname,
      score: result.score,
      correct: result.correct,
      total: result.total,
      topicBreakdown: result.topicBreakdown,
      completedAt: new Date().toISOString(),
      events: payload.levelClearedAt && Object.keys(payload.levelClearedAt).length === 8
        ? buildEvents(payload.answers, [1, 2, 3, 4, 5, 6, 7, 8], payload.levelClearedAt)
        : undefined,
    },
  };
};

export const aggregateScoreboard = (progress: ProgressRecord[], completed: ScoreRecord[]) => {
  const candidates: ProgressRecord[] = [
    ...progress,
    ...completed.map((record) => ({
      playerId: record.playerId,
      attemptId: record.attemptId,
      nickname: record.nickname,
      score: record.score,
      correct: record.correct,
      total: record.total,
      solved: 8,
      updatedAt: record.completedAt,
      events: record.events ?? [{ level: 8, clearedAt: record.completedAt, score: record.score, points: record.score }],
    })),
  ];
  const best = new Map<string, ProgressRecord>();
  for (const record of candidates) {
    const current = best.get(record.playerId);
    if (!current || record.score > current.score || (record.score === current.score && record.solved > current.solved) || (record.score === current.score && record.solved === current.solved && record.updatedAt > current.updatedAt)) best.set(record.playerId, record);
  }
  const sorted = [...best.values()].sort((a, b) => b.score - a.score || b.solved - a.solved || a.updatedAt.localeCompare(b.updatedAt));
  let lastKey = "";
  let rank = 0;
  const entries = sorted.map((record, index) => {
    const key = `${record.score}:${record.solved}`;
    if (key !== lastKey) rank = index + 1;
    lastKey = key;
    return { rank, nickname: record.nickname, score: record.score, solved: record.solved, updatedAt: record.updatedAt, events: record.events };
  });
  const activity = entries.flatMap((entry) => entry.events.map((event) => ({ nickname: entry.nickname, ...event })))
    .sort((a, b) => b.clearedAt.localeCompare(a.clearedAt)).slice(0, 100);
  return { entries, activity, serverTime: new Date().toISOString() };
};

export const aggregateLeaderboard = (records: ScoreRecord[], limit = 20) => {
  const bestByPlayer = new Map<string, ScoreRecord>();
  for (const record of records) {
    const current = bestByPlayer.get(record.playerId);
    const isNewerTie = current && record.score === current.score && record.completedAt > current.completedAt;
    if (!current || record.score > current.score || isNewerTie) bestByPlayer.set(record.playerId, record);
  }

  const sorted = [...bestByPlayer.values()].sort((a, b) =>
    b.score - a.score || a.nickname.localeCompare(b.nickname, "zh-Hant"),
  );
  let lastScore: number | null = null;
  let lastRank = 0;

  return sorted.slice(0, Math.max(1, Math.min(50, limit))).map((record, index) => {
    if (record.score !== lastScore) lastRank = index + 1;
    lastScore = record.score;
    return {
      rank: lastRank,
      nickname: record.nickname,
      score: record.score,
      completedAt: record.completedAt,
    };
  });
};

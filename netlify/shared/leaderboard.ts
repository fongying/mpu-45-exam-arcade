import { scoreAnswers, validateCompleteAnswerSet, type SubmittedAnswer } from "../../shared/scoring";

export interface SubmissionPayload {
  playerId: string;
  attemptId: string;
  nickname: string;
  completedAt?: string;
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

export const validateSubmission = (value: unknown): { ok: true; record: ScoreRecord } | { ok: false; error: string } => {
  if (!value || typeof value !== "object") return { ok: false, error: "INVALID_BODY" };
  const payload = value as Partial<SubmissionPayload>;
  const nickname = sanitizeNickname(payload.nickname);
  if (!nickname) return { ok: false, error: "INVALID_NICKNAME" };
  if (typeof payload.playerId !== "string" || !safeId.test(payload.playerId)) return { ok: false, error: "INVALID_PLAYER_ID" };
  if (typeof payload.attemptId !== "string" || !safeId.test(payload.attemptId)) return { ok: false, error: "INVALID_ATTEMPT_ID" };
  if (!Array.isArray(payload.answers)) return { ok: false, error: "INVALID_ANSWERS" };
  if (payload.answers.some((answer) =>
    !answer || typeof answer.questionId !== "string" || typeof answer.firstAnswer !== "string" || answer.firstAnswer.length > 220,
  )) return { ok: false, error: "INVALID_ANSWER_VALUE" };
  if (!validateCompleteAnswerSet(payload.answers)) return { ok: false, error: "INCOMPLETE_ANSWER_SET" };

  const result = scoreAnswers(payload.answers);
  return {
    ok: true,
    record: {
      playerId: payload.playerId,
      attemptId: payload.attemptId,
      nickname,
      score: result.score,
      correct: result.correct,
      total: result.total,
      topicBreakdown: result.topicBreakdown,
      completedAt: new Date().toISOString(),
    },
  };
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

import { describe, expect, it } from "vitest";
import { SCORED_QUESTIONS } from "../../shared/questions";
import { aggregateLeaderboard, sanitizeNickname, validateSubmission, type ScoreRecord } from "./_lib";

const baseRecord = (overrides: Partial<ScoreRecord>): ScoreRecord => ({
  playerId: "player-0001",
  attemptId: "attempt-0001",
  nickname: "阿澎",
  score: 80,
  correct: 39,
  total: 45,
  topicBreakdown: {},
  completedAt: "2026-06-23T10:00:00.000Z",
  ...overrides,
});

describe("leaderboard validation", () => {
  it("sanitizes nicknames and blocks markup", () => {
    expect(sanitizeNickname("  阿  澎 ")).toBe("阿 澎");
    expect(sanitizeNickname("<script>")).toBeNull();
    expect(sanitizeNickname("A")).toBeNull();
  });

  it("recomputes a valid perfect submission", () => {
    const answers = SCORED_QUESTIONS.map((question) => ({ questionId: question.id, firstAnswer: question.correctAnswer }));
    const result = validateSubmission({
      playerId: "11111111-1111-4111-8111-111111111111",
      attemptId: "22222222-2222-4222-8222-222222222222",
      nickname: "測試玩家",
      answers,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.record.score).toBe(100);
  });

  it("keeps one best record per anonymous player and shares ranks on ties", () => {
    const entries = aggregateLeaderboard([
      baseRecord({ score: 60, attemptId: "attempt-0001" }),
      baseRecord({ score: 90, attemptId: "attempt-0002", completedAt: "2026-06-23T11:00:00.000Z" }),
      baseRecord({ playerId: "player-0002", nickname: "小明", score: 90, attemptId: "attempt-0003" }),
      baseRecord({ playerId: "player-0003", nickname: "小華", score: 70, attemptId: "attempt-0004" }),
    ]);
    expect(entries).toHaveLength(3);
    expect(entries.map((entry) => entry.rank)).toEqual([1, 1, 3]);
    expect(entries.find((entry) => entry.nickname === "阿澎")?.score).toBe(90);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { questionsForLevel } from "../../shared/questions";
import { createSession, moveToNextLevel, sessionScore, submitLevelAnswers } from "./game";

describe("game progression", () => {
  beforeEach(() => {
    vi.stubGlobal("crypto", { randomUUID: () => "11111111-1111-4111-8111-111111111111" });
  });

  it("keeps the first answer while allowing correction", () => {
    const initial = createSession("測試玩家");
    const questions = questionsForLevel(1);
    const wrongDrafts = Object.fromEntries(questions.map((question) => [question.id, "錯誤"]));
    const first = submitLevelAnswers(initial, 1, wrongDrafts);
    expect(first.passed).toBe(false);

    const correctedDrafts = Object.fromEntries(questions.map((question) => [question.id, question.correctAnswer]));
    const second = submitLevelAnswers(first.session, 1, correctedDrafts);
    expect(second.passed).toBe(true);
    expect(second.session.answers["l1-01"].firstAnswer).toBe("錯誤");
    expect(second.session.answers["l1-01"].latestAnswer).toBe("Polling");
    expect(second.session.answers["l1-01"].firstCorrect).toBe(false);
  });

  it("does not submit an incomplete level", () => {
    const session = createSession("測試玩家");
    const result = submitLevelAnswers(session, 1, {});
    expect(result.missing).toHaveLength(5);
    expect(Object.keys(result.session.answers)).toHaveLength(0);
  });

  it("completes all eight levels and produces a 45-item score", () => {
    let session = createSession("完整測試");
    for (let level = 1; level <= 8; level += 1) {
      const drafts = Object.fromEntries(
        questionsForLevel(level).map((question) => [question.id, question.correctAnswer]),
      );
      const result = submitLevelAnswers(session, level, drafts);
      expect(result.passed).toBe(true);
      session = level < 8 ? moveToNextLevel(result.session) : result.session;
    }
    expect(session.completedLevels).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(session.completedAt).toBeTruthy();
    expect(sessionScore(session)).toMatchObject({ correct: 45, total: 45, score: 100 });
  });
});

import { describe, expect, it } from "vitest";
import { SCORED_QUESTIONS } from "./questions";
import { isAnswerCorrect, scoreAnswers, validateCompleteAnswerSet } from "./scoring";

describe("question bank and scoring", () => {
  it("contains exactly 45 uniquely identified scored questions", () => {
    expect(SCORED_QUESTIONS).toHaveLength(45);
    expect(new Set(SCORED_QUESTIONS.map((question) => question.id)).size).toBe(45);
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((level) => SCORED_QUESTIONS.filter((q) => q.level === level).length))
      .toEqual([5, 5, 5, 5, 5, 5, 7, 8]);
  });

  it("normalizes accepted text and units", () => {
    const l7 = SCORED_QUESTIONS.find((question) => question.id === "l7-05")!;
    const l8 = SCORED_QUESTIONS.find((question) => question.id === "l8-12")!;
    expect(isAnswerCorrect(l7, "128 KB")).toBe(true);
    expect(isAnswerCorrect(l8, "cpu")).toBe(true);
  });

  it("scores a complete answer set on the server key", () => {
    const answers = SCORED_QUESTIONS.map((question) => ({ questionId: question.id, firstAnswer: question.correctAnswer }));
    expect(validateCompleteAnswerSet(answers)).toBe(true);
    expect(scoreAnswers(answers)).toMatchObject({ correct: 45, total: 45, score: 100 });
  });
});

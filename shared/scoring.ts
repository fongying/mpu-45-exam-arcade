import { QUESTION_BY_ID, SCORED_QUESTIONS, type ScoredQuestion, type Topic } from "./questions";

export interface SubmittedAnswer {
  questionId: string;
  firstAnswer: string;
}

export const normalizeAnswer = (value: string) =>
  value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("zh-Hant")
    .replace(/[\s,，]+/g, "")
    .replace(/mbytes?/g, "mb")
    .replace(/kbytes?/g, "kb");

export const isAnswerCorrect = (question: ScoredQuestion, answer: string) => {
  const accepted = question.acceptedAnswers ?? [question.correctAnswer];
  return accepted.some((candidate) => normalizeAnswer(candidate) === normalizeAnswer(answer));
};

export const scoreAnswers = (answers: SubmittedAnswer[]) => {
  const byId = new Map(answers.map((answer) => [answer.questionId, answer.firstAnswer]));
  let correct = 0;
  const topicTotals = new Map<Topic, { correct: number; total: number }>();

  for (const question of SCORED_QUESTIONS) {
    const answer = byId.get(question.id) ?? "";
    const hit = isAnswerCorrect(question, answer);
    if (hit) correct += 1;
    const topic = topicTotals.get(question.topic) ?? { correct: 0, total: 0 };
    topic.total += 1;
    if (hit) topic.correct += 1;
    topicTotals.set(question.topic, topic);
  }

  return {
    correct,
    total: SCORED_QUESTIONS.length,
    score: Math.round((correct / SCORED_QUESTIONS.length) * 100),
    topicBreakdown: Object.fromEntries(topicTotals),
  };
};

export const validateCompleteAnswerSet = (answers: SubmittedAnswer[]) => {
  if (answers.length !== SCORED_QUESTIONS.length) return false;
  const ids = new Set(answers.map((answer) => answer.questionId));
  return ids.size === SCORED_QUESTIONS.length && [...ids].every((id) => QUESTION_BY_ID.has(id));
};

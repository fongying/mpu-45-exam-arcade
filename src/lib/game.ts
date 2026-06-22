import { SCORED_QUESTIONS, questionsForLevel } from "../../shared/questions";
import { isAnswerCorrect, scoreAnswers } from "../../shared/scoring";

export const SESSION_VERSION = 1;
export const SESSION_KEY = "mpu49.session.v1";
export const BEST_SCORE_KEY = "mpu49.best-score.v1";

export interface AnswerRecord {
  firstAnswer: string;
  latestAnswer: string;
  firstCorrect: boolean;
  isCorrect: boolean;
  attempts: number;
}

export interface GameSession {
  version: number;
  playerId: string;
  attemptId: string;
  nickname: string;
  currentLevel: number;
  completedLevels: number[];
  levelClearedAt: Record<string, string>;
  answers: Record<string, AnswerRecord>;
  guidedResponses: Record<string, string>;
  startedAt: string;
  completedAt?: string;
  submittedAt?: string;
}

const makeId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const createSession = (nickname: string, playerId = makeId()): GameSession => ({
  version: SESSION_VERSION,
  playerId,
  attemptId: makeId(),
  nickname: nickname.trim(),
  currentLevel: 1,
  completedLevels: [],
  levelClearedAt: {},
  answers: {},
  guidedResponses: {},
  startedAt: new Date().toISOString(),
});

export const loadSession = (): GameSession | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameSession;
    if (parsed.version !== SESSION_VERSION || !parsed.playerId || !parsed.attemptId) return null;
    return { ...parsed, levelClearedAt: parsed.levelClearedAt ?? {} };
  } catch {
    return null;
  }
};

export const saveSession = (session: GameSession) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const submitLevelAnswers = (
  session: GameSession,
  level: number,
  drafts: Record<string, string>,
) => {
  const questions = questionsForLevel(level);
  const missing = questions.filter((question) => !drafts[question.id]?.trim());
  if (missing.length > 0) return { session, passed: false, missing: missing.map((question) => question.id) };

  const answers = { ...session.answers };
  for (const question of questions) {
    const latestAnswer = drafts[question.id].trim();
    const previous = answers[question.id];
    const latestCorrect = isAnswerCorrect(question, latestAnswer);
    answers[question.id] = previous
      ? {
          ...previous,
          latestAnswer,
          isCorrect: latestCorrect,
          attempts: previous.attempts + (previous.latestAnswer === latestAnswer ? 0 : 1),
        }
      : {
          firstAnswer: latestAnswer,
          latestAnswer,
          firstCorrect: latestCorrect,
          isCorrect: latestCorrect,
          attempts: 1,
        };
  }

  const passed = questions.every((question) => answers[question.id]?.isCorrect);
  const completedLevels = passed
    ? [...new Set([...session.completedLevels, level])].sort((a, b) => a - b)
    : session.completedLevels;
  const completedAt = passed && level === 8 ? session.completedAt ?? new Date().toISOString() : session.completedAt;
  const levelClearedAt = passed && !session.levelClearedAt?.[level]
    ? { ...(session.levelClearedAt ?? {}), [level]: completedAt ?? new Date().toISOString() }
    : session.levelClearedAt ?? {};

  return {
    session: { ...session, answers, completedLevels, levelClearedAt, completedAt },
    passed,
    missing: [] as string[],
  };
};

export const moveToNextLevel = (session: GameSession): GameSession => ({
  ...session,
  currentLevel: Math.min(8, session.currentLevel + 1),
});

export const sessionScore = (session: GameSession) =>
  scoreAnswers(
    Object.entries(session.answers).map(([questionId, answer]) => ({
      questionId,
      firstAnswer: answer.firstAnswer,
    })),
  );

export const wrongQuestions = (session: GameSession) =>
  SCORED_QUESTIONS.filter((question) => session.answers[question.id] && !session.answers[question.id].firstCorrect);

export const elapsedSeconds = (session: GameSession) => {
  const end = session.completedAt ? new Date(session.completedAt).getTime() : Date.now();
  return Math.max(0, Math.floor((end - new Date(session.startedAt).getTime()) / 1000));
};

export const recordLocalBest = (score: number) => {
  const best = Math.max(score, Number(localStorage.getItem(BEST_SCORE_KEY) ?? 0));
  localStorage.setItem(BEST_SCORE_KEY, String(best));
  return best;
};

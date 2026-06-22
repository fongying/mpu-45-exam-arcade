import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpenCheck, Check, Clock3, Medal, RefreshCw, RotateCcw, Trophy, WifiOff, X } from "lucide-react";
import { isAnswerCorrect } from "../../shared/scoring";
import type { ScoredQuestion } from "../../shared/questions";
import {
  elapsedSeconds,
  recordLocalBest,
  sessionScore,
  wrongQuestions,
  type GameSession,
} from "../lib/game";

interface LeaderboardEntry {
  rank: number;
  nickname: string;
  score: number;
  completedAt: string;
}

interface ResultScreenProps {
  session: GameSession;
  onRestart: () => void;
  onSubmitted: () => void;
}

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

function RetryCard({ question, firstAnswer }: { question: ScoredQuestion; firstAnswer: string }) {
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const correct = checked && isAnswerCorrect(question, answer);
  const options = question.kind === "choice"
    ? question.options
    : question.kind === "classify"
      ? question.categories
      : question.kind === "match"
        ? question.options
        : [];

  return (
    <article className="wrong-card">
      <div className="wrong-card__head">
        <span>{question.id.toUpperCase()} / {question.topic}</span>
        <strong>首答：{firstAnswer}</strong>
      </div>
      <h3>{question.kind === "classify" || question.kind === "match" ? `${question.item}：${question.prompt}` : question.prompt}</h3>
      <div className="wrong-card__answer">
        {options.length > 0 ? (
          <select value={answer} onChange={(event) => { setAnswer(event.target.value); setChecked(false); }}>
            <option value="">選擇答案</option>
            {options.map((option) => <option value={option} key={option}>{option}</option>)}
          </select>
        ) : question.kind === "order" ? (
          <p className="wrong-card__order">請背熟：{question.correctAnswer.replaceAll("|", " → ")}</p>
        ) : (
          <input value={answer} onChange={(event) => { setAnswer(event.target.value); setChecked(false); }} placeholder="再答一次" />
        )}
        {question.kind !== "order" && (
          <button type="button" onClick={() => setChecked(true)} disabled={!answer.trim()}>
            再次判定
          </button>
        )}
      </div>
      {checked && (
        <div className={`retry-status ${correct ? "is-correct" : "is-wrong"}`}>
          {correct ? <Check size={17} /> : <X size={17} />}
          {correct ? "這次答對了。" : `再看一次口訣：${question.mnemonic}`}
        </div>
      )}
      <details>
        <summary>展開詳解與技術註記</summary>
        <p><b>正解：</b>{question.correctAnswer.replaceAll("|", " → ")}</p>
        <p>{question.explanation}</p>
        {question.technicalNote && <p className="tech-note">TECH NOTE / {question.technicalNote}</p>}
        <small>來源：{question.source}</small>
      </details>
    </article>
  );
}

export function ResultScreen({ session, onRestart, onSubmitted }: ResultScreenProps) {
  const score = useMemo(() => sessionScore(session), [session]);
  const wrong = useMemo(() => wrongQuestions(session), [session]);
  const [personalBest] = useState(() => recordLocalBest(score.score));
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [networkStatus, setNetworkStatus] = useState<"loading" | "ready" | "offline">("loading");
  const [showWrong, setShowWrong] = useState(true);

  const loadLeaderboard = useCallback(async () => {
    try {
      const response = await fetch("/.netlify/functions/leaderboard?limit=20");
      if (!response.ok) throw new Error("leaderboard unavailable");
      const body = await response.json() as { entries: LeaderboardEntry[] };
      setLeaderboard(body.entries);
      setNetworkStatus("ready");
    } catch {
      setNetworkStatus("offline");
    }
  }, []);

  const submitScore = useCallback(async () => {
    setNetworkStatus("loading");
    try {
      if (!session.submittedAt) {
        const answers = Object.entries(session.answers).map(([questionId, record]) => ({
          questionId,
          firstAnswer: record.firstAnswer,
        }));
        const response = await fetch("/.netlify/functions/submit-score", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            playerId: session.playerId,
            attemptId: session.attemptId,
            nickname: session.nickname,
            completedAt: session.completedAt,
            answers,
          }),
        });
        if (!response.ok && response.status !== 409) throw new Error("submit failed");
        onSubmitted();
      }
      await loadLeaderboard();
    } catch {
      setNetworkStatus("offline");
    }
  }, [loadLeaderboard, onSubmitted, session]);

  useEffect(() => {
    void submitScore();
  }, [submitScore]);

  const grade = score.score >= 90 ? "S" : score.score >= 80 ? "A" : score.score >= 70 ? "B" : score.score >= 60 ? "C" : "D";

  return (
    <main className="result-screen">
      <header className="result-hero">
        <div className="result-hero__stamp">MISSION COMPLETE</div>
        <div className="result-hero__score">
          <span>RANK</span>
          <strong>{grade}</strong>
        </div>
        <div className="result-hero__copy">
          <p className="eyebrow">MPU-45 / FINAL REPORT</p>
          <h1>{session.nickname}，系統修復完成。</h1>
          <p>你已訂正全部關卡；下方分數忠實保留第一次作答的結果。</p>
        </div>
        <div className="result-hero__number">
          <strong>{score.score}</strong>
          <span>/ 100</span>
        </div>
      </header>

      <section className="result-stats" aria-label="成績摘要">
        <article><BookOpenCheck /><span>首答正確</span><strong>{score.correct} / {score.total}</strong></article>
        <article><Medal /><span>個人最佳</span><strong>{personalBest}</strong></article>
        <article><Clock3 /><span>本次耗時</span><strong>{formatDuration(elapsedSeconds(session))}</strong></article>
        <article><RefreshCw /><span>已訂正錯題</span><strong>{wrong.length}</strong></article>
      </section>

      <div className="result-grid">
        <section className="topic-report panel-shell">
          <div className="section-heading">
            <div><span className="eyebrow">DIAGNOSTIC</span><h2>主題診斷</h2></div>
            <span>FIRST TRY</span>
          </div>
          <div className="topic-bars">
            {Object.entries(score.topicBreakdown).map(([topic, result]) => {
              const percentage = Math.round((result.correct / result.total) * 100);
              return (
                <div className="topic-bar" key={topic}>
                  <div><span>{topic}</span><b>{result.correct}/{result.total}</b></div>
                  <div className="topic-bar__track"><i style={{ width: `${percentage}%` }} /></div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="leaderboard panel-shell">
          <div className="section-heading">
            <div><span className="eyebrow">CLASS RANK</span><h2>班級排行榜</h2></div>
            {networkStatus === "ready" && <Trophy size={24} />}
          </div>
          {networkStatus === "loading" && <p className="network-message">正在同步排行榜...</p>}
          {networkStatus === "offline" && (
            <div className="network-message network-message--offline">
              <WifiOff />
              <p>目前無法連線排行榜，本機成績與錯題仍已完整保存。</p>
              <button type="button" onClick={() => void submitScore()}>重新連線</button>
            </div>
          )}
          {networkStatus === "ready" && leaderboard.length === 0 && <p className="network-message">你可能是第一位完成挑戰的人。</p>}
          {leaderboard.length > 0 && (
            <ol className="rank-list">
              {leaderboard.map((entry, index) => (
                <li key={`${entry.nickname}-${entry.completedAt}-${index}`} className={entry.nickname === session.nickname && entry.score === score.score ? "is-player" : ""}>
                  <span className="rank-list__rank">#{String(entry.rank).padStart(2, "0")}</span>
                  <strong>{entry.nickname}</strong>
                  <time>{new Date(entry.completedAt).toLocaleDateString("zh-TW")}</time>
                  <b>{entry.score}</b>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="wrong-book">
        <div className="wrong-book__heading">
          <div>
            <span className="eyebrow">ERROR LOG / {wrong.length}</span>
            <h2>錯題修復紀錄</h2>
            <p>這裡只列第一次答錯的題目；再練結果不會改動已提交的排行榜分數。</p>
          </div>
          <button type="button" className="secondary-button" onClick={() => setShowWrong((value) => !value)}>
            {showWrong ? "收起紀錄" : "展開錯題"}
          </button>
        </div>
        {showWrong && (
          <div className="wrong-grid">
            {wrong.length === 0 ? (
              <div className="perfect-card"><Trophy /><strong>首答全對</strong><span>你把整台微處理機一次修好了。</span></div>
            ) : wrong.map((question) => (
              <RetryCard key={question.id} question={question} firstAnswer={session.answers[question.id].firstAnswer} />
            ))}
          </div>
        )}
      </section>

      <footer className="result-actions">
        <div><span>READY FOR ANOTHER RUN?</span><p>新挑戰會建立新的答題紀錄；排行榜只保留本裝置最佳成績。</p></div>
        <button type="button" className="primary-button" onClick={onRestart}><RotateCcw /> 重新啟動挑戰</button>
      </footer>
    </main>
  );
}

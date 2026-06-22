import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Binary,
  BookOpenCheck,
  Boxes,
  Check,
  ChevronRight,
  CircuitBoard,
  Clock3,
  Cpu,
  Database,
  Gauge,
  HardDrive,
  Keyboard,
  LockKeyhole,
  Network,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { GUIDED_RESPONSES, LEVEL_CODES, LEVEL_TITLES, SCORED_QUESTIONS, questionsForLevel } from "../shared/questions";
import { ResultScreen } from "./components/ResultScreen";
import { StageWidgets } from "./components/StageWidgets";
import {
  SESSION_KEY,
  createSession,
  loadSession,
  moveToNextLevel,
  saveSession,
  submitLevelAnswers,
  type GameSession,
} from "./lib/game";

const LEVEL_META: Array<{
  description: string;
  mission: string;
  icon: LucideIcon;
}> = [
  { description: "判讀 CPU、裝置與記憶體之間的訊號流向。", mission: "分流 5 組緊急訊號", icon: Zap },
  { description: "重建記憶體速度階層與顯示記憶體公式。", mission: "校準 5 組容量參數", icon: Gauge },
  { description: "修復 ROM 家族的燒錄、清除與應用資料。", mission: "接回 5 組記憶晶片", icon: Database },
  { description: "沿著 CPU 存取路徑找到命中與缺頁的出口。", mission: "破解 5 個存取情境", icon: CircuitBoard },
  { description: "讓輸送帶重新平行運轉，排除跳躍危機。", mission: "修復 5 個管線節點", icon: Activity },
  { description: "把裝置與服務送往正確的系統控制室。", mission: "完成 5 次系統派遣", icon: Network },
  { description: "從原始 CPU-Z 畫面讀出核心與快取真相。", mission: "擷取 7 組晶片數據", icon: Cpu },
  { description: "以原考卷題型完成最後的綜合壓力測試。", mission: "擊破 8 題與 1 題筆答", icon: Trophy },
];

function BrandMark() {
  return (
    <div className="brand-mark" aria-label="MPU-45 微處理機通關考驗">
      <span className="brand-mark__chip"><Binary size={23} /></span>
      <span><b>MPU-45</b><small>PRE-EXAM ARCADE</small></span>
    </div>
  );
}

function WelcomeScreen({ existing, onStart, onContinue }: {
  existing: GameSession | null;
  onStart: (nickname: string) => void;
  onContinue: () => void;
}) {
  const [nickname, setNickname] = useState(existing?.nickname ?? "");
  const [error, setError] = useState("");

  const start = () => {
    const length = Array.from(nickname.trim()).length;
    if (length < 2 || length > 12) {
      setError("暱稱需為 2–12 個字元。請不要填寫真實姓名或學號。 ");
      return;
    }
    setError("");
    onStart(nickname.trim());
  };

  return (
    <main className="welcome-screen">
      <nav className="welcome-nav">
        <BrandMark />
        <div className="system-status"><span /><b>SYSTEM READY</b><small>{SCORED_QUESTIONS.length} CHECKPOINTS</small></div>
      </nav>

      <section className="welcome-hero">
        <div className="welcome-hero__copy">
          <div className="hero-kicker"><span>114-2 FINAL</span><i /> 國立澎湖海事</div>
          <h1>
            <span>微處理機</span>
            <strong>考前通關考驗</strong>
          </h1>
          <p>八座控制室、45 個檢查點。答錯不會被淘汰，但必須親手修正每一條錯誤訊號。</p>
          <div className="hero-facts">
            <span><Clock3 /> 約 20–25 分鐘</span>
            <span><ShieldCheck /> 首答計分，訂正通關</span>
            <span><Keyboard /> 鍵盤與手機皆可玩</span>
          </div>
        </div>

        <div className="start-console">
          <div className="console-header"><span>PLAYER TERMINAL</span><div><i /><i /><i /></div></div>
          {existing && !existing.completedAt && (
            <button type="button" className="resume-card" onClick={onContinue}>
              <span className="resume-card__level">L{existing.currentLevel}</span>
              <span><b>偵測到未完成任務</b><small>{existing.nickname} / {LEVEL_TITLES[existing.currentLevel - 1]}</small></span>
              <ChevronRight />
            </button>
          )}
          <label className="player-input">
            <span><UserRound size={16} /> 玩家暱稱</span>
            <input
              value={nickname}
              maxLength={12}
              autoComplete="nickname"
              placeholder="輸入 2–12 字暱稱"
              onChange={(event) => setNickname(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") start(); }}
            />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="button" className="start-button" onClick={start}>
            <Play fill="currentColor" /> {existing ? "建立新的挑戰" : "插入代幣，開始挑戰"}
          </button>
          <p className="privacy-note">暱稱僅用於班級排行榜；本機會以匿名代碼保存進度。</p>
        </div>

        <div className="hero-chip" aria-hidden="true">
          <div className="hero-chip__core"><Cpu size={56} strokeWidth={1.3} /><span>HX<br />370</span></div>
          {Array.from({ length: 14 }).map((_, index) => <i key={index} />)}
        </div>
      </section>

      <section className="mission-preview">
        <div className="mission-preview__title"><span>MISSION MAP</span><i /><small>8 STAGES</small></div>
        <div className="mission-strip">
          {LEVEL_META.map((level, index) => {
            const Icon = level.icon;
            return (
              <article key={LEVEL_TITLES[index]} style={{ "--delay": `${index * 70}ms` } as React.CSSProperties}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <Icon size={25} />
                <div><b>{LEVEL_TITLES[index]}</b><small>{LEVEL_CODES[index]}</small></div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function LevelComplete({ level, onNext }: { level: number; onNext: () => void }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="level-complete-title">
      <div className="level-complete">
        <div className="level-complete__burst"><Check size={42} /></div>
        <span className="eyebrow">STAGE {String(level).padStart(2, "0")} CLEARED</span>
        <h2 id="level-complete-title">{LEVEL_TITLES[level - 1]}，訊號正常。</h2>
        <p>本關錯誤已全部訂正。首次作答紀錄已鎖定，準備進入下一座控制室。</p>
        <button type="button" className="primary-button" autoFocus onClick={onNext}>
          前往第 {level + 1} 關 <ArrowRight />
        </button>
      </div>
    </div>
  );
}

function GameScreen({ session, onChange, onAbandon }: {
  session: GameSession;
  onChange: (session: GameSession) => void;
  onAbandon: () => void;
}) {
  const level = session.currentLevel;
  const questions = useMemo(() => questionsForLevel(level), [level]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const [showComplete, setShowComplete] = useState(false);
  const [guidedWarning, setGuidedWarning] = useState(false);
  const meta = LEVEL_META[level - 1];
  const Icon = meta.icon;

  useEffect(() => {
    const currentDrafts = Object.fromEntries(
      questions.map((question) => [question.id, session.answers[question.id]?.latestAnswer ?? ""]),
    );
    setDrafts(currentDrafts);
    setChecked(questions.some((question) => Boolean(session.answers[question.id])));
    setMissing([]);
    setShowComplete(false);
  }, [level, questions, session.attemptId]);

  const answer = useCallback((questionId: string, value: string) => {
    setDrafts((current) => ({ ...current, [questionId]: value }));
    setMissing((current) => current.filter((id) => id !== questionId));
  }, []);

  const updateGuided = (id: string, value: string) => {
    setGuidedWarning(false);
    onChange({ ...session, guidedResponses: { ...session.guidedResponses, [id]: value } });
  };

  const submit = () => {
    if (level === 8 && GUIDED_RESPONSES.some((item) => (session.guidedResponses[item.id] ?? "").trim().length < 3)) {
      setGuidedWarning(true);
      document.getElementById("guided-responses")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const result = submitLevelAnswers(session, level, drafts);
    setMissing(result.missing);
    if (result.missing.length > 0) return;
    setChecked(true);
    onChange(result.session);
    if (result.passed && level < 8) setShowComplete(true);
    if (!result.passed) window.setTimeout(() => document.querySelector(".is-wrong, .feedback--wrong")?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  };

  const answeredCount = questions.filter((question) => drafts[question.id]?.trim()).length;
  const currentCorrect = questions.filter((question) => session.answers[question.id]?.isCorrect).length;

  return (
    <main className={`game-screen game-screen--level-${level}`}>
      <header className="game-topbar">
        <BrandMark />
        <div className="topbar-progress">
          <span>GLOBAL PROGRESS</span>
          <div><i style={{ width: `${((level - 1) / 8) * 100}%` }} /></div>
          <b>{Math.round(((level - 1) / 8) * 100)}%</b>
        </div>
        <div className="player-badge"><UserRound size={17} /><span><small>PLAYER</small>{session.nickname}</span></div>
        <button type="button" className="icon-button" onClick={onAbandon} aria-label="中止並回到首頁"><RotateCcw size={18} /></button>
      </header>

      <div className="game-layout">
        <aside className="mission-rail" aria-label="關卡進度">
          <div className="mission-rail__label">STAGE SELECT</div>
          {LEVEL_TITLES.map((title, index) => {
            const stage = index + 1;
            const completed = session.completedLevels.includes(stage);
            const active = stage === level;
            return (
              <div className={`rail-node ${completed ? "is-complete" : ""} ${active ? "is-active" : ""}`} key={title}>
                <span>{completed ? <Check size={15} /> : stage > level ? <LockKeyhole size={14} /> : String(stage).padStart(2, "0")}</span>
                <div><b>{title}</b><small>{LEVEL_CODES[index]}</small></div>
              </div>
            );
          })}
          <div className="mission-rail__footer"><Sparkles size={16} /><span>首答計分<br />訂正通關</span></div>
        </aside>

        <div className="stage-main">
          <header className="stage-header">
            <div className="stage-header__number"><span>STAGE</span><strong>{String(level).padStart(2, "0")}</strong></div>
            <div className="stage-header__icon"><Icon size={38} strokeWidth={1.5} /></div>
            <div className="stage-header__copy">
              <span className="eyebrow">{LEVEL_CODES[level - 1]} / ACTIVE MISSION</span>
              <h1>{LEVEL_TITLES[level - 1]}</h1>
              <p>{meta.description}</p>
            </div>
            <div className="stage-header__meter">
              <span>CHECKPOINTS</span>
              <strong>{checked ? currentCorrect : answeredCount}<small> / {questions.length}</small></strong>
              <i>{meta.mission}</i>
            </div>
          </header>

          {level === 5 && (
            <div className="pipeline-visual" aria-hidden="true">
              {["FETCH", "DECODE", "EXECUTE", "MEM", "WRITE"].map((step, index) => (
                <div key={step}><span>{index + 1}</span><b>{step}</b><i /></div>
              ))}
            </div>
          )}

          <StageWidgets
            questions={questions}
            drafts={drafts}
            records={session.answers}
            checked={checked}
            seed={session.attemptId}
            onAnswer={answer}
          />

          {level === 8 && (
            <section className="guided-section" id="guided-responses">
              <div className="guided-section__head">
                <div><span className="eyebrow">WRITTEN RESPONSE / NOT SCORED</span><h2>問答題組裝台</h2></div>
                <span>完成這一題才可送出，但不影響排行榜。</span>
              </div>
              {GUIDED_RESPONSES.map((item, index) => (
                <article className="guided-card" key={item.id}>
                  <span className="guided-card__number">0{index + 1}</span>
                  <div>
                    <h3>{item.prompt}</h3>
                    <textarea
                      value={session.guidedResponses[item.id] ?? ""}
                      placeholder={item.placeholder}
                      onChange={(event) => updateGuided(item.id, event.target.value)}
                    />
                    <details>
                      <summary>作答檢查表與參考答案</summary>
                      <ul>{item.checklist.map((entry) => <li key={entry}>{entry}</li>)}</ul>
                      <p>{item.example}</p>
                    </details>
                  </div>
                </article>
              ))}
              {guidedWarning && <p className="form-error" role="alert">問答題要先寫下至少 3 個字，才可啟動最終判定。</p>}
            </section>
          )}

          <footer className="stage-submit">
            <div>
              <span>{checked ? "CORRECTION MODE" : "FIRST ATTEMPT"}</span>
              <p>{checked ? "紅色項目仍需校正；綠色答案已鎖定。" : "第一次按下判定時，答案將寫入最終分數。"}</p>
              {missing.length > 0 && <b role="alert">尚有 {missing.length} 個檢查點未作答。</b>}
            </div>
            <button type="button" className="primary-button" onClick={submit}>
              {checked ? "重新啟動檢查" : "鎖定答案並判定"} <ArrowRight />
            </button>
          </footer>
        </div>
      </div>
      {showComplete && (
        <LevelComplete
          level={level}
          onNext={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            onChange(moveToNextLevel(session));
          }}
        />
      )}
    </main>
  );
}

export default function App() {
  const [session, setSession] = useState<GameSession | null>(() => loadSession());
  const [view, setView] = useState<"welcome" | "game" | "result">(() => {
    const saved = loadSession();
    return saved?.completedAt ? "result" : "welcome";
  });

  useEffect(() => {
    if (session) saveSession(session);
  }, [session]);

  const start = (nickname: string) => {
    const next = createSession(nickname, session?.playerId);
    setSession(next);
    setView("game");
  };

  const changeSession = (next: GameSession) => {
    setSession(next);
    if (next.completedAt) setView("result");
  };

  const abandon = () => {
    if (!window.confirm("確定中止本次挑戰？目前進度會被清除，但排行榜最佳成績會保留。")) return;
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setView("welcome");
  };

  const markSubmitted = useCallback(() => {
    setSession((current) => current ? { ...current, submittedAt: current.submittedAt ?? new Date().toISOString() } : current);
  }, []);

  if (view === "result" && session?.completedAt) {
    return <ResultScreen session={session} onSubmitted={markSubmitted} onRestart={() => start(session.nickname)} />;
  }

  if (view === "game" && session) {
    return <GameScreen session={session} onChange={changeSession} onAbandon={abandon} />;
  }

  return (
    <WelcomeScreen
      existing={session}
      onStart={start}
      onContinue={() => { if (session) setView("game"); }}
    />
  );
}

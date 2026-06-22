import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, ArrowLeft, Clock3, RefreshCw, Trophy, WifiOff } from "lucide-react";
import { LEVEL_TITLES } from "../../shared/questions";

interface SolveEvent { level: number; clearedAt: string; score: number; points: number }
interface BoardEntry { rank: number; nickname: string; score: number; solved: number; updatedAt: string; events: SolveEvent[] }
interface ActivityEntry extends SolveEvent { nickname: string }
interface BoardData { entries: BoardEntry[]; activity: ActivityEntry[]; serverTime: string }

const COLORS = ["#7dff97", "#ffbd59", "#64dfe5", "#ff7b70", "#bd9cff", "#f28fc2", "#a6d56f", "#f2f0a1"];
const timeText = (value: string) => new Date(value).toLocaleString("zh-TW", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

function ScoreChart({ entries }: { entries: BoardEntry[] }) {
  const series = entries.filter((entry) => entry.events.length > 0).slice(0, 8);
  const times = series.flatMap((entry) => entry.events.map((event) => Date.parse(event.clearedAt)));
  const min = Math.min(...times);
  const max = Math.max(...times);
  const x = (time: string) => 52 + ((Date.parse(time) - min) / Math.max(1, max - min)) * 828;
  const y = (score: number) => 270 - (score / 100) * 228;

  if (series.length === 0) return <div className="board-empty">尚無解關軌跡，等待第一筆訊號。</div>;
  return (
    <div className="score-chart-wrap">
      <svg className="score-chart" viewBox="0 0 920 310" role="img" aria-label="學生累積分數折線圖">
        {[0, 25, 50, 75, 100].map((score) => <g key={score}><line x1="52" x2="900" y1={y(score)} y2={y(score)} /><text x="8" y={y(score) + 4}>{score}</text></g>)}
        {series.map((entry, index) => {
          const points = entry.events.map((event) => `${x(event.clearedAt)},${y(event.score)}`).join(" ");
          return <g key={`${entry.nickname}-${index}`} style={{ color: COLORS[index] }}>
            <polyline points={points} />
            {entry.events.map((event) => <circle key={`${event.level}-${event.clearedAt}`} cx={x(event.clearedAt)} cy={y(event.score)} r="4"><title>{entry.nickname} 第 {event.level} 關：{event.score} 分 / {timeText(event.clearedAt)}</title></circle>)}
          </g>;
        })}
      </svg>
      <div className="chart-legend">{series.map((entry, index) => <span key={`${entry.nickname}-${index}`}><i style={{ background: COLORS[index] }} />{entry.nickname}</span>)}</div>
    </div>
  );
}

export function Scoreboard() {
  const [data, setData] = useState<BoardData>({ entries: [], activity: [], serverTime: "" });
  const [status, setStatus] = useState<"loading" | "ready" | "offline">("loading");
  const load = useCallback(async () => {
    try {
      const response = await fetch("/.netlify/functions/scoreboard");
      if (!response.ok) throw new Error("scoreboard unavailable");
      setData(await response.json() as BoardData);
      setStatus("ready");
    } catch { setStatus("offline"); }
  }, []);
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(timer);
  }, [load]);
  const latest = useMemo(() => data.activity[0]?.clearedAt, [data.activity]);

  return <main className="scoreboard-screen">
    <header className="board-topbar">
      <a href="/"><ArrowLeft size={17} /> 返回挑戰</a>
      <div><span>MPU-45 / LIVE SCORE FEED</span><h1>班級即時記分板</h1></div>
      <button type="button" onClick={() => void load()}><RefreshCw size={16} /> 更新</button>
    </header>

    <section className="board-summary">
      <article><Trophy /><span>參賽人數</span><strong>{data.entries.length}</strong></article>
      <article><Activity /><span>解關事件</span><strong>{data.activity.length}</strong></article>
      <article><Clock3 /><span>最後解題</span><strong>{latest ? timeText(latest) : "--"}</strong></article>
      <p className={`live-signal live-signal--${status}`}><i />{status === "ready" ? "LIVE / 每 15 秒更新" : status === "loading" ? "正在接收訊號" : "連線中斷"}</p>
    </section>

    {status === "offline" && <div className="board-offline"><WifiOff /> 無法取得 Netlify 記分板資料，稍後會自動重試。</div>}
    <div className="board-layout">
      <section className="board-panel board-ranking">
        <div className="board-panel__head"><div><span>STANDINGS</span><h2>目前排名</h2></div><small>先比分數，再比通關數</small></div>
        {status === "ready" && data.entries.length === 0 ? <div className="board-empty">目前還沒有學生完成關卡。</div> : <div className="board-table-wrap"><table><thead><tr><th>名次</th><th>玩家</th><th>進度</th><th>目前分數</th><th>最後更新</th></tr></thead><tbody>{data.entries.map((entry) => <tr key={`${entry.nickname}-${entry.updatedAt}`}><td><b>#{String(entry.rank).padStart(2, "0")}</b></td><td>{entry.nickname}</td><td><span className="solve-pips">{Array.from({ length: 8 }, (_, index) => <i className={index < entry.solved ? "is-solved" : ""} key={index} />)}</span><small>{entry.solved}/8</small></td><td><strong>{entry.score}</strong></td><td><time>{timeText(entry.updatedAt)}</time></td></tr>)}</tbody></table></div>}
      </section>

      <section className="board-panel board-activity">
        <div className="board-panel__head"><div><span>SOLVE FEED</span><h2>解關動態</h2></div><small>時間 / 玩家 / 關卡</small></div>
        <ol>{data.activity.slice(0, 20).map((event, index) => <li key={`${event.nickname}-${event.clearedAt}-${index}`}><time>{timeText(event.clearedAt)}</time><div><b>{event.nickname}</b><span>突破 {LEVEL_TITLES[event.level - 1] ?? `第 ${event.level} 關`}</span></div><strong>+{event.points}<small> / {event.score}</small></strong></li>)}</ol>
      </section>
    </div>

    <section className="board-panel board-chart-panel">
      <div className="board-panel__head"><div><span>SCORE TRAJECTORY</span><h2>累積分數軌跡</h2></div><small>顯示前 8 名，停在節點可查看解關時間</small></div>
      <ScoreChart entries={data.entries} />
    </section>
  </main>;
}

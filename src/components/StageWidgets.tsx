import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, GripVertical, LockKeyhole, RotateCcw, X } from "lucide-react";
import type {
  ChoiceQuestion,
  ClassifyQuestion,
  HotspotQuestion,
  MatchQuestion,
  NumericQuestion,
  OrderQuestion,
  ScoredQuestion,
} from "../../shared/questions";
import type { AnswerRecord } from "../lib/game";

interface InteractionProps {
  questions: ScoredQuestion[];
  drafts: Record<string, string>;
  records: Record<string, AnswerRecord>;
  checked: boolean;
  seed: string;
  onAnswer: (questionId: string, value: string) => void;
}

const seededHash = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const stableShuffle = <T,>(values: T[], seed: string) =>
  [...values].sort((a, b) => seededHash(`${seed}-${String(a)}`) - seededHash(`${seed}-${String(b)}`));

const StatusMark = ({ record, checked }: { record?: AnswerRecord; checked: boolean }) => {
  if (!checked || !record) return null;
  return record.isCorrect ? (
    <span className="status-mark status-mark--correct"><Check size={15} /> 校正完成</span>
  ) : (
    <span className="status-mark status-mark--wrong"><X size={15} /> 訊號錯誤</span>
  );
};

const Feedback = ({ question, record, checked }: { question: ScoredQuestion; record?: AnswerRecord; checked: boolean }) => {
  if (!checked || !record) return null;
  return (
    <div className={`feedback ${record.isCorrect ? "feedback--correct" : "feedback--wrong"}`} role="status">
      <div>
        <strong>{record.isCorrect ? "PASS" : `提示：${question.mnemonic}`}</strong>
        <p>{record.isCorrect ? question.explanation : "修正答案後再次啟動檢查；第一次答案仍會保留計分。"}</p>
      </div>
      {!record.isCorrect && <span className="feedback__target">目標答案：{question.correctAnswer}</span>}
    </div>
  );
};

function OrderBoard({ question, draft, record, checked, seed, onAnswer }: {
  question: OrderQuestion;
  draft: string;
  record?: AnswerRecord;
  checked: boolean;
  seed: string;
  onAnswer: (id: string, value: string) => void;
}) {
  const initial = useMemo(() => {
    const shuffled = stableShuffle(question.items, `${seed}-${question.id}`);
    return shuffled.join("|") === question.correctAnswer ? [...shuffled.slice(1), shuffled[0]] : shuffled;
  }, [question, seed]);
  const order = draft ? draft.split("|") : initial;
  const [dragged, setDragged] = useState<number | null>(null);
  const locked = checked && record?.isCorrect;

  useEffect(() => {
    if (!draft) onAnswer(question.id, initial.join("|"));
  }, [draft, initial, onAnswer, question.id]);

  const commit = (next: string[]) => onAnswer(question.id, next.join("|"));
  const move = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (locked || destination < 0 || destination >= order.length) return;
    const next = [...order];
    [next[index], next[destination]] = [next[destination], next[index]];
    commit(next);
  };

  const dropAt = (index: number) => {
    if (dragged === null || dragged === index || locked) return;
    const next = [...order];
    const [item] = next.splice(dragged, 1);
    next.splice(index, 0, item);
    setDragged(null);
    commit(next);
  };

  return (
    <section className="interaction-block order-board" aria-labelledby={`${question.id}-title`}>
      <div className="interaction-heading">
        <div>
          <span className="eyebrow">SPEED LADDER</span>
          <h3 id={`${question.id}-title`}>{question.prompt}</h3>
        </div>
        <StatusMark checked={checked} record={record} />
      </div>
      <ol className="order-list">
        {order.map((item, index) => (
          <li
            key={item}
            className="order-item"
            draggable={!locked}
            onDragStart={() => setDragged(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => dropAt(index)}
          >
            <span className="order-item__rank">{String(index + 1).padStart(2, "0")}</span>
            <GripVertical aria-hidden="true" />
            <strong>{item}</strong>
            <div className="order-item__controls">
              <button type="button" onClick={() => move(index, -1)} disabled={locked || index === 0} aria-label={`將 ${item} 上移`}>
                <ArrowUp size={16} />
              </button>
              <button type="button" onClick={() => move(index, 1)} disabled={locked || index === order.length - 1} aria-label={`將 ${item} 下移`}>
                <ArrowDown size={16} />
              </button>
            </div>
          </li>
        ))}
      </ol>
      <p className="interaction-help">拖曳排序，或使用每列右側按鈕。最上方代表最快。</p>
      <Feedback question={question} record={record} checked={checked} />
    </section>
  );
}

function RoutingBoard({ questions, drafts, records, checked, onAnswer, mode }: {
  questions: Array<ClassifyQuestion | MatchQuestion>;
  drafts: Record<string, string>;
  records: Record<string, AnswerRecord>;
  checked: boolean;
  onAnswer: (id: string, value: string) => void;
  mode: "route" | "match";
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const categories = [...new Set(questions.flatMap((question) => question.kind === "classify" ? question.categories : question.options))];

  const assign = (question: ClassifyQuestion | MatchQuestion, category: string) => {
    if (checked && records[question.id]?.isCorrect) return;
    const allowed = question.kind === "classify" ? question.categories : question.options;
    if (allowed.includes(category)) onAnswer(question.id, category);
  };

  const drop = (category: string) => {
    const question = questions.find((candidate) => candidate.id === draggedId);
    if (question) assign(question, category);
    setDraggedId(null);
  };

  return (
    <section className={`interaction-block routing-board routing-board--${mode}`}>
      <div className="interaction-heading">
        <div>
          <span className="eyebrow">{mode === "route" ? "SIGNAL ROUTER" : "MEMORY LINKER"}</span>
          <h3>{questions[0]?.prompt}</h3>
        </div>
        <span className="board-counter">{questions.filter((question) => drafts[question.id]).length}/{questions.length} 已配置</span>
      </div>

      <div className="routing-pool" aria-label="待配置項目">
        {questions.map((question) => {
          const assigned = drafts[question.id];
          const record = records[question.id];
          const locked = checked && record?.isCorrect;
          return (
            <article
              key={question.id}
              className={`route-card ${assigned ? "route-card--assigned" : ""} ${locked ? "route-card--locked" : ""}`}
              draggable={!locked}
              onDragStart={() => setDraggedId(question.id)}
            >
              <div className="route-card__topline">
                <span>{question.id.toUpperCase()}</span>
                {locked && <LockKeyhole size={14} aria-label="答案已鎖定" />}
              </div>
              <strong>{question.item}</strong>
              {assigned && <span className="route-card__assignment">→ {assigned}</span>}
              <div className="route-card__buttons" aria-label={`${question.item} 的配置選項`}>
                {(question.kind === "classify" ? question.categories : question.options).map((category) => (
                  <button
                    type="button"
                    key={category}
                    className={assigned === category ? "is-selected" : ""}
                    disabled={locked}
                    onClick={() => assign(question, category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <StatusMark checked={checked} record={record} />
              {checked && record && !record.isCorrect && (
                <p className="route-card__hint">提示：{question.mnemonic}</p>
              )}
            </article>
          );
        })}
      </div>

      <div className="routing-targets" aria-label="拖曳目標區">
        {categories.map((category) => (
          <div
            key={category}
            className="route-target"
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => drop(category)}
          >
            <span>{category}</span>
            <b>{questions.filter((question) => drafts[question.id] === category).length}</b>
          </div>
        ))}
      </div>
      <p className="interaction-help">可拖到下方目標，也可直接使用卡片按鈕完成鍵盤操作。</p>
    </section>
  );
}

function StandardQuestion({ question, draft, record, checked, seed, onAnswer }: {
  question: ChoiceQuestion | NumericQuestion;
  draft: string;
  record?: AnswerRecord;
  checked: boolean;
  seed: string;
  onAnswer: (id: string, value: string) => void;
}) {
  const locked = checked && record?.isCorrect;
  const options = question.kind === "choice" && question.shuffle
    ? stableShuffle(question.options, `${seed}-${question.id}`)
    : question.kind === "choice" ? question.options : [];

  return (
    <section className={`question-panel ${checked && record ? (record.isCorrect ? "is-correct" : "is-wrong") : ""}`}>
      <div className="question-panel__number">{question.id.toUpperCase()}</div>
      <div className="question-panel__body">
        <div className="question-panel__prompt">
          <h3>{question.prompt}</h3>
          <StatusMark checked={checked} record={record} />
        </div>
        {question.kind === "choice" ? (
          <div className="choice-grid">
            {options.map((option, index) => (
              <button
                type="button"
                key={option}
                className={`choice-button ${draft === option ? "is-selected" : ""}`}
                disabled={locked}
                onClick={() => onAnswer(question.id, option)}
              >
                <span>{String.fromCharCode(65 + index)}</span>
                {option}
              </button>
            ))}
          </div>
        ) : (
          <label className="numeric-entry">
            <span className="sr-only">{question.prompt}</span>
            <input
              type="text"
              inputMode={question.unit ? "decimal" : "text"}
              value={draft}
              disabled={locked}
              placeholder={question.placeholder ?? "輸入答案"}
              onChange={(event) => onAnswer(question.id, event.target.value)}
            />
            {question.unit && <span>{question.unit}</span>}
          </label>
        )}
        <Feedback question={question} record={record} checked={checked} />
      </div>
    </section>
  );
}

function CpuInspector({ questions, drafts, records, checked, onAnswer }: {
  questions: HotspotQuestion[];
  drafts: Record<string, string>;
  records: Record<string, AnswerRecord>;
  checked: boolean;
  onAnswer: (id: string, value: string) => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  return (
    <div className="cpu-inspector">
      <section className="cpu-image-panel">
        <div className="cpu-image-panel__header">
          <div><span className="live-dot" /> SOURCE IMAGE / CPU-Z</div>
          <button type="button" onClick={() => setZoomed((value) => !value)}>
            {zoomed ? <RotateCcw size={16} /> : "+"} {zoomed ? "縮回" : "放大檢視"}
          </button>
        </div>
        <div className={`cpu-image-frame ${zoomed ? "is-zoomed" : ""}`}>
          <img src="/cpu-z-intel-core-i7-12700k.png" alt="Intel Core i7-12700K 的 CPU-Z 資訊截圖" />
        </div>
      </section>
      <section className="cpu-readout" aria-label="CPU-Z 數值輸入">
        {questions.map((question, index) => {
          const record = records[question.id];
          const locked = checked && record?.isCorrect;
          return (
            <label className={`readout-field ${checked && record ? (record.isCorrect ? "is-correct" : "is-wrong") : ""}`} key={question.id}>
              <span className="readout-field__index">{String(index + 1).padStart(2, "0")}</span>
              <span className="readout-field__label">{question.fieldLabel}</span>
              <span className="readout-field__input">
                <input
                  type="text"
                  inputMode="decimal"
                  value={drafts[question.id] ?? ""}
                  disabled={locked}
                  onChange={(event) => onAnswer(question.id, event.target.value)}
                />
                <b>{question.unit}</b>
              </span>
              <StatusMark checked={checked} record={record} />
              {checked && record && !record.isCorrect && <small>{question.mnemonic}</small>}
            </label>
          );
        })}
      </section>
    </div>
  );
}

export function StageWidgets({ questions, drafts, records, checked, seed, onAnswer }: InteractionProps) {
  const classify = questions.filter((question): question is ClassifyQuestion => question.kind === "classify");
  const matches = questions.filter((question): question is MatchQuestion => question.kind === "match");
  const order = questions.find((question): question is OrderQuestion => question.kind === "order");
  const hotspots = questions.filter((question): question is HotspotQuestion => question.kind === "hotspot");
  const standard = questions.filter((question): question is ChoiceQuestion | NumericQuestion =>
    question.kind === "choice" || question.kind === "numeric",
  );

  return (
    <div className="stage-widgets">
      {classify.length > 0 && (
        <RoutingBoard questions={classify} drafts={drafts} records={records} checked={checked} onAnswer={onAnswer} mode="route" />
      )}
      {matches.length > 0 && (
        <RoutingBoard questions={matches} drafts={drafts} records={records} checked={checked} onAnswer={onAnswer} mode="match" />
      )}
      {order && (
        <OrderBoard
          question={order}
          draft={drafts[order.id] ?? ""}
          record={records[order.id]}
          checked={checked}
          seed={seed}
          onAnswer={onAnswer}
        />
      )}
      {hotspots.length > 0 && (
        <CpuInspector questions={hotspots} drafts={drafts} records={records} checked={checked} onAnswer={onAnswer} />
      )}
      {standard.map((question) => (
        <StandardQuestion
          key={question.id}
          question={question}
          draft={drafts[question.id] ?? ""}
          record={records[question.id]}
          checked={checked}
          seed={seed}
          onAnswer={onAnswer}
        />
      ))}
    </div>
  );
}

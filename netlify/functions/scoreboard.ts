import { getStore } from "@netlify/blobs";
import { aggregateScoreboard, type ProgressRecord, type ScoreRecord } from "../shared/leaderboard";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=10, stale-while-revalidate=20" },
});

const readPrefix = async <T>(store: ReturnType<typeof getStore>, prefix: string) => {
  const listing = await store.list({ prefix, paginate: true });
  const keys: string[] = [];
  for await (const page of listing) keys.push(...page.blobs.map((blob) => blob.key));
  const records: T[] = [];
  for (const key of keys) {
    const record = await store.get(key, { type: "json" }) as T | null;
    if (record) records.push(record);
  }
  return records;
};

export default async (request: Request) => {
  if (request.method !== "GET") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  const store = getStore({ name: "mpu49-leaderboard", consistency: "strong" });
  const [progress, completed] = await Promise.all([
    readPrefix<ProgressRecord>(store, "progress/"),
    readPrefix<ScoreRecord>(store, "attempts/"),
  ]);
  return json(aggregateScoreboard(progress, completed));
};

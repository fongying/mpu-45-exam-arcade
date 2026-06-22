import { getStore } from "@netlify/blobs";
import { aggregateLeaderboard, type ScoreRecord } from "../shared/leaderboard";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "public, max-age=15, stale-while-revalidate=30",
  },
});

export default async (request: Request) => {
  if (request.method !== "GET") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(50, Math.floor(requestedLimit))) : 20;
  const store = getStore({ name: "mpu49-leaderboard", consistency: "strong" });
  const listing = await store.list({ prefix: "attempts/", paginate: true });
  const blobs: Array<{ key: string }> = [];
  for await (const page of listing) blobs.push(...page.blobs);
  const records = (await Promise.all(
    blobs.map(({ key }) => store.get(key, { type: "json" }) as Promise<ScoreRecord | null>),
  )).filter((record): record is ScoreRecord => Boolean(record));

  return json({ entries: aggregateLeaderboard(records, limit) });
};

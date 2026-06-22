import { getStore } from "@netlify/blobs";
import { validateProgressSubmission } from "../shared/leaderboard";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

export default async (request: Request) => {
  if (request.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  let body: unknown;
  try { body = await request.json(); } catch { return json({ error: "INVALID_JSON" }, 400); }
  const validation = validateProgressSubmission(body);
  if (!validation.ok) return json({ error: validation.error }, 400);

  const store = getStore({ name: "mpu49-leaderboard", consistency: "strong" });
  await store.setJSON(`progress/${validation.record.attemptId}`, validation.record);
  return json({ accepted: true, score: validation.record.score, solved: validation.record.solved }, 201);
};

import { getStore } from "@netlify/blobs";
import { validateSubmission } from "./_lib";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  },
});

export default async (request: Request) => {
  if (request.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 40_000) return json({ error: "PAYLOAD_TOO_LARGE" }, 413);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "INVALID_JSON" }, 400);
  }

  const validation = validateSubmission(body);
  if (!validation.ok) return json({ error: validation.error }, 400);

  const store = getStore({ name: "mpu49-leaderboard", consistency: "strong" });
  const key = `attempts/${validation.record.attemptId}`;
  const existing = await store.get(key, { type: "json" });
  if (existing) return json({ error: "ATTEMPT_ALREADY_SUBMITTED" }, 409);

  await store.setJSON(key, validation.record);
  return json({
    accepted: true,
    score: validation.record.score,
    correct: validation.record.correct,
    total: validation.record.total,
  }, 201);
};

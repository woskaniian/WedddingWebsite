// Cloudflare Pages Function — shared storage for the /tables seating plan.
//
// Setup (Cloudflare dashboard → your Pages project → Settings → Functions):
//   1. KV namespace bindings → add binding, Variable name: KV, pick/create a namespace.
//   2. (optional, for protection) Environment variables → KV_TOKEN = your password.
//      When set, requests must send "Authorization: Bearer <token>"; when unset, the API is open.
//
// Routes (same origin as the site):
//   GET  /api/seating  → { rev, updatedAt, data }   (data is null when nothing stored yet)
//   PUT  /api/seating  → body { baseRev, data, force? } ; 409 {conflict,...} if someone else wrote.

const KEY = "layout";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function authed(request, env) {
  const need = env.KV_TOKEN;
  if (!need) return true; // token not configured → open
  const got = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  return got === need;
}

export async function onRequestGet({ request, env }) {
  if (!env.KV) return json({ error: "KV binding 'KV' is missing" }, 501);
  if (!authed(request, env)) return json({ error: "unauthorized" }, 401);
  const raw = await env.KV.get(KEY);
  if (!raw) return json({ rev: 0, updatedAt: null, data: null });
  let v;
  try { v = JSON.parse(raw); } catch (e) { v = { rev: 0, data: null }; }
  return json({ rev: v.rev || 0, updatedAt: v.updatedAt || null, data: v.data || null });
}

export async function onRequestPut({ request, env }) {
  if (!env.KV) return json({ error: "KV binding 'KV' is missing" }, 501);
  if (!authed(request, env)) return json({ error: "unauthorized" }, 401);

  let body;
  try { body = await request.json(); } catch (e) { return json({ error: "bad json" }, 400); }
  const data = body && body.data;
  if (data == null) return json({ error: "missing data" }, 400);

  const baseRev = Number(body.baseRev) || 0;
  const force = body.force === true;

  const raw = await env.KV.get(KEY);
  const cur = raw ? JSON.parse(raw) : { rev: 0, data: null };

  if (!force && (cur.rev || 0) !== baseRev) {
    // Someone else saved since this client last synced — let the client decide.
    return json({ conflict: true, rev: cur.rev || 0, updatedAt: cur.updatedAt || null, data: cur.data || null }, 409);
  }

  const next = { rev: (cur.rev || 0) + 1, updatedAt: new Date().toISOString(), by: String(body.by || ""), data };
  await env.KV.put(KEY, JSON.stringify(next));
  return json({ rev: next.rev, updatedAt: next.updatedAt });
}

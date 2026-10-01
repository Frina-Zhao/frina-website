// /api/profile-photo（个人头像 — 单值）
//   GET  公开
//   PUT  需认证
import { json, err } from './utils/response.js';
import { requireAdmin } from './utils/auth.js';

export async function onRequestGet({ env }) {
  const row = await env.DB.prepare(
    'SELECT url, updated_at FROM profile_photo WHERE id = 1'
  ).first();
  return json({ photo: row || null });
}

export async function onRequestPut({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (!admin) return err('未登录', 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return err('请求体不是合法 JSON');
  }
  const url = (body.url || '').toString().slice(0, 500);
  if (!url) return err('缺少 url');

  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    'INSERT OR REPLACE INTO profile_photo (id, url, updated_at) VALUES (1, ?, ?)'
  )
    .bind(url, now)
    .run();

  return json({ ok: true, photo: { url, updated_at: now } });
}
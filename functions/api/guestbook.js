// /api/guestbook
//   GET   公开 — 拉留言列表（按时间倒序）
//   POST  公开 — 发留言
//   DELETE 需认证 — 删除单条（按 ?id=xxx）
import { json, err } from './utils/response.js';
import { requireAdmin, newId } from './utils/auth.js';

export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '200', 10), 500);
  const { results } = await env.DB.prepare(
    'SELECT id, author, avatar_hash, message, created_at FROM guestbook ORDER BY created_at DESC LIMIT ?'
  )
    .bind(limit)
    .all();
  return json({ messages: results });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return err('请求体不是合法 JSON');
  }

  const author = (body.author || '').toString().trim().slice(0, 32);
  const message = (body.message || '').toString().trim().slice(0, 600);
  const avatarHash = (body.avatarHash || '').toString().slice(0, 16) || 'frina';

  if (!author) return err('请填写昵称');
  if (!message) return err('请填写留言内容');

  const id = newId('msg');
  const created_at = Math.floor(Date.now() / 1000);

  await env.DB.prepare(
    'INSERT INTO guestbook (id, author, avatar_hash, message, created_at) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(id, author, avatarHash, message, created_at)
    .run();

  return json({ ok: true, message: { id, author, avatar_hash: avatarHash, message, created_at } });
}

export async function onRequestDelete({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (!admin) return err('未登录', 401);

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return err('缺少 id');

  await env.DB.prepare('DELETE FROM guestbook WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
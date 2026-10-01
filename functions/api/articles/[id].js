// /api/articles/[id]
//   GET    公开 — 取单篇
//   PUT    需认证 — 更新
//   DELETE 需认证 — 删除
import { json, err } from './utils/response.js';
import { requireAdmin } from './utils/auth.js';

export async function onRequestGet({ env, params }) {
  const row = await env.DB.prepare(
    'SELECT id, type, category, title, body, cover_url, photo_urls, sort_order, created_at, updated_at FROM articles WHERE id = ?'
  )
    .bind(params.id)
    .first();
  if (!row) return err('文章不存在', 404);
  try {
    row.photo_urls = row.photo_urls ? JSON.parse(row.photo_urls) : [];
  } catch {
    row.photo_urls = [];
  }
  return json({ article: row });
}

export async function onRequestPut({ request, env, params }) {
  const admin = await requireAdmin(request, env);
  if (!admin) return err('未登录', 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return err('请求体不是合法 JSON');
  }
  const existing = await env.DB.prepare('SELECT id FROM articles WHERE id = ?')
    .bind(params.id)
    .first();
  if (!existing) return err('文章不存在', 404);

  const fields = [];
  const args = [];

  if (typeof body.title === 'string') {
    fields.push('title = ?');
    args.push(body.title.trim().slice(0, 200));
  }
  if (typeof body.body === 'string') {
    fields.push('body = ?');
    args.push(body.body.slice(0, 50000));
  }
  if (typeof body.category === 'string') {
    fields.push('category = ?');
    args.push(body.category.slice(0, 64) || null);
  }
  if (typeof body.coverUrl === 'string') {
    fields.push('cover_url = ?');
    args.push(body.coverUrl.slice(0, 500) || null);
  }
  if (Array.isArray(body.photoUrls)) {
    fields.push('photo_urls = ?');
    args.push(JSON.stringify(body.photoUrls.slice(0, 20)));
  }
  if (typeof body.sortOrder === 'number') {
    fields.push('sort_order = ?');
    args.push(body.sortOrder);
  }
  if (!fields.length) return err('没有要更新的字段');

  fields.push('updated_at = ?');
  args.push(Math.floor(Date.now() / 1000));
  args.push(params.id);

  await env.DB.prepare(
    'UPDATE articles SET ' + fields.join(', ') + ' WHERE id = ?'
  )
    .bind(...args)
    .run();

  return json({ ok: true });
}

export async function onRequestDelete({ request, env, params }) {
  const admin = await requireAdmin(request, env);
  if (!admin) return err('未登录', 401);

  await env.DB.prepare('DELETE FROM articles WHERE id = ?').bind(params.id).run();
  return json({ ok: true });
}
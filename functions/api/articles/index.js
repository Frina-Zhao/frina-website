// /api/articles
//   GET   公开 — 按 ?type=study|life|hobby|couple_log 过滤列表
//   POST  需认证 — 新建文章
import { json, err } from './utils/response.js';
import { requireAdmin, newId } from './utils/auth.js';

const VALID_TYPES = ['study', 'life', 'hobby', 'couple_log'];

export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const category = url.searchParams.get('category');

  let sql =
    'SELECT id, type, category, title, body, cover_url, photo_urls, sort_order, created_at, updated_at FROM articles';
  const conds = [];
  const args = [];

  if (type) {
    if (!VALID_TYPES.includes(type)) return err('type 非法');
    conds.push('type = ?');
    args.push(type);
  }
  if (category) {
    conds.push('category = ?');
    args.push(category);
  }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  sql += ' ORDER BY created_at DESC LIMIT 500';

  const stmt = args.length
    ? env.DB.prepare(sql).bind(...args)
    : env.DB.prepare(sql);
  const { results } = await stmt.all();
  // photo_urls 解析回数组
  for (const r of results) {
    try {
      r.photo_urls = r.photo_urls ? JSON.parse(r.photo_urls) : [];
    } catch {
      r.photo_urls = [];
    }
  }
  return json({ articles: results });
}

export async function onRequestPost({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (!admin) return err('未登录', 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return err('请求体不是合法 JSON');
  }
  const type = (body.type || '').toString();
  if (!VALID_TYPES.includes(type)) return err('type 非法');

  const title = (body.title || '').toString().trim().slice(0, 200);
  if (!title) return err('标题不能为空');
  const bodyText = (body.body || '').toString().slice(0, 50000);
  const category = (body.category || '').toString().slice(0, 64) || null;
  const coverUrl = (body.coverUrl || '').toString().slice(0, 500) || null;
  const photoUrls = Array.isArray(body.photoUrls) ? body.photoUrls.slice(0, 20) : [];

  const id = newId('art');
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    'INSERT INTO articles (id, type, category, title, body, cover_url, photo_urls, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)'
  )
    .bind(id, type, category, title, bodyText, coverUrl, JSON.stringify(photoUrls), now, now)
    .run();

  return json({
    ok: true,
    article: {
      id,
      type,
      category,
      title,
      body: bodyText,
      cover_url: coverUrl,
      photo_urls: photoUrls,
      created_at: now,
      updated_at: now,
    },
  });
}
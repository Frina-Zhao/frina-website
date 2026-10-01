// /api/features（兴趣爱好 · 最近沉迷）
//   GET    公开 — 拉卡片列表
//   POST   需认证 — 新建
//   PUT    需认证 — 按 ?id= 更新
//   DELETE 需认证 — 按 ?id= 删除
import { json, err } from './utils/response.js';
import { requireAdmin, newId } from './utils/auth.js';

const ICONS = new Set([
  'book', 'music', 'controller', 'globe', 'coffee', 'camera',
  'palette', 'mountain', 'plant', 'pencil', 'bulb', 'film',
]);

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    'SELECT id, icon, title, description, sort_order, created_at FROM features ORDER BY sort_order ASC, created_at DESC'
  ).all();
  return json({ features: results });
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
  const icon = (body.icon || '').toString();
  if (!ICONS.has(icon)) return err('icon 非法');
  const title = (body.title || '').toString().trim().slice(0, 80);
  if (!title) return err('标题不能为空');
  const description = (body.description || '').toString().slice(0, 240);

  const id = newId('feat');
  const now = Math.floor(Date.now() / 1000);
  const sort = Number.isFinite(body.sort_order) ? body.sort_order : now;

  await env.DB.prepare(
    'INSERT INTO features (id, icon, title, description, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(id, icon, title, description, sort, now)
    .run();

  return json({ ok: true, feature: { id, icon, title, description, sort_order: sort, created_at: now } });
}

export async function onRequestPut({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (!admin) return err('未登录', 401);

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return err('缺少 id');

  let body;
  try {
    body = await request.json();
  } catch {
    return err('请求体不是合法 JSON');
  }

  const fields = [];
  const args = [];
  if (typeof body.icon === 'string') {
    if (!ICONS.has(body.icon)) return err('icon 非法');
    fields.push('icon = ?');
    args.push(body.icon);
  }
  if (typeof body.title === 'string') {
    fields.push('title = ?');
    args.push(body.title.trim().slice(0, 80));
  }
  if (typeof body.description === 'string') {
    fields.push('description = ?');
    args.push(body.description.slice(0, 240));
  }
  if (typeof body.sort_order === 'number') {
    fields.push('sort_order = ?');
    args.push(body.sort_order);
  }
  if (!fields.length) return err('没有要更新的字段');

  args.push(id);
  await env.DB.prepare(
    'UPDATE features SET ' + fields.join(', ') + ' WHERE id = ?'
  )
    .bind(...args)
    .run();
  return json({ ok: true });
}

export async function onRequestDelete({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (!admin) return err('未登录', 401);

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return err('缺少 id');

  await env.DB.prepare('DELETE FROM features WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
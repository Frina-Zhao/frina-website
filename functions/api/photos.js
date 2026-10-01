// /api/photos（首页墙 / 情侣照）
//   GET    公开 — 按 ?group=index|couple 过滤
//   POST   需认证 — 新增（url 由前端 FileUpload 上传 R2 后传回）
//   DELETE 需认证 — 按 ?id= 删除
import { json, err } from './utils/response.js';
import { requireAdmin, newId } from './utils/auth.js';

const VALID_GROUPS = ['index', 'couple'];

export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const group = url.searchParams.get('group');

  let sql =
    'SELECT id, group_name, url, caption, sort_order, created_at FROM photos';
  const args = [];
  if (group) {
    if (!VALID_GROUPS.includes(group)) return err('group 非法');
    sql += ' WHERE group_name = ?';
    args.push(group);
  }
  sql += ' ORDER BY sort_order ASC, created_at DESC LIMIT 500';

  const stmt = args.length
    ? env.DB.prepare(sql).bind(...args)
    : env.DB.prepare(sql);
  const { results } = await stmt.all();
  return json({ photos: results });
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
  const group = (body.group || '').toString();
  if (!VALID_GROUPS.includes(group)) return err('group 非法');
  const url = (body.url || '').toString().slice(0, 500);
  if (!url) return err('缺少 url');
  const caption = (body.caption || '').toString().slice(0, 200);

  const id = newId('ph');
  const now = Math.floor(Date.now() / 1000);
  const sort = Number.isFinite(body.sort_order) ? body.sort_order : now;

  await env.DB.prepare(
    'INSERT INTO photos (id, group_name, url, caption, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(id, group, url, caption, sort, now)
    .run();

  return json({
    ok: true,
    photo: { id, group_name: group, url, caption, sort_order: sort, created_at: now },
  });
}

export async function onRequestDelete({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (!admin) return err('未登录', 401);

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return err('缺少 id');

  await env.DB.prepare('DELETE FROM photos WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
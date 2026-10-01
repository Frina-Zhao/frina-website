// POST /api/logout — 撤销当前 token
import { json, err } from './utils/response.js';
import { requireAdmin } from './utils/auth.js';
import { sha256Hex } from './utils/jwt.js';

export async function onRequestPost({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (!admin) return err('未登录', 401);

  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token) {
    const tokenHash = await sha256Hex(token);
    await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash = ?')
      .bind(tokenHash)
      .run();
  }
  return json({ ok: true });
}
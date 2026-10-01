// 共享认证工具：从请求头取 JWT → 查 D1 会话表 → 验证签名 → 返回 admin 信息
import { verifyJwt, sha256Hex } from './jwt.js';

export async function requireAdmin(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;

  // 验签
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== 'admin') return null;

  // 查会话表确认 token 没被撤销
  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    'SELECT expires_at FROM admin_sessions WHERE token_hash = ?'
  )
    .bind(tokenHash)
    .first();

  if (!row || row.expires_at < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export function newId(prefix = '') {
  const ts = Date.now().toString(36);
  const rand = crypto.getRandomValues(new Uint8Array(6));
  let r = '';
  for (const b of rand) r += b.toString(16).padStart(2, '0');
  return (prefix ? prefix + '_' : '') + ts + '_' + r;
}
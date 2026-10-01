// POST /api/login — 管理员登录
import { json, err } from './_utils/response.js';
import { hashPassword, verifyPassword, signJwt, sha256Hex } from './_utils/jwt.js';

// 这个端点既负责"登录"，也负责"首次设置密码"
// 如果 admin_config.password_hash 为空，则把传入的 password 设为新密码
export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return err('请求体不是合法 JSON');
  }
  const password = (body.password || '').toString();
  if (!password || password.length < 6) {
    return err('密码至少 6 位');
  }

  const cfg = await env.DB.prepare(
    'SELECT key, value FROM admin_config WHERE key IN (?, ?)'
  )
    .bind('password_hash', 'password_salt')
    .all();

  const hash = cfg.results.find((r) => r.key === 'password_hash')?.value || '';
  const salt = cfg.results.find((r) => r.key === 'password_salt')?.value || '';

  let valid = false;
  if (!hash) {
    // 首次设置密码
    valid = true;
  } else {
    valid = await verifyPassword(password, hash, salt);
  }

  if (!valid) return err('密码错误', 401);

  // 第一次登录：把密码哈希写回
  if (!hash) {
    const { hash: newHash, salt: newSalt } = await hashPassword(password);
    await env.DB.batch([
      env.DB.prepare(
        'INSERT OR REPLACE INTO admin_config (key, value) VALUES (?, ?)'
      ).bind('password_hash', newHash),
      env.DB.prepare(
        'INSERT OR REPLACE INTO admin_config (key, value) VALUES (?, ?)'
      ).bind('password_salt', newSalt),
    ]);
  }

  // 签发 JWT
  const token = await signJwt(
    { role: 'admin', name: 'frina' },
    env.JWT_SECRET,
    30 * 24 * 3600
  );
  const tokenHash = await sha256Hex(token);
  const now = Math.floor(Date.now() / 1000);
  const expires = now + 30 * 24 * 3600;
  await env.DB.prepare(
    'INSERT INTO admin_sessions (token_hash, created_at, expires_at) VALUES (?, ?, ?)'
  )
    .bind(tokenHash, now, expires)
    .run();

  return json({ ok: true, token, expires });
}
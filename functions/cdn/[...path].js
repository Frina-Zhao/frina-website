// /cdn/* — Pages Function 代理 R2 对象
// 私有 bucket 也能给前端访问，不用开 R2 Public Access
// 用 URL 路径作为 R2 key，例：/cdn/index/foo.jpg → R2 key: index/foo.jpg
export async function onRequestGet({ env, params }) {
  const key = (params.path || []).join('/');
  if (!key || key.includes('..')) {
    return new Response('Bad Request', { status: 400 });
  }

  const obj = await env.PHOTOS.get(key);
  if (!obj) return new Response('Not Found', { status: 404 });

  const headers = new Headers();
  const contentType =
    (obj.httpMetadata && obj.httpMetadata.contentType) || 'application/octet-stream';
  headers.set('Content-Type', contentType);

  // 1 年强缓存 + immutable（key 含时间戳/随机数，永不冲突）
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('Access-Control-Allow-Origin', '*');
  if (obj.etag) headers.set('ETag', obj.etag);
  headers.set('Content-Length', String(obj.size || 0));

  return new Response(obj.body, { status: 200, headers });
}

// CORS 预检
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function onRequest({ params, env }) {
  // 其他方法不允许
  return new Response('Method Not Allowed', { status: 405 });
}
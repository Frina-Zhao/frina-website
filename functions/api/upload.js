// /api/upload — 文件上传到 R2（需认证）
// 接受 multipart/form-data 或 application/octet-stream
// 返回 { url } 给前端，再把 url 写到 articles.cover_url / photos.url 等
import { json, err } from './utils/response.js';
import { requireAdmin, newId } from './utils/auth.js';

const MAX_BYTES = 20 * 1024 * 1024; // 20MB 单文件上限

const FOLDER_BY_TYPE = {
  'homepage-photo': 'index',
  'couple-photo': 'couple',
  'profile-photo': 'profile',
  article: 'articles',
};

export async function onRequestPost({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (!admin) return err('未登录', 401);

  const ct = request.headers.get('Content-Type') || '';
  let fileBytes, filename, type;

  if (ct.startsWith('multipart/form-data')) {
    const form = await request.formData();
    const file = form.get('file');
    type = (form.get('type') || '').toString();
    if (!file || typeof file === 'string') return err('缺少 file 字段');
    fileBytes = await file.arrayBuffer();
    filename = file.name || 'upload.bin';
  } else {
    // 直接传 binary：?type=xxx&name=xxx
    const url = new URL(request.url);
    type = url.searchParams.get('type') || '';
    filename = url.searchParams.get('name') || 'upload.bin';
    fileBytes = await request.arrayBuffer();
  }

  if (fileBytes.byteLength > MAX_BYTES) return err('文件超过 20MB');
  if (!type || !FOLDER_BY_TYPE[type]) return err('type 非法');

  const ext = pickExt(filename, request.headers.get('Content-Type'));
  const key = `${FOLDER_BY_TYPE[type]}/${newId('f')}${ext}`;

  await env.PHOTOS.put(key, fileBytes, {
    httpMetadata: { contentType: guessContentType(ext) },
  });

  // URL 模式
  //   1) 如果设置了 PUBLIC_PHOTO_BASE（启用 R2 Public Development URL 后得到的 r2.dev 域名）
  //      → 直接返回 https://pub-xxx.r2.dev/<key>，图片走 R2 CDN，不消耗 Pages Function 请求
  //   2) 否则 → 走 Pages Function /cdn/* 代理（无需启用 R2 公开访问）
  const url = env.PUBLIC_PHOTO_BASE
    ? env.PUBLIC_PHOTO_BASE.replace(/\/$/, '') + '/' + key
    : '/cdn/' + key;
  return json({ ok: true, url, key });
}

function pickExt(filename, contentType) {
  const m = filename.match(/\.[a-z0-9]+$/i);
  if (m) return m[0].toLowerCase();
  if ((contentType || '').includes('jpeg')) return '.jpg';
  if ((contentType || '').includes('png')) return '.png';
  if ((contentType || '').includes('webp')) return '.webp';
  if ((contentType || '').includes('gif')) return '.gif';
  if ((contentType || '').includes('mp4')) return '.mp4';
  return '.bin';
}

function guessContentType(ext) {
  return (
    {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
    }[ext] || 'application/octet-stream'
  );
}
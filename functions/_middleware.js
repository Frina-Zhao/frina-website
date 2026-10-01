// Pages Functions 中间件 — CORS 预检统一处理
import { corsOptions } from './_utils/response.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return corsOptions();
  }
  return context.next();
}
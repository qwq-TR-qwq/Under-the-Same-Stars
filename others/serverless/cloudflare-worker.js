// ============================================================
// 星夜入眠 · AI 后端中转代理（Cloudflare Workers 版）
// 部署：
//   1. wrangler init 后把本文件作为 worker 入口
//   2. wrangler secret put AI_PROXY_KEY / AI_PROXY_MODEL /
//      AI_PROXY_ENDPOINT / AI_PROXY_TOKEN
//   3. 前端 AI 设置面板选「后端中转」，endpoint 填 Worker 地址
// ============================================================

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, X-Proxy-Token',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        }
      });
    }
    if (request.method !== 'POST') {
      return json({ error: { message: 'Method Not Allowed' } }, 405);
    }
    if (env.AI_PROXY_TOKEN && request.headers.get('x-proxy-token') !== env.AI_PROXY_TOKEN) {
      return json({ error: { message: 'Invalid proxy token' } }, 401);
    }
    const KEY = env.AI_PROXY_KEY;
    if (!KEY) return json({ error: { message: 'AI_PROXY_KEY not configured' } }, 500);

    const UPSTREAM = env.AI_PROXY_ENDPOINT || 'https://api.deepseek.com/chat/completions';
    const MODEL = env.AI_PROXY_MODEL || 'deepseek-chat';

    try {
      const body = await request.json();
      body.model = MODEL;
      body.stream = body.stream === true;

      const upstream = await fetch(UPSTREAM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + KEY },
        body: JSON.stringify(body)
      });

      const headers = new Headers({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': body.stream ? 'text/event-stream; charset=utf-8' : 'application/json; charset=utf-8'
      });
      return new Response(upstream.body, { status: upstream.status, headers });
    } catch (e) {
      return json({ error: { message: 'Proxy error: ' + (e && e.message) } }, 500);
    }
  }
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
  });
}

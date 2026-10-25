// ============================================================
// 星夜入眠 · AI 后端中转代理（Vercel / Netlify Functions 通用）
// 作用：前端只调用本代理，真实 API Key 仅存在服务端环境变量，
//       彻底满足大赛"API 密钥不得出现在公开仓库/前端"的要求。
// 部署（Vercel 为例）：
//   1. 把本文件放到项目 api/ai.js（Vercel 自动识别为 Serverless Function）
//   2. 在 Vercel 项目 Settings → Environment Variables 配置：
//        AI_PROXY_KEY / AI_PROXY_MODEL / AI_PROXY_ENDPOINT / AI_PROXY_TOKEN
//   3. 前端 AI 设置面板选择「后端中转」即可（endpoint 自动为 /api/ai）
// 部署（Netlify）：改放到 netlify/functions/ai.js，并把前端 endpoint
//   改为 /.netlify/functions/ai。
// ============================================================

export default async function handler(req, res) {
  // CORS：允许同域与本地调试
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Proxy-Token');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: { message: 'Method Not Allowed' } });

  var TOKEN = process.env.AI_PROXY_TOKEN;
  if (TOKEN && req.headers['x-proxy-token'] !== TOKEN) {
    return res.status(401).json({ error: { message: 'Invalid proxy token' } });
  }

  var UPSTREAM = process.env.AI_PROXY_ENDPOINT || 'https://api.deepseek.com/chat/completions';
  var KEY = process.env.AI_PROXY_KEY;
  if (!KEY) return res.status(500).json({ error: { message: 'AI_PROXY_KEY not configured' } });

  var DEFAULT_MODEL = process.env.AI_PROXY_MODEL || 'deepseek-chat';

  try {
    var body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    // 服务端最终裁定：模型与密钥以前端不可见的服务端配置为准
    body.model = DEFAULT_MODEL;
    body.stream = body.stream === true;

    var upstream = await fetch(UPSTREAM, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + KEY },
      body: JSON.stringify(body)
    });

    if (!upstream.ok) {
      var errText = await upstream.text();
      return res.status(upstream.status).json({ error: { message: 'Upstream ' + upstream.status + ': ' + errText.slice(0, 300) } });
    }

    if (body.stream) {
      // SSE 流式直通
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      var reader = upstream.body.getReader();
      var decoder = new TextDecoder();
      while (true) {
        var chunk = await reader.read();
        if (chunk.done) break;
        res.write(decoder.decode(chunk.value, { stream: true }));
      }
      return res.end();
    }

    var data = await upstream.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: { message: 'Proxy error: ' + (e && e.message) } });
  }
}

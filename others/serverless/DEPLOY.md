# AI 代理部署指南（Cloudflare Worker）

> **部署记录（2026-11-05）**：已部署为 `xyn-ai`，子域 `xyn2026`，地址 `https://xyn-ai.xyn2026.workers.dev`。
> 实测 `*.workers.dev` 在中国大陆被 DNS 污染 + SNI 阻断（解析到 Facebook 网段），**国内无法直连**；
> `*.vercel.app` 同样被污染。因此线上站点暂不启用 `REMOTE_PROXY`（保持留空 = 通道关闭，行为与 v12.5 一致），
> 评委默认走 pollinations 免费接口 → 本地知识库。若日后购入域名，把域名 NS 迁到 Cloudflare 并绑定
> Worker 自定义域后，将新地址填入 `others/js/03-ai-core.js` 顶部的 `REMOTE_PROXY` / `REMOTE_TOKEN` 即可启用。
> Worker 本身免费保留，海外网络可正常访问，健康检查：`GET https://xyn-ai.xyn2026.workers.dev`。

目的：让线上演示站（GitHub Pages 等纯静态托管）在**评委零配置**的情况下就能用真实大模型对话。
Key 只存在 Worker 的环境变量里，前端拿不到，也不进代码仓库。

---

## 一、部署（约 20 分钟）

### 1. 装工具并登录

```bash
npm i -g wrangler
wrangler login          # 浏览器会弹 Cloudflare 授权页，免费账号即可
```

### 2. 部署

在仓库根目录执行：

```bash
wrangler deploy others/serverless/cloudflare-worker.js --name xyn-ai
```

或者进入 `others/serverless/` 后直接 `wrangler deploy`（读同目录的 `wrangler.toml`）。

部署成功会打印一个地址，形如：

```
https://xyn-ai.<你的子域>.workers.dev
```

### 3. 配置密钥（三选三，模型与接口已在 wrangler.toml 里）

```bash
wrangler secret put AI_PROXY_KEY        # 粘贴新的 DeepSeek Key（不要用旧的那个）
wrangler secret put AI_PROXY_TOKEN      # 自己编一串随机口令，例如 xyn-2026-demo-8f3a
```

- `AI_PROXY_KEY`：上游大模型的 Key，只在服务端。
- `AI_PROXY_TOKEN`：前端请求时要带的口令。**它不是密钥**，只是一道防滥用闸门，被别人看到也无法拿去刷别的东西。
- 改完密钥需要重新 deploy 才会生效（`wrangler deploy` 或控制台 Deploy）。

### 4. 验证

浏览器直接打开 Worker 地址（GET），应看到：

```json
{"ok":true,"service":"starry-night-ai-proxy","model":"deepseek-chat","keyConfigured":true,"tokenRequired":true}
```

`keyConfigured: false` 说明 secret 没写进去；`tokenRequired: true` 说明口令已生效。

再用命令行试一次真实补全：

```bash
curl -s https://xyn-ai.<你的子域>.workers.dev \
  -H "Content-Type: application/json" \
  -H "X-Proxy-Token: <你设的口令>" \
  -d '{"messages":[{"role":"user","content":"回复：在线"}],"stream":false}'
```

---

## 二、前端接线（两行常量）

打开 `others/js/03-ai-core.js`，改最上面这两个常量：

```js
var REMOTE_PROXY = 'https://xyn-ai.<你的子域>.workers.dev';  // 末尾不要带斜杠
var REMOTE_TOKEN = 'xyn-2026-demo-8f3a';                     // 与 AI_PROXY_TOKEN 一致
```

保存、推送即可。行为如下：

| 访问方式 | 走哪条通道 |
|---|---|
| 线上域名（`*.github.io` / `*.gitee.io` / `*.pages.dev` / `*.vercel.app` / `*.netlify.app`） | **remote**：服务端代理，访客零配置 |
| `file://` 直接打开、`localhost` | 不干预，仍用本机配置（可填自己的 Key 直连） |
| 线上但代理未配置 / 请求失败 | 自动降级：pollinations 免费接口 → 本地知识库（并明确提示原因） |

> 常量留空 = 该通道关闭，站点行为与改动前完全一致，可安全回退。

---

## 三、国内访问不稳定的应对

`workers.dev` 默认域名在部分国内网络下不通。部署完**先用手机 4G 和家里宽带各开一次**。

不通时的两条退路：

1. **绑自有域名**：Cloudflare 添加域名 → Workers 路由绑定 `ai.你的域名.com/*`，把 `REMOTE_PROXY` 换成该地址（域名需几元/年）。
2. **换国内云函数**：腾讯云 SCF / 阿里云 FC 的 HTTP 触发器，逻辑与 `cloudflare-worker.js` 相同，只需把 `export default { fetch }` 改成各平台的 `exports.main_handler`。前端只改 `REMOTE_PROXY` 一个字符串，无需动别的代码。

---

## 四、成本与限制

| 项 | 免费版 |
|---|---|
| 请求数 | 10 万次/天 |
| 单次 CPU 时间 | 10 ms（纯转发约 1–2 ms） |
| 需要信用卡 / 备案 | 不需要 |

模型侧按调用量计费（DeepSeek 约 ¥1/百万输入 token），一次完整对话几分钱。

---

## 五、安全清单

- [ ] `AI_PROXY_KEY` 只存在于 Worker secret，仓库里搜不到 `sk-`
- [ ] `AI_PROXY_TOKEN` 已设置（否则任何人可拿你的额度刷）
- [ ] 前端常量里出现的是 Worker 地址和口令，**不是**模型 Key
- [ ] 旧 Key 已在控制台吊销
- [ ] `others/.env.example` 里的示例 Key 仍是占位符

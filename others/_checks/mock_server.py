# -*- coding: utf-8 -*-
"""停止按钮复现实验：静态服务 + 慢速 SSE 模拟端点"""
import http.server, socketserver, json, time, threading, os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PORT = 8643

class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_OPTIONS(self):
        self.send_response(204); self.send_header('Access-Control-Allow-Origin','*')
        self.send_header('Access-Control-Allow-Headers','*'); self.send_header('Access-Control-Allow-Methods','*')
        self.end_headers()
    def do_POST(self):
        if '/chat/completions' not in self.path:
            self.send_response(404); self.end_headers(); return
        ln = int(self.headers.get('Content-Length') or 0)
        body = self.rfile.read(ln)
        try: req = json.loads(body)
        except Exception: req = {}
        self.send_response(200)
        self.send_header('Content-Type','text/event-stream; charset=utf-8')
        self.send_header('Cache-Control','no-cache')
        self.end_headers()
        chunks = ['你好','呀，','我','在','这里','陪','你','聊','会','儿','天','。','别','担心','，','慢慢','说。']
        try:
            for c in chunks:
                d = json.dumps({"choices":[{"delta":{"content":c}}]}, ensure_ascii=False)
                self.wfile.write(('data: '+d+'\n\n').encode('utf-8'))
                self.wfile.flush()
                time.sleep(0.15)
            self.wfile.write(b'data: [DONE]\n\n'); self.wfile.flush()
        except Exception:
            pass  # 客户端 abort 断开，正常

class S(socketserver.ThreadingTCPServer):
    allow_reuse_address = True

os.chdir(ROOT)
print('serving', ROOT, 'on', PORT)
S(('127.0.0.1', PORT), H).serve_forever()

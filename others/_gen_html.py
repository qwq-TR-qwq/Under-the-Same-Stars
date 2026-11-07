# -*- coding: utf-8 -*-
"""将 others/ 下的 md 文档转换为 html/ 下的网页版（UTF-8）"""
import re, io, os

os.chdir(os.path.join(os.path.dirname(__file__), '..'))

STYLE = """
body{font-family:'Microsoft YaHei','PingFang SC',sans-serif;max-width:860px;margin:40px auto;line-height:1.85;padding:0 20px;color:#2b2f3a;background:#fff}
h1{font-size:26px;border-bottom:2px solid #333;padding-bottom:10px}
h2{font-size:20px;color:#1f2430;margin-top:30px;border-bottom:1px solid #e3e6ee;padding-bottom:6px}
h3{font-size:17px;color:#39415a;margin-top:24px}
h4{font-size:15px;color:#5a6480}
li{margin:6px 0}
table{border-collapse:collapse;width:100%;margin:14px 0;font-size:14px}
th,td{border:1px solid #ccd2e0;padding:7px 10px;text-align:left;vertical-align:top}
th{background:#f2f4fa}
tr:nth-child(even) td{background:#fafbfd}
hr{border:none;border-top:1px solid #ddd;margin:24px 0}
pre{background:#f5f6fa;padding:15px;border-radius:6px;overflow-x:auto;font-size:13px;line-height:1.6;border:1px solid #e3e6ee}
code{background:#f0f2f8;padding:1px 5px;border-radius:3px;font-size:13px}
pre code{background:none;padding:0}
blockquote{border-left:4px solid #c9d4f2;margin:12px 0;padding:4px 14px;color:#5a6480;background:#f8f9fd}
figure{margin:16px 0;text-align:center}
figure img{max-width:100%;border:1px solid #dfe4ef;border-radius:6px}
figcaption{font-size:13px;color:#5a6480;margin-top:6px}
strong{color:#1f2430}
"""

def inline(s):
    s = s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    s = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', s)
    s = re.sub(r'`([^`]+)`', r'<code>\1</code>', s)
    s = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2" target="_blank" rel="noopener">\1</a>', s)
    return s

def md2html(md):
    lines = md.replace('\r\n', '\n').split('\n')
    out, i, in_code, in_table = [], 0, False, False
    while i < len(lines):
        ln = lines[i]
        if ln.strip().startswith('```'):
            if in_code:
                out.append('</code></pre>'); in_code = False
            else:
                out.append('<pre><code>'); in_code = True
            i += 1; continue
        if in_code:
            out.append(ln.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))
            i += 1; continue
        st = ln.strip()
        if st.startswith('|') and i + 1 < len(lines) and re.match(r'^\|[\s:|-]+\|$', lines[i+1].strip()):
            rows = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                cells = [c.strip() for c in lines[i].strip().strip('|').split('|')]
                rows.append(cells); i += 1
            rows.pop(1)  # 分隔行
            out.append('<table>')
            for r, row in enumerate(rows):
                tag = 'th' if r == 0 else 'td'
                out.append('<tr>' + ''.join(f'<{tag}>{inline(c)}</{tag}>' for c in row) + '</tr>')
            out.append('</table>')
            continue
        if st == '':
            i += 1; continue
        if st == '---':
            out.append('<hr>'); i += 1; continue
        mi = re.match(r'^!\[([^\]]*)\]\(([^)]+)\)\s*$', st)
        if mi:
            alt, src = mi.group(1), mi.group(2)
            if not src.startswith('http'):
                src = '../' + src
            out.append(f'<figure><img src="{src}" alt="{alt}"><figcaption>{inline(alt)}</figcaption></figure>')
            i += 1; continue
        m = re.match(r'^(#{1,4})\s+(.*)$', st)
        if m:
            lv = len(m.group(1))
            out.append(f'<h{lv}>{inline(m.group(2))}</h{lv}>'); i += 1; continue
        if st.startswith('> '):
            out.append(f'<blockquote>{inline(st[2:])}</blockquote>'); i += 1; continue
        if re.match(r'^[-*]\s+', st):
            items = []
            while i < len(lines) and re.match(r'^[-*]\s+', lines[i].strip()):
                items.append(re.sub(r'^[-*]\s+', '', lines[i].strip())); i += 1
            out.append('<ul>' + ''.join(f'<li>{inline(it)}</li>' for it in items) + '</ul>')
            continue
        if re.match(r'^\d+\.\s+', st):
            items = []
            while i < len(lines) and re.match(r'^\d+\.\s+', lines[i].strip()):
                items.append(re.sub(r'^\d+\.\s+', '', lines[i].strip())); i += 1
            out.append('<ol>' + ''.join(f'<li>{inline(it)}</li>' for it in items) + '</ol>')
            continue
        # 普通段落（合并连续行）
        para = [st]; i += 1
        while i < len(lines) and lines[i].strip() and not re.match(r'^(#{1,4}\s|[-*]\s|\d+\.\s|\||```|>|---$)', lines[i].strip()):
            para.append(lines[i].strip()); i += 1
        out.append(f'<p>{inline("\n".join(para)).replace(chr(10), "<br>")}</p>')
    return '\n'.join(out)

JOBS = [
    ('others/作品介绍文档.md', 'html/作品介绍文档.html', '星夜入眠 · 作品介绍文档'),
    ('others/技术文档.md', 'html/技术文档.html', '星夜入眠 · 技术文档'),
]
for src, dst, title in JOBS:
    md = io.open(src, encoding='utf-8').read()
    html = ("<!DOCTYPE html>\n<html lang=\"zh-CN\">\n<head>\n<meta charset=\"utf-8\">\n"
            f"<title>{title}</title>\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n"
            f"<style>{STYLE}</style>\n</head>\n<body>\n" + md2html(md) + "\n</body>\n</html>\n")
    io.open(dst, 'w', encoding='utf-8', newline='\n').write(html)
    print('OK', dst, len(html.encode('utf-8')), 'bytes')

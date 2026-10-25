# -*- coding: utf-8 -*-
"""将 html/ 下的两份参赛文档渲染为 PDF（中文字体：微软雅黑 / NSimSun 代码块）"""
import os, tempfile
from fontTools.ttLib import TTCollection
from fpdf import FPDF
from fpdf.fonts import FontFace
from html.parser import HTMLParser

os.chdir(os.path.join(os.path.dirname(__file__), '..'))

# ---------- 1. 从系统 TTC 提取 TTF ----------
TMP = os.path.join(tempfile.gettempdir(), 'xingya_fonts')
os.makedirs(TMP, exist_ok=True)

def extract(ttc_path, index, out_name):
    out = os.path.join(TMP, out_name)
    if not os.path.exists(out):
        coll = TTCollection(ttc_path, lazy=True)
        coll.fonts[index].save(out)
    return out

F_REG = extract(r'C:\Windows\Fonts\msyh.ttc', 0, 'msyh.ttf')
F_BOLD = extract(r'C:\Windows\Fonts\msyhbd.ttc', 0, 'msyhbd.ttf')
F_MONO = extract(r'C:\Windows\Fonts\simsun.ttc', 1, 'nsimsun.ttf')

# ---------- 2. 解析 HTML 为块结构 ----------
class DocParser(HTMLParser):
    """块类型：h1/h2/h3/h4/p/li/quote = runs 列表 [(text,bold)]；
       pre = 纯文本；table = rows[cells[runs]]；hr = None"""

    def __init__(self):
        super().__init__()
        self.blocks = []
        self.runs = []
        self.strong = 0
        self.pre = None
        self.cell = None
        self.row = None
        self.rows = None
        self.head = None
        self.skip = None  # style / head / script 内容跳过

    @staticmethod
    def _norm(t):
        return t.replace('\n', ' ')

    def flush(self):
        if any(t.strip() for t, _ in self.runs):
            self.blocks.append((self.head or 'p', self.runs[:]))
        self.runs = []

    def handle_starttag(self, tag, attrs):
        if tag in ('style', 'head', 'script', 'title', 'meta', 'link'):
            self.skip = tag
            return
        if tag == 'pre':
            self.flush(); self.pre = []
        elif tag == 'table':
            self.flush(); self.rows = []
        elif tag == 'tr':
            self.row = []
        elif tag in ('td', 'th'):
            self.cell = []
        elif tag in ('h1', 'h2', 'h3', 'h4', 'li', 'blockquote'):
            self.flush(); self.head = tag
        elif tag == 'p':
            self.flush(); self.head = 'p'
        elif tag in ('strong', 'b'):
            self.strong += 1
        elif tag == 'hr':
            self.flush(); self.blocks.append(('hr', None))

    def handle_endtag(self, tag):
        if self.skip:
            if tag == self.skip:
                self.skip = None
            return
        if tag == 'pre':
            if self.pre is not None:
                self.blocks.append(('pre', ''.join(self.pre).strip('\n')))
            self.pre = None
        elif tag in ('td', 'th'):
            if self.cell is not None and self.row is not None:
                self.row.append(self.cell)
            self.cell = None
        elif tag == 'tr':
            if self.row is not None and self.rows is not None:
                self.rows.append(self.row)
            self.row = None
        elif tag == 'table':
            if self.rows:
                self.blocks.append(('table', self.rows))
            self.rows = None
        elif tag in ('strong', 'b'):
            self.strong = max(0, self.strong - 1)
        elif tag in ('h1', 'h2', 'h3', 'h4', 'li', 'blockquote', 'p'):
            kind = 'quote' if tag == 'blockquote' else tag
            self.flush(); self.head = None

    def handle_data(self, data):
        if self.skip:
            return
        if self.pre is not None:
            self.pre.append(data)
        elif self.cell is not None:
            self.cell.append((self._norm(data), self.strong > 0))
        else:
            self.runs.append((self._norm(data), self.strong > 0))

def parse_html(path):
    p = DocParser()
    p.feed(open(path, encoding='utf-8').read())
    p.flush()
    return p.blocks

# ---------- 3. 渲染 PDF ----------
HEAD_SIZE = {'h1': 19, 'h2': 14.5, 'h3': 12, 'h4': 11}

class PDF(FPDF):
    def __init__(self):
        super().__init__('P', 'mm', 'A4')
        self.add_font('msyh', '', F_REG)
        self.add_font('msyh', 'B', F_BOLD)
        self.add_font('nsimsun', '', F_MONO)
        self.add_font('nsimsun', 'B', F_BOLD)
        self.set_margins(18, 16, 18)
        self.set_auto_page_break(True, 18)
        self.title_doc = ''
    def header(self):
        if self.page_no() > 1:
            self.set_font('msyh', '', 8); self.set_text_color(130, 140, 165)
            self.cell(0, 6, self.title_doc, align='R', new_x='LMARGIN', new_y='NEXT')
            self.set_text_color(0, 0, 0)
    def footer(self):
        self.set_y(-13); self.set_font('msyh', '', 8.5); self.set_text_color(130, 140, 165)
        self.cell(0, 8, f'- {self.page_no()} -', align='C')
        self.set_text_color(0, 0, 0)

EMOJI_MAP = {'📷': '[图片]', '🔊': '[朗读]', '✅': '√', '🎤': '[语音]', '⭐': '*', '★': '*'}

def sanitize(t):
    for k, v in EMOJI_MAP.items():
        t = t.replace(k, v)
    # 兜底：去掉雅黑没有的其他 emoji
    return ''.join(ch for ch in t if ord(ch) < 0x1F000 or ch in EMOJI_MAP.values())

def cell_text(runs):
    return sanitize(''.join(t.strip() if not t.strip() else t for t, _ in runs).strip())

def write_runs(pdf, runs, size, lh, color=(43, 47, 58)):
    pdf.set_text_color(*color)
    for t, b in runs:
        t = sanitize(t.replace('<B>', '').replace('</B>', ''))
        if not t:
            continue
        pdf.set_font('msyh', 'B' if b else '', size)
        pdf.write(lh, t)
    pdf.ln(lh + 0.8)

def render(blocks, out_path, title):
    pdf = PDF()
    pdf.title_doc = title
    pdf.add_page()
    pdf.set_title(title)
    for kind, payload in blocks:
        if kind in HEAD_SIZE:
            size = HEAD_SIZE[kind]
            pdf.ln(2 if kind == 'h1' else 3.5)
            pdf.set_text_color(31, 36, 48)
            pdf.set_font('msyh', 'B', size)
            text = cell_text(payload)
            pdf.multi_cell(0, size * 0.62, text, new_x='LMARGIN', new_y='NEXT')
            if kind == 'h1':
                pdf.set_draw_color(60, 66, 84); pdf.set_line_width(0.6)
                pdf.line(pdf.l_margin, pdf.get_y() + 1, pdf.w - pdf.r_margin, pdf.get_y() + 1)
                pdf.ln(4)
            elif kind == 'h2':
                pdf.set_draw_color(210, 216, 232); pdf.set_line_width(0.3)
                pdf.line(pdf.l_margin, pdf.get_y() + 0.8, pdf.w - pdf.r_margin, pdf.get_y() + 0.8)
                pdf.ln(3)
            else:
                pdf.ln(1.5)
        elif kind == 'p':
            write_runs(pdf, payload, 10.5, 6.4)
        elif kind == 'li':
            pdf.set_text_color(43, 47, 58)
            pdf.set_font('msyh', '', 10.5)
            pdf.cell(5, 6.4, '•')
            write_runs(pdf, payload, 10.5, 6.4)
        elif kind == 'quote':
            pdf.set_text_color(90, 100, 128)
            y0 = pdf.get_y(); pdf.set_x(pdf.l_margin + 3)
            write_runs(pdf, payload, 10, 6, color=(90, 100, 128))
            pdf.set_draw_color(201, 212, 242); pdf.set_line_width(0.8)
            pdf.line(pdf.l_margin, y0, pdf.l_margin, pdf.get_y() - 1)
        elif kind == 'pre':
            lines = sanitize(payload).split('\n')
            while lines and not lines[-1].strip():
                lines.pop()
            lh = 4.6; size = 8.2
            h = len(lines) * lh + 6
            if pdf.get_y() + h > pdf.h - 20:
                pdf.add_page()
            pdf.set_fill_color(244, 246, 250); pdf.set_draw_color(226, 230, 240)
            x0, y0 = pdf.l_margin, pdf.get_y()
            pdf.rect(x0, y0, pdf.w - pdf.l_margin - pdf.r_margin, h, 'DF')
            pdf.set_xy(x0 + 3, y0 + 3)
            pdf.set_font('nsimsun', '', size); pdf.set_text_color(52, 58, 76)
            for ln_ in lines:
                pdf.set_x(x0 + 3)
                pdf.cell(0, lh, ln_, new_x='LMARGIN', new_y='NEXT')
            pdf.set_y(y0 + h + 3); pdf.set_text_color(0, 0, 0)
        elif kind == 'table':
            rows = payload
            ncol = max(len(r) for r in rows)
            pdf.ln(2)
            with pdf.table(col_widths=(pdf.epw / ncol,) * ncol,
                           text_align='LEFT', line_height=5.6, padding=1.6,
                           borders_layout='ALL') as table:
                for ri, row in enumerate(rows):
                    tr = table.row()
                    if ri == 0:
                        tr.head_style = FontFace(emphasis='BOLD', fill_color=(242, 244, 250))
                    for ci in range(ncol):
                        cell_runs = row[ci] if ci < len(row) else []
                        tr.cell(cell_text(cell_runs))
            pdf.ln(3)
        elif kind == 'hr':
            pdf.ln(3); pdf.set_draw_color(215, 219, 230); pdf.set_line_width(0.3)
            y = pdf.get_y(); pdf.line(pdf.l_margin, y, pdf.w - pdf.r_margin, y); pdf.ln(5)
    pdf.output(out_path)
    print('PDF OK:', out_path, os.path.getsize(out_path), 'bytes')

JOBS = [
    ('html/作品介绍文档.html', 'others/作品介绍文档.pdf', '星夜入眠 · 作品介绍文档 v11.2'),
    ('html/技术文档.html', 'others/技术文档.pdf', '星夜入眠 · 技术文档 v11.2'),
]
if __name__ == '__main__':
    for src, dst, title in JOBS:
        render(parse_html(src), dst, title)

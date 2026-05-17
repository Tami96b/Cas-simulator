#!/usr/bin/env python3

import os, yaml
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

YAML_PATH   = os.path.join(os.path.dirname(__file__), 'openapi.yaml')
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), 'openapi_docs.pdf')
DOC_TITLE   = "CAS App - API Documentation"

FONT_DIR = "/usr/share/fonts/dejavu"
pdfmetrics.registerFont(TTFont('DejaVu',      f"{FONT_DIR}/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont('DejaVu-Bold', f"{FONT_DIR}/DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont('DejaVu-Mono', f"{FONT_DIR}/DejaVuSansMono.ttf"))


class NumberedCanvas:
    #X/Y numbering
    def __init__(self, filename, **kwargs):
        from reportlab.pdfgen import canvas as rl_canvas
        self._canvas = rl_canvas.Canvas(filename, **kwargs)
        self._pages  = []
        self.width, self.height = A4

    def showPage(self):
        self._pages.append(dict(self._canvas.__dict__))
        self._canvas._startPage()

    def save(self):
        total = len(self._pages)
        for i, page in enumerate(self._pages, start=1):
            self._canvas.__dict__.update(page)
            self._draw(i, total)
            self._canvas.showPage()
        self._canvas.save()

    def _draw(self, n, total):
        c = self._canvas
        w, h = self.width, self.height
        c.setFillColor(colors.HexColor('#1e40af'))
        c.rect(0, h - 1.2*cm, w, 1.2*cm, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont('DejaVu-Bold', 10)
        c.drawString(1*cm, h - 0.85*cm, DOC_TITLE)
        c.setFillColor(colors.HexColor('#f1f5f9'))
        c.rect(0, 0, w, 0.9*cm, fill=1, stroke=0)
        c.setFillColor(colors.HexColor('#64748b'))
        c.setFont('DejaVu', 8)
        c.drawString(1*cm, 0.32*cm, DOC_TITLE)
        c.drawRightString(w - 1*cm, 0.32*cm, f"{n}/{total}")

    def __getattr__(self, name):
        return getattr(self._canvas, name)


def method_color(method):
    return {
        'get':    '#16a34a',
        'post':   '#2563eb',
        'put':    '#d97706',
        'delete': '#dc2626',
        'patch':  '#7c3aed',
    }.get(method.lower(), '#475569')


def make_table(data, widths, hcolor):
    t = Table(data, colWidths=widths)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor(hcolor)),
        ('TEXTCOLOR',  (0,0), (-1,0), colors.white),
        ('FONTNAME',   (0,0), (-1,0), 'DejaVu-Bold'),
        ('FONTNAME',   (0,1), (-1,-1), 'DejaVu'),
        ('FONTSIZE',   (0,0), (-1,-1), 8),
        ('GRID',       (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
        ('VALIGN',     (0,0), (-1,-1), 'TOP'),
    ]))
    return t


def load_yaml():
    with open(YAML_PATH, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)


def build_story(spec):
    styles = getSampleStyleSheet()

    ts = ParagraphStyle('T',  parent=styles['Title'],   fontSize=20, fontName='DejaVu-Bold', textColor=colors.HexColor('#1e293b'), spaceAfter=6)
    h1 = ParagraphStyle('H1', parent=styles['Heading1'],fontSize=14, fontName='DejaVu-Bold', textColor=colors.HexColor('#1e40af'), spaceBefore=16, spaceAfter=4)
    h2 = ParagraphStyle('H2', parent=styles['Heading2'],fontSize=11, fontName='DejaVu-Bold', textColor=colors.HexColor('#334155'), spaceBefore=10, spaceAfter=3)
    nm = ParagraphStyle('N',  parent=styles['Normal'],  fontSize=9,  fontName='DejaVu',      textColor=colors.HexColor('#334155'), spaceAfter=3)
    cs = ParagraphStyle('C',  parent=styles['Code'],    fontSize=8,  fontName='DejaVu-Mono', backColor=colors.HexColor('#f8fafc'),
                         textColor=colors.HexColor('#0f172a'), borderColor=colors.HexColor('#e2e8f0'),
                         borderWidth=1, borderPadding=4, spaceAfter=4)

    info = spec.get('info', {})
    story = [
        Spacer(1, 0.5*cm),
        Paragraph(info.get('title', 'API Documentation'), ts),
        Paragraph(f"Verzia: {info.get('version', '1.0.2')}", nm),
    ]
    if info.get('description'):
        story.append(Paragraph(info['description'].strip().replace('\n', '<br/>'), nm))
    story.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor('#e2e8f0'), spaceAfter=12))

    story.append(Paragraph('Servery', h1))
    for sv in spec.get('servers', []):
        story.append(Paragraph(f"<b>{sv.get('url')}</b> — {sv.get('description', '')}", nm))

    story += [
        Paragraph('Autentifikácia', h1),
        Paragraph('Všetky chránené endpointy vyžadujú <b>Bearer token</b> v hlavičke:', nm),
        Paragraph('Authorization: Bearer &lt;API_TOKEN&gt;', cs),
        Paragraph('Endpointy', h1),
    ]

    for path, methods in spec.get('paths', {}).items():
        for method, details in methods.items():
            if method not in ('get', 'post', 'put', 'delete', 'patch'):
                continue

            color = method_color(method)
            story.append(Paragraph(f'<font color="{color}"><b>[{method.upper()}]</b></font> <b>{path}</b>', h2))

            if details.get('summary'):
                story.append(Paragraph(details['summary'], nm))
            if details.get('description'):
                story.append(Paragraph(details['description'].strip().replace('\n', '<br/>'), nm))

            params = details.get('parameters', [])
            if params:
                story.append(Paragraph('<b>Parametre:</b>', nm))
                td = [['Názov', 'Umiestnenie', 'Typ', 'Popis']]
                for p in params:
                    sc = p.get('schema', {})
                    td.append([p.get('name', ''), p.get('in', ''), sc.get('type', ''),
                               p.get('description', '') or f"default: {sc.get('default', '')}"])
                story += [make_table(td, [3.5*cm, 2.5*cm, 2*cm, 8*cm], '#1e40af'), Spacer(1, 4)]

            rb = details.get('requestBody', {})
            if rb:
                sc    = rb.get('content', {}).get('application/json', {}).get('schema', {})
                props = sc.get('properties', {})
                req   = sc.get('required', [])
                if props:
                    story.append(Paragraph('<b>Request body (JSON):</b>', nm))
                    td = [['Pole', 'Typ', 'Povinné', 'Popis']]
                    for prop, pdef in props.items():
                        td.append([prop, pdef.get('type', ''),
                                   'áno' if prop in req else 'nie',
                                   pdef.get('description', '') or f"default: {pdef.get('default', '')}"])
                    story += [make_table(td, [3.5*cm, 2*cm, 2*cm, 8.5*cm], '#334155'), Spacer(1, 4)]

            responses = details.get('responses', {})
            if responses:
                rd = [['Kód', 'Popis']] + [[str(c), r.get('description', '')] for c, r in responses.items()]
                story.append(make_table(rd, [2*cm, 14*cm], '#475569'))

            story.append(Spacer(1, 8))

    return story


def generate():
    spec  = load_yaml()
    story = build_story(spec)
    doc   = SimpleDocTemplate(
        OUTPUT_PATH, pagesize=A4,
        leftMargin=1.5*cm, rightMargin=1.5*cm,
        topMargin=1.8*cm,  bottomMargin=1.5*cm,
    )
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF vygenerovany: {OUTPUT_PATH}")


if __name__ == '__main__':
    generate()
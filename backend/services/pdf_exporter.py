from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO
from typing import Any, Dict
import datetime


# Register a common font (fallback to built-in if file not available)
try:
    pdfmetrics.registerFont(TTFont('Inter', 'Inter-Regular.ttf'))
    base_font = 'Inter'
except Exception:
    base_font = 'Helvetica'


def _header_footer(canvas, doc):
    canvas.saveState()
    w, h = letter
    # header
    canvas.setFont(base_font, 12)
    canvas.drawString(40, h - 40, "LLM Code Review — Report")
    # footer (page number)
    canvas.setFont(base_font, 9)
    page_num = f"Page {doc.page}"
    canvas.drawRightString(w - 40, 30, page_num)
    canvas.restoreState()


def build_pdf_report(analysis: Dict[str, Any]) -> bytes:
    """Build a polished PDF report from analysis dict and return bytes."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=72, bottomMargin=54)
    styles = getSampleStyleSheet()
    normal = styles['Normal']
    normal.fontName = base_font
    title_style = ParagraphStyle('title', parent=styles['Title'], fontName=base_font)
    h2 = ParagraphStyle('h2', parent=styles['Heading2'], fontName=base_font)
    italic = ParagraphStyle('italic', parent=styles['Italic'], fontName=base_font)
    small = ParagraphStyle('small', parent=styles['Normal'], fontName=base_font, fontSize=9)

    story = []

    # Title block
    story.append(Paragraph('Code Review Report', title_style))
    meta_ts = datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')
    story.append(Spacer(1, 6))
    story.append(Paragraph(f'Report generated: {meta_ts}', small))
    story.append(Spacer(1, 12))

    # Summary
    summary = analysis.get('summary') or {}
    story.append(Paragraph('Summary', h2))
    story.append(Spacer(1, 6))
    if isinstance(summary, dict):
        story.append(Paragraph(summary.get('summary', 'No summary available.'), normal))
        story.append(Spacer(1, 6))
        kps = summary.get('key_points') or []
        if kps:
            for kp in kps:
                story.append(Paragraph(f'• {kp}', normal))
            story.append(Spacer(1, 6))
    else:
        story.append(Paragraph(str(summary), normal))
    story.append(Spacer(1, 12))

    # Metrics table (nicely formatted)
    metrics = analysis.get('metrics') or {}
    story.append(Paragraph('Metrics', h2))
    story.append(Spacer(1, 6))
    if metrics:
        data = [[Paragraph('<b>Metric</b>', small), Paragraph('<b>Value</b>', small)]]
        for k in sorted(metrics.keys()):
            v = metrics.get(k)
            data.append([Paragraph(str(k).replace('_', ' ').title(), normal), Paragraph(str(round(v, 2)) if isinstance(v, (int, float)) else str(v), normal)])
        t = Table(data, colWidths=[3.5 * inch, 2.5 * inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F3F4F6')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(t)
    else:
        story.append(Paragraph('No metrics available.', normal))
    story.append(Spacer(1, 12))

    # Issues with color-coded severity
    story.append(Paragraph('Issues', h2))
    story.append(Spacer(1, 6))
    comments = analysis.get('comments') or []
    if comments:
        data = [[Paragraph('<b>Line</b>', small), Paragraph('<b>Severity</b>', small), Paragraph('<b>Category</b>', small), Paragraph('<b>Message</b>', small), Paragraph('<b>Suggestion</b>', small)]]
        sev_color = {'error': colors.HexColor('#FEE2E2'), 'warning': colors.HexColor('#FEF3C7'), 'info': colors.HexColor('#DBEAFE')}
        for c in comments:
            line = c.get('line') or '-'
            sev = (c.get('severity') or 'info').lower()
            cat = c.get('category') or ''
            msg = c.get('message') or ''
            sugg = c.get('suggestion') or ''
            data.append([Paragraph(str(line), small), Paragraph(sev.title(), small), Paragraph(cat, small), Paragraph(msg, small), Paragraph(sugg, small)])
        t = Table(data, colWidths=[0.8 * inch, 1.0 * inch, 1.4 * inch, 3.0 * inch, 2.0 * inch])
        # color severities by row where applicable
        row_styles = [('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey), ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0,0), (-1,-1), 6)]
        # apply background for severity column cells
        for i, c in enumerate(comments, start=1):
            sev = (c.get('severity') or 'info').lower()
            color = sev_color.get(sev, colors.white)
            row_styles.append(('BACKGROUND', (1, i), (1, i), color))
        t.setStyle(TableStyle(row_styles))
        story.append(t)
    else:
        story.append(Paragraph('No issues found.', normal))
    story.append(Spacer(1, 12))

    # Library docs links
    docs_links = analysis.get('docs_links') or []
    story.append(Paragraph('Library Documentation', h2))
    story.append(Spacer(1, 6))
    if docs_links:
        for dl in docs_links:
            name = dl.get('name') or dl.get('id') or 'Library'
            url = dl.get('canonical_url') or dl.get('url')
            snippet = dl.get('snippet') or ''
            story.append(Paragraph(f'<b>{name}</b>', normal))
            if url:
                # clickable link
                story.append(Paragraph(f'<a href="{url}">{url}</a>', small))
            if snippet:
                story.append(Paragraph(snippet, normal))
            story.append(Spacer(1, 6))
    else:
        story.append(Paragraph('No library documentation links found.', normal))

    # build
    doc.build(story, onFirstPage=_header_footer, onLaterPages=_header_footer)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf

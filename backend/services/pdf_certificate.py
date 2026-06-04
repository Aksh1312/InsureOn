from io import BytesIO
from datetime import date
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from .. import models


_CALIBRI_REGISTERED = False


def _ensure_fonts():
    global _CALIBRI_REGISTERED
    if _CALIBRI_REGISTERED:
        return
    try:
        pdfmetrics.registerFont(TTFont('Calibri', r'C:\Windows\Fonts\calibri.ttf'))
        pdfmetrics.registerFont(TTFont('Calibri-Bold', r'C:\Windows\Fonts\calibrib.ttf'))
        pdfmetrics.registerFontFamily('Calibri', normal='Calibri', bold='Calibri-Bold')
        _CALIBRI_REGISTERED = True
    except Exception:
        pass


def _font():
    return ('Calibri', 'Calibri-Bold') if _CALIBRI_REGISTERED else ('Helvetica', 'Helvetica-Bold')


NAVY = colors.HexColor("#1a237e")
DARK = colors.HexColor("#212121")
GREY600 = colors.HexColor("#757575")
GREY300 = colors.HexColor("#e0e0e0")
GREY100 = colors.HexColor("#f5f5f5")
WHITE = colors.white
GREEN = colors.HexColor("#2e7d32")
AMBER = colors.HexColor("#f9a825")
ORANGE = colors.HexColor("#e65100")
RED = colors.HexColor("#c62828")


def _safe_value(val):
    if hasattr(val, 'value'):
        return str(val.value)
    return str(val)


def _draw_frame(c, doc):
    pw, ph = A4
    c.saveState()
    c.setStrokeColor(NAVY)
    c.setLineWidth(2)
    c.rect(6 * mm, 6 * mm, pw - 12 * mm, ph - 12 * mm)
    c.setStrokeColor(GREY300)
    c.setLineWidth(0.5)
    c.rect(8 * mm, 8 * mm, pw - 16 * mm, ph - 16 * mm)
    c.restoreState()


def generate_policy_certificate(
    policy: models.Policy,
    user: models.User,
    worker_profile: models.WorkerProfile,
    risk_score: models.RiskScore | None = None,
) -> BytesIO:
    _ensure_fonts()
    F, FB = _font()
    buf = BytesIO()

    LM, RM, TM, BM = 18 * mm, 18 * mm, 15 * mm, 15 * mm
    PW = A4[0] - LM - RM

    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        topMargin=TM, bottomMargin=BM,
        leftMargin=LM, rightMargin=RM,
    )

    SP = ParagraphStyle

    # ── SECTION SPACING ────────────────────────
    SP_LG = 6 * mm
    SP_MD = 4 * mm
    SP_SM = 2.5 * mm

    # ═════════════════════════════════════════════
    # 1. HEADER BANNER
    # ═════════════════════════════════════════════
    hdr = Table([[
        Paragraph(
            f"<font face='{FB}' size='18' color='white'>INSUREON</font><br/>"
            f"<font face='{F}' size='3' color='#ffcc80'>&nbsp;</font><br/>"
            f"<font face='{F}' size='7' color='#ffcc80'>Parametric Income Protection</font>",
            SP("hl", fontName=FB, fontSize=18, textColor=WHITE),
        ),
        Paragraph(
            f"<font face='{FB}' size='10' color='white'>CERT-2026-{policy.id:06d}</font><br/>"
            f"<font face='{F}' size='3' color='#ffcc80'>&nbsp;</font><br/>"
            f"<font face='{F}' size='7' color='#ffcc80'>Issued: {date.today().strftime('%d %b %Y')}</font>",
            SP("hr", fontName=FB, fontSize=10, textColor=WHITE, alignment=TA_RIGHT),
        ),
    ]], colWidths=[PW * 0.6, PW * 0.4])
    hdr.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("LEFTPADDING", (0, 0), (0, 0), 16),
        ("RIGHTPADDING", (0, 0), (-1, -1), 16),
    ]))

    # ═════════════════════════════════════════════
    # 2. TITLE + STATUS BADGE
    # ═════════════════════════════════════════════
    status_text = "ACTIVE / PAID" if policy.is_paid else "PENDING / UNPAID"
    title_text = "INCOME PROTECTION CERTIFICATE" if policy.is_paid else "INCOME PROTECTION PLAN RECEIPT"
    sc = GREEN if policy.is_paid else AMBER

    title_row = Table([[
        Paragraph(title_text,
                   SP("mt", fontName=FB, fontSize=12, textColor=NAVY, alignment=TA_CENTER)),
        Paragraph(status_text,
                   SP("bd", fontName=FB, fontSize=8, textColor=WHITE, alignment=TA_CENTER)),
    ]], colWidths=[PW * 0.68, PW * 0.32])
    title_row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BACKGROUND", (1, 0), (1, 0), sc),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (0, 0), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("ALIGN", (1, 0), (1, 0), "CENTER"),
    ]))

    # ═════════════════════════════════════════════
    # 3. INFO CELL HELPER
    # ═════════════════════════════════════════════
    def cl(label, value):
        return Paragraph(
            f"<font face='{F}' size='8' color='#757575'>{label}</font><br/>"
            f"<font face='{FB}' size='10' color='#212121'>{value}</font>",
            SP("c", fontName=F, fontSize=8),
        )

    def info_group(rows, group_label=None):
        data = rows
        t = Table(data, colWidths=[PW / 2, PW / 2])
        t.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 4.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.3, GREY300),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [WHITE, GREY100]),
        ]))
        return t

    # ═════════════════════════════════════════════
    # 4. COVERAGE SUMMARY CARD HELPER
    # ═════════════════════════════════════════════
    def scard(amt, lbl):
        cw = (PW - 6) / 3
        return Table([
            [Paragraph(amt, SP("sv", fontName=FB, fontSize=14, textColor=NAVY, alignment=TA_CENTER))],
            [Paragraph(lbl, SP("sl", fontName=FB, fontSize=7.5, textColor=GREY600, alignment=TA_CENTER))],
        ], colWidths=[cw])

    # ═════════════════════════════════════════════
    # DATA
    # ═════════════════════════════════════════════
    platform_val = _safe_value(user.platform).upper()
    period = f"{policy.week_start_date.strftime('%d %b %Y')} \u2013 {policy.week_end_date.strftime('%d %b %Y')}"
    zone_val = _safe_value(policy.zone)
    tier_val = _safe_value(policy.tier).replace("_", " ")
    risk_cat = _safe_value(risk_score.risk_category) if risk_score else "N/A"
    risk_val = str(risk_score.total_score) if risk_score else "N/A"

    # ═════════════════════════════════════════════
    # BUILD DOCUMENT
    # ═════════════════════════════════════════════
    elements = []

    elements.append(hdr)
    elements.append(Spacer(1, SP_LG))

    elements.append(title_row)
    elements.append(Spacer(1, SP_LG))

    elements.append(info_group([
        [cl("Policy Number", f"POL-2026-{policy.id:06d}"),
         cl("Certificate Number", f"CERT-2026-{policy.id:06d}")],
        [cl("Worker Name", user.full_name or user.email.split("@")[0]),
         cl("Platform", platform_val)],
    ]))
    elements.append(Spacer(1, SP_MD))

    elements.append(info_group([
        [cl("Policy Period", period),
         cl("Status", status_text)],
        [cl("Zone / Area", zone_val),
         cl("Coverage Tier", tier_val)],
    ]))
    elements.append(Spacer(1, SP_MD))

    elements.append(info_group([
        [cl("Average Weekly Income", f"Rs. {int(user.income):,}"),
         cl("Risk Category", risk_cat)],
        [cl("Coverage Amount", f"Rs. {int(policy.weekly_coverage):,}"),
         cl("Weekly Premium", f"Rs. {int(policy.weekly_premium):,}")],
    ]))
    elements.append(Spacer(1, SP_LG))

    # ── COVERAGE SUMMARY ───────────────────────
    cw = (PW - 6) / 3
    cards_row = Table([
        [scard(f"Rs. {int(user.income):,}", "Average Weekly Income"),
         scard(f"Rs. {int(policy.weekly_coverage):,}", "Coverage Amount"),
         scard(f"Rs. {int(policy.weekly_premium):,}", "Weekly Premium")]
    ], colWidths=[cw, cw, cw])
    cards_row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BACKGROUND", (0, 0), (-1, -1), GREY100),
        ("BOX", (0, 0), (-1, -1), 0.4, GREY300),
        ("TOPPADDING", (0, 0), (0, 0), 14),
        ("BOTTOMPADDING", (0, 0), (0, 0), 5),
        ("TOPPADDING", (0, 1), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 14),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("LINEAFTER", (0, 0), (-2, -1), 0.3, GREY300),
    ]))
    elements.append(cards_row)
    elements.append(Spacer(1, SP_LG))

    # ── RISK PROFILE ───────────────────────────
    risk_inner = Table([[
        Paragraph(
            f"<font face='{F}' size='9' color='#757575'><b>Risk Category</b></font>"
            f"&nbsp;&nbsp;&nbsp;"
            f"<font face='{FB}' size='10' color='white'>&nbsp;{risk_cat}&nbsp;</font>"
            f"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"
            f"<font face='{F}' size='9' color='#757575'><b>Risk Score</b></font>"
            f"&nbsp;&nbsp;"
            f"<font face='{FB}' size='11' color='#212121'>{risk_val}</font>",
            SP("ri", fontName=F, fontSize=9),
        ),
    ]], colWidths=[PW])
    risk_inner.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), GREY100),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("BOX", (0, 0), (-1, -1), 0.4, GREY300),
    ]))

    risk_block = Table([
        [Paragraph("Risk Profile",
                    SP("rp_title", fontName=FB, fontSize=10, textColor=NAVY))],
        [risk_inner],
        [Paragraph(
            "Based on work hours, location risk, claim history, and operating conditions.",
            SP("rp_explain", fontName=F, fontSize=8.5, textColor=GREY600, leading=12,
               alignment=TA_JUSTIFY),
        )],
    ], colWidths=[PW])
    risk_block.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(risk_block)
    elements.append(Spacer(1, SP_LG))

    # ── DETAILED CALCULATION BREAKDOWN ──────────
    calc_inner = Table([
        [Paragraph(f"<b>Weekly Work Hours:</b> {worker_profile.avg_weekly_hours if worker_profile else 0.0} hrs/week", SP("cb1", fontName=F, fontSize=8.5)),
         Paragraph(f"<b>Assigned Tier:</b> {tier_val}", SP("cb2", fontName=F, fontSize=8.5))],
        [Paragraph(f"<b>City / Region:</b> {user.region.title() if user.region else 'Unknown'}", SP("cb3", fontName=F, fontSize=8.5)),
         Paragraph(f"<b>Assigned Zone:</b> Zone {zone_val}", SP("cb4", fontName=F, fontSize=8.5))],
        [Paragraph(f"<b>Fixed Premium Rate:</b> Rs. {int(policy.weekly_premium):,}/week", SP("cb5", fontName=F, fontSize=8.5)),
         Paragraph(f"<b>Weekly Coverage:</b> Rs. {int(policy.weekly_coverage):,}", SP("cb6", fontName=F, fontSize=8.5))]
    ], colWidths=[PW / 2, PW / 2])
    calc_inner.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), GREY100),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("BOX", (0, 0), (-1, -1), 0.4, GREY300),
        ("GRID", (0, 0), (-1, -1), 0.3, GREY300),
    ]))

    calc_block = Table([
        [Paragraph("Plan Premium Calculation Breakdown",
                    SP("calc_title", fontName=FB, fontSize=10, textColor=NAVY))],
        [calc_inner],
        [Paragraph(
            "Your coverage amount and weekly premium are determined strictly by your average weekly work hours "
            "and automatically resolved location zone according to standard pricing bands, bypassing any risk score multipliers.",
            SP("calc_explain", fontName=F, fontSize=8, textColor=GREY600, leading=11,
               alignment=TA_JUSTIFY),
        )],
    ], colWidths=[PW])
    calc_block.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(calc_block)
    elements.append(Spacer(1, SP_LG))

    # ── TERMS ──────────────────────────────────
    hr = HRFlowable(width="100%", thickness=0.4, color=GREY300,
                    spaceAfter=SP_SM, spaceBefore=0)
    elements.append(hr)
    elements.append(Spacer(1, 1.5 * mm))
    elements.append(Paragraph(
        "Terms &amp; Conditions",
        SP("tc_title", fontName=FB, fontSize=10, textColor=NAVY),
    ))
    elements.append(Spacer(1, 2 * mm))
    elements.append(Paragraph(
        "\u2022  Valid only for the policy period stated above.<br/>"
        "\u2022  Coverage limited to the specified amount; subject to policy terms.<br/>"
        "\u2022  Claims must be filed within 48 hours of the triggering event.<br/>"
        "\u2022  Weekly premium payment required to maintain active coverage.",
        SP("tc_body", fontName=F, fontSize=9, textColor=GREY600, leading=16,
           alignment=TA_JUSTIFY),
    ))
    elements.append(Spacer(1, SP_LG))

    # ── FOOTER ─────────────────────────────────
    elements.append(HRFlowable(width="100%", thickness=0.4, color=GREY300,
                                spaceAfter=SP_MD, spaceBefore=0))
    elements.append(Paragraph(
        f"<font face='{F}' color='#9e9e9e' size='7.5'>"
        f"InsureOn Operations &nbsp;\u2022&nbsp; support@insureon.dev "
        f"&nbsp;\u2022&nbsp; Digitally Generated Certificate "
        f"&nbsp;\u2022&nbsp; {date.today().strftime('%d %B %Y')}</font>",
        SP("foot", fontName=F, fontSize=7.5, textColor=colors.HexColor("#9e9e9e"),
           alignment=TA_CENTER),
    ))

    doc.build(elements, onFirstPage=_draw_frame, onLaterPages=_draw_frame)
    buf.seek(0)
    return buf

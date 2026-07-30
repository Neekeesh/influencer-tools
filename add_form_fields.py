#!/usr/bin/env python3
"""
Add a real AcroForm field layer to the Assetera "Token Listing Package" PDF.

The source PDF is a design-tool export: the "form" is purely decorative
vector art (grey rounded boxes, grey placeholder text, empty rounded
squares, ruled lines).  This script finds those elements by *content*
-- placeholder text, left-hand labels, headings -- and drops correctly
sized interactive widgets on top of them.  No page coordinate is
hardcoded, so the script survives minor layout shifts if the document is
re-exported.

Library choice
--------------
Writing: **pikepdf**.  Both pypdf and pikepdf can bolt an AcroForm onto an
    existing file, but this job needs three things pypdf makes awkward:
    hand-built /AP appearance streams (the white tick on the purple band),
    a real /FT /Sig field, and precise control over /Annots ordering for tab
    order.  pikepdf is a thin, well-typed wrapper over the object model
    (qpdf underneath), so all three are just dictionary writes, and qpdf
    rewrites the xref/object streams without touching page content.  pypdf's
    field helpers are higher level and steer you toward NeedAppearances,
    which is exactly the behaviour we need to avoid here.

Reading: **PyMuPDF**, read-only.  Locating the boxes needs glyph positions
    *and* vector-art rectangles; neither pypdf nor pikepdf exposes both, and
    this file's Type3 subset fonts defeat naive text extraction.  Note
    PyMuPDF is AGPL -- if that is a problem it is only used by `probe()`,
    which can be swapped for pdfplumber/pdfminer.six without touching the
    writer.

Verify: pikepdf + pypdf, two independent readers, so a malformed write shows
    up as disagreement rather than silence.

Requires: pikepdf, pymupdf, pypdf

Usage:
    python3 add_form_fields.py                     # in/out defaults below
    python3 add_form_fields.py --in a.pdf --out b.pdf
    python3 add_form_fields.py --verify-only b.pdf
"""

from __future__ import annotations

import argparse
import re
import sys
import unicodedata
from dataclasses import dataclass, field as dc_field
from typing import Any, Iterable, Optional, Sequence

# =============================================================================
# ============================  CONFIG SECTION  ===============================
# =============================================================================
# Everything a human is likely to want to tweak lives between here and the
# END-OF-CONFIG banner.  The logic below never contains a page coordinate.

DEFAULT_INPUT = "Token_Listing_Package_-_Editable.pdf"
DEFAULT_OUTPUT = "Token_Listing_Package_-_Fillable.pdf"

# ---------------------------------------------------------------- appearance
# Body text in the document measures 9.88 pt (placeholders) / 10.52 pt
# (labels).  10 pt sits between the two and matches visually.
BODY_FONT_SIZE = 10.0

# Dark ink used by the document for real content (#151421).  Deliberately
# *not* the placeholder grey (#828C99).
TEXT_COLOR = (0x15 / 255, 0x14 / 255, 0x21 / 255)

# Check-mark colour, per checkbox (see CHECK_DARK / CHECK_LIGHT below).
CHECK_DARK = TEXT_COLOR                # dark tick on the white checkboxes
CHECK_LIGHT = (1.0, 1.0, 1.0)          # white tick inside the purple band

# Vertical inset applied to widgets placed over a grey box, so the widget
# does not visually overhang the rounded corners.
BOX_INSET_Y = 1.0
BOX_INSET_RIGHT = 4.0

# The grey placeholder text is baked into the page artwork, so typed text
# lands on top of it.  Flip this to True to give each box-backed widget an
# opaque /MK /BG in the *measured* colour of its own grey box: viewers paint
# it when they regenerate the appearance, which hides the placeholder behind
# a swatch indistinguishable from the box itself.
#
# Left False by default because it does change what a filled-in page looks
# like, and some viewers paint /BG even while the field is still empty
# (which would hide the placeholder hint on open).
MASK_PLACEHOLDER_WHEN_FILLED = False

# Height of the text widget sitting on a ruled signature line.
RULED_LINE_FIELD_HEIGHT = 16.0

# ZapfDingbats glyph "4" == U+2713 CHECK MARK.  Metrics as a fraction of the
# font size (from the ZapfDingbats AFM); used to centre the tick in its box.
CHECK_GLYPH = {"char": "4", "width_em": 0.788, "height_em": 0.79, "scale": 0.72}

# ------------------------------------------------------- element recognition
# Colours are compared with a tolerance so a re-export that nudges a swatch
# by a hair still matches.
COLOR_TOLERANCE = 12  # per 8-bit channel

PLACEHOLDER_TEXT_COLOR = (0x82, 0x8C, 0x99)   # grey hint text inside the boxes
LABEL_TEXT_COLOR = (0x15, 0x14, 0x21)         # dark left-hand labels
GREY_BOX_FILL = (0xF2, 0xF1, 0xF6)            # the rounded input boxes

# A one-line input box: wide, and roughly one text line tall.
INPUT_BOX_MIN_WIDTH = 120.0
INPUT_BOX_HEIGHT_RANGE = (16.0, 45.0)

# The large grey signature panel.
SIGNATURE_BOX_MIN_WIDTH = 120.0
SIGNATURE_BOX_HEIGHT_RANGE = (45.0, 160.0)
SIGNATURE_BOX_CAPTION = "Signature"           # grey caption drawn inside it

# Empty rounded squares used as checkboxes.
CHECKBOX_SIZE_RANGE = (9.0, 26.0)
CHECKBOX_MAX_ASPECT_SKEW = 3.0                # |w - h| must be under this
CHECKBOX_MAX_GAP = 60.0                       # how far left of its caption
CHECKBOX_MIN_VERTICAL_OVERLAP = 0.4           # fraction of the smaller height

# Ruled lines under Name / Title / Date.
RULE_MAX_HEIGHT = 2.5
RULE_MIN_WIDTH = 50.0
RULE_MAX_GAP_FROM_LABEL = 60.0                # horizontal, label -> rule start
RULE_MAX_DROP_FROM_LABEL = 18.0               # vertical, label bottom -> rule

# ------------------------------------------------------------- the field map
# Tab order == the order of this list (see TAB_ORDER note in the README
# section at the bottom of this file).  Entries are written page by page,
# top to bottom.
#
# Constructors:
#   Text(name, page, placeholder=..., label=...)
#       Grey input box located by its grey placeholder text; `label` is the
#       dark left-hand label and is what disambiguates repeated placeholders
#       such as "Full name, email, phone" or "if available".
#   Check(name, page, caption=..., check=...)
#       Rounded square immediately left of `caption`.
#   SigBox(name, page, block=..., as_signature=...)
#       The grey signature panel inside the block whose heading is `block`.
#   Ruled(name, page, block=..., label=...)
#       The ruled line to the right of `label` inside block `block`.
#
# `tooltip` defaults to the located placeholder text; override to set it
# explicitly (required for checkboxes / signature blocks, which have none).


@dataclass
class Spec:
    name: str
    page: int                      # 1-based
    kind: str                      # text | checkbox | signature | text_on_rule
    locator: dict[str, Any]
    multiline: bool = False
    tooltip: Optional[str] = None
    check_color: tuple[float, float, float] = CHECK_DARK


def Text(name, page, *, placeholder, label, multiline=False, tooltip=None):
    return Spec(name, page, "text",
                {"via": "grey_box", "placeholder": placeholder, "label": label},
                multiline=multiline, tooltip=tooltip)


def Check(name, page, *, caption, check=CHECK_DARK, tooltip=None):
    return Spec(name, page, "checkbox",
                {"via": "square_left_of", "caption": caption},
                tooltip=tooltip, check_color=check)


def SigBox(name, page, *, block, as_signature=True, tooltip=None):
    return Spec(name, page, "signature" if as_signature else "text",
                {"via": "signature_panel", "block": block}, tooltip=tooltip)


def Ruled(name, page, *, block, label, tooltip=None):
    return Spec(name, page, "text_on_rule",
                {"via": "ruled_line", "block": block, "label": label},
                tooltip=tooltip)


PAGE_MARKETING = 3
PAGE_ISSUER = 3
PAGE_DD = 4
PAGE_SIGN = 5

FIELDS: list[Spec] = [
    # ---------------------------------------------------------------- page 3
    # Optional services · 3. Marketing -- four opt-in checkboxes.
    Check("marketing_publications", PAGE_MARKETING,
          caption="Publications",
          tooltip="Tick to include Publications"),
    Check("marketing_partnerships_co_marketing", PAGE_MARKETING,
          caption="Partnerships & Co-Marketing",
          tooltip="Tick to include Partnerships & Co-Marketing"),
    Check("marketing_dashboard_placements", PAGE_MARKETING,
          caption="Dashboard Placements",
          tooltip="Tick to include Dashboard Placements"),
    Check("marketing_influencer_marketing", PAGE_MARKETING,
          caption="Influencer Marketing",
          tooltip="Tick to include Influencer Marketing"),

    # Token issuer information · 1. Issuer / Applicant
    Text("issuer_legal_name", PAGE_ISSUER,
         placeholder="Full registered name",
         label="Legal name of the issuing entity"),
    Text("issuer_jurisdiction_of_incorporation", PAGE_ISSUER,
         placeholder="Country of incorporation",
         label="In which jurisdiction is the company incorporated"),
    Text("issuer_company_address", PAGE_ISSUER,
         placeholder="Street, postcode, city, country",
         label="Company address"),
    Text("issuer_company_register_no", PAGE_ISSUER,
         placeholder="if available or similar unique national identifier",
         label="Company register No."),
    Text("issuer_lei", PAGE_ISSUER,
         placeholder="20-character code; if available",
         label="LEI"),
    Text("issuer_fatca_id", PAGE_ISSUER,
         placeholder="6-character code; if available",
         label="FATCA-ID"),
    Text("issuer_giin", PAGE_ISSUER,
         placeholder="19-character code; if available",
         label="GIIN"),
    Text("issuer_primary_business_contact", PAGE_ISSUER,
         placeholder="Full name, email, phone",
         label="Primary business contact", multiline=True),
    Text("issuer_legal_compliance_contact", PAGE_ISSUER,
         placeholder="Full name, email, phone",
         label="Legal / Compliance contact", multiline=True),

    # ---------------------------------------------------------------- page 4
    # 2. Due diligence
    Text("dd_ubo_signatory_1", PAGE_DD,
         placeholder="Full name, email, phone",
         label="UBO with signatory power 1", multiline=True),
    Text("dd_representative_1", PAGE_DD,
         placeholder="Full name, email, phone",
         label="Representative 1", multiline=True),

    # 3. Securities offering data
    Text("offering_token_name", PAGE_DD,
         placeholder="Name of the token as it will be listed",
         label="Token name"),
    Text("offering_isin", PAGE_DD,
         placeholder="if available", label="ISIN"),
    Text("offering_symbol", PAGE_DD,
         placeholder="Ticker symbol", label="Symbol"),
    Text("offering_token_pairs", PAGE_DD,
         placeholder="e.g. Token/USDC, or EURO stablecoin, etc.",
         label="Which token pairs should be listed"),
    Text("offering_total_token_supply", PAGE_DD,
         placeholder="e.g. 100,000,000 max · placed at listing 20,000,000",
         label="Total token supply"),
    Text("offering_target_go_live_date", PAGE_DD,
         placeholder="Preferred date and any hard external deadlines",
         label="Target go-live date"),
    Text("offering_other_trading_venues", PAGE_DD,
         placeholder="if available", label="Other trading venues"),

    # 4. Technical data
    Text("technical_blockchain_network", PAGE_DD,
         placeholder="e.g. Ethereum mainnet / Polygon / Base — chain ID if non-mainnet",
         label="Blockchain network"),
    Text("technical_token_standard", PAGE_DD,
         placeholder="ERC-20 / ERC-3475 / ERC-3643 — describe wrapper if non-standard",
         label="Token standard"),
    Text("technical_smart_contract_address", PAGE_DD,
         placeholder="0x…", label="Smart contract address"),
    Text("technical_token_price_at_issuance", PAGE_DD,
         placeholder="e.g. 1.00 USDC per token",
         label="Token price at issuance"),
    Text("technical_decimal_precision", PAGE_DD,
         placeholder="18 decimals (standard ERC-20) / 6 decimals (USDC-equivalent)",
         label="Decimal precision"),
    Text("technical_minimum_subscription_amount", PAGE_DD,
         placeholder="specify if different for retail vs. professional investors",
         label="Minimum subscription amount"),
    Text("technical_interest_and_redemption_flow", PAGE_DD,
         placeholder="e.g. Issuer wallet → treasury → investors; redemption within 5 days",
         label="Interest payments & redemption flow"),

    # ---------------------------------------------------------------- page 5
    Check("accept_terms", PAGE_SIGN,
          caption="I accept the terms as outlined in this offer.",
          check=CHECK_LIGHT,
          tooltip="I accept the terms as outlined in this offer."),

    # Signature blocks -- issuer column first, then the Assetera column.
    SigBox("signature_issuer_signature", PAGE_SIGN,
           block="Issuer — Authorized Signatory",
           tooltip="Issuer — Authorized Signatory: signature"),
    Ruled("signature_issuer_name", PAGE_SIGN,
          block="Issuer — Authorized Signatory", label="Name",
          tooltip="Issuer — Authorized Signatory: full name"),
    Ruled("signature_issuer_title", PAGE_SIGN,
          block="Issuer — Authorized Signatory", label="Title",
          tooltip="Issuer — Authorized Signatory: title / function"),
    Ruled("signature_issuer_date", PAGE_SIGN,
          block="Issuer — Authorized Signatory", label="Date",
          tooltip="Issuer — Authorized Signatory: date (DD.MM.YYYY)"),

    SigBox("signature_assetera_signature", PAGE_SIGN,
           block="Assetera GmbH — Countersignature",
           tooltip="Assetera GmbH — Countersignature: signature"),
    Ruled("signature_assetera_name", PAGE_SIGN,
          block="Assetera GmbH — Countersignature", label="Name",
          tooltip="Assetera GmbH — Countersignature: full name"),
    Ruled("signature_assetera_title", PAGE_SIGN,
          block="Assetera GmbH — Countersignature", label="Title",
          tooltip="Assetera GmbH — Countersignature: title / function"),
    Ruled("signature_assetera_date", PAGE_SIGN,
          block="Assetera GmbH — Countersignature", label="Date",
          tooltip="Assetera GmbH — Countersignature: date (DD.MM.YYYY)"),
]

# =============================================================================
# =========================  END OF CONFIG SECTION  ===========================
# =============================================================================

import fitz          # PyMuPDF -- read-only geometry probe   # noqa: E402
import pikepdf       # writer                                # noqa: E402
from pikepdf import Array, Dictionary, Name, String          # noqa: E402


# ----------------------------------------------------------------- utilities

_WS = re.compile(r"\s+")


def norm(s: str) -> str:
    """Whitespace/typography-insensitive comparison key for extracted text."""
    s = unicodedata.normalize("NFKC", s or "")
    # Design tools emit assorted dashes/quotes; fold them so the config can be
    # typed with ordinary characters.
    s = (s.replace("–", "—").replace("—", "—")
           .replace("‘", "'").replace("’", "'")
           .replace("“", '"').replace("”", '"')
           .replace(" ", " "))
    return _WS.sub(" ", s).strip().casefold()


def close_color(rgb_float: Optional[Sequence[float]],
                target_255: Sequence[int]) -> bool:
    if not rgb_float or len(rgb_float) != 3:
        return False
    return all(abs(c * 255 - t) <= COLOR_TOLERANCE
               for c, t in zip(rgb_float, target_255))


def int_color_close(packed: int, target_255: Sequence[int]) -> bool:
    rgb = ((packed >> 16) & 0xFF, (packed >> 8) & 0xFF, packed & 0xFF)
    return all(abs(c - t) <= COLOR_TOLERANCE for c, t in zip(rgb, target_255))


class Unlocatable(Exception):
    """Raised when a configured field cannot be pinned down unambiguously."""


# ------------------------------------------------------- geometry extraction

@dataclass
class TextLine:
    text: str
    rect: fitz.Rect
    color: int
    size: float


@dataclass
class VectorRect:
    rect: fitz.Rect
    fill: Optional[tuple]
    stroke: Optional[tuple]


@dataclass
class PageGeometry:
    index: int                       # 0-based
    height: float
    to_pdf: fitz.Matrix              # fitz page space -> PDF user space
    lines: list[TextLine] = dc_field(default_factory=list)
    rects: list[VectorRect] = dc_field(default_factory=list)

    # -- lookups -------------------------------------------------------------
    def lines_matching(self, text: str) -> list[TextLine]:
        key = norm(text)
        return [l for l in self.lines if norm(l.text) == key]

    def one_line(self, text: str, what: str) -> TextLine:
        hits = self.lines_matching(text)
        if len(hits) != 1:
            raise Unlocatable(
                f"{what}: expected exactly one line reading {text!r} on page "
                f"{self.index + 1}, found {len(hits)}")
        return hits[0]


def probe(doc: fitz.Document) -> list[PageGeometry]:
    """Extract text lines and vector rectangles for every page."""
    pages = []
    for page in doc:
        geo = PageGeometry(index=page.number,
                           height=page.rect.height,
                           to_pdf=~page.transformation_matrix)
        for block in page.get_text("dict")["blocks"]:
            if block["type"] != 0:
                continue
            for line in block["lines"]:
                spans = [s for s in line["spans"] if s["text"].strip()]
                if not spans:
                    continue
                geo.lines.append(TextLine(
                    text="".join(s["text"] for s in line["spans"]),
                    rect=fitz.Rect(line["bbox"]),
                    color=spans[0]["color"],
                    size=max(s["size"] for s in spans),
                ))
        for path in page.get_drawings():
            r = path["rect"]
            if r.width <= 0 or r.height < 0:
                continue
            geo.rects.append(VectorRect(rect=r,
                                        fill=path.get("fill"),
                                        stroke=path.get("color")))
        pages.append(geo)
    return pages


# ------------------------------------------------------------- box discovery

@dataclass
class Located:
    """What a locator hands back to the writer."""
    rect: fitz.Rect                                   # fitz page coords
    placeholder: Optional[str] = None                 # becomes the tooltip
    backdrop: Optional[tuple[float, float, float]] = None  # measured box fill


def _grey_boxes(geo: PageGeometry, height_range, min_width) -> list[VectorRect]:
    lo, hi = height_range
    return [v for v in geo.rects
            if close_color(v.fill, GREY_BOX_FILL)
            and v.rect.width >= min_width
            and lo <= v.rect.height <= hi]


def _smallest_box_containing(boxes: Iterable[VectorRect],
                             inner: fitz.Rect) -> Optional[VectorRect]:
    fits = [b for b in boxes
            if b.rect.x0 - 1 <= inner.x0 and b.rect.x1 + 1 >= inner.x1
            and b.rect.y0 - 1 <= inner.y0 and b.rect.y1 + 1 >= inner.y1]
    if not fits:
        return None
    return min(fits, key=lambda b: b.rect.get_area())


def _left_label(geo: PageGeometry, box: fitz.Rect) -> str:
    """Join the dark label line(s) sitting left of `box`, on its rows."""
    parts = [l for l in geo.lines
             if l.rect.x1 <= box.x0 + 2
             and int_color_close(l.color, LABEL_TEXT_COLOR)
             and box.y0 <= (l.rect.y0 + l.rect.y1) / 2 <= box.y1]
    parts.sort(key=lambda l: (round(l.rect.y0, 1), l.rect.x0))
    return " ".join(p.text.strip() for p in parts)


def locate_grey_box(geo: PageGeometry, spec: Spec):
    """Find the input box whose placeholder + left label match the spec."""
    placeholder = spec.locator["placeholder"]
    want_label = norm(spec.locator["label"])
    boxes = _grey_boxes(geo, INPUT_BOX_HEIGHT_RANGE, INPUT_BOX_MIN_WIDTH)

    hits = []
    for line in geo.lines_matching(placeholder):
        if not int_color_close(line.color, PLACEHOLDER_TEXT_COLOR):
            continue
        box = _smallest_box_containing(boxes, line.rect)
        if box is None:
            continue
        if norm(_left_label(geo, box.rect)) != want_label:
            continue
        hits.append((box, line))

    if len(hits) != 1:
        raise Unlocatable(
            f"{spec.name}: placeholder {placeholder!r} + label "
            f"{spec.locator['label']!r} on page {geo.index + 1} matched "
            f"{len(hits)} boxes (need exactly 1)")

    box, line = hits[0]
    b = box.rect
    # Reuse the placeholder's own left offset so typed text lands exactly
    # where the hint text used to sit.
    pad_left = max(0.0, line.rect.x0 - b.x0)
    rect = fitz.Rect(b.x0 + pad_left, b.y0 + BOX_INSET_Y,
                     b.x1 - BOX_INSET_RIGHT, b.y1 - BOX_INSET_Y)
    return Located(rect, placeholder=line.text.strip(),
                   backdrop=tuple(box.fill) if box.fill else None)


def locate_checkbox(geo: PageGeometry, spec: Spec) -> fitz.Rect:
    caption = geo.one_line(spec.locator["caption"], spec.name)
    lo, hi = CHECKBOX_SIZE_RANGE

    cands = []
    for v in geo.rects:
        r = v.rect
        if not (lo <= r.width <= hi and lo <= r.height <= hi):
            continue
        if abs(r.width - r.height) > CHECKBOX_MAX_ASPECT_SKEW:
            continue
        if r.x1 > caption.rect.x0 + 1:
            continue
        if caption.rect.x0 - r.x1 > CHECKBOX_MAX_GAP:
            continue
        overlap = min(r.y1, caption.rect.y1) - max(r.y0, caption.rect.y0)
        if overlap < CHECKBOX_MIN_VERTICAL_OVERLAP * min(r.height,
                                                         caption.rect.height):
            continue
        cands.append(r)

    if not cands:
        raise Unlocatable(
            f"{spec.name}: no square box left of {spec.locator['caption']!r} "
            f"on page {geo.index + 1}")

    # A rounded outline is drawn as two nested paths; merge overlaps.
    merged: list[fitz.Rect] = []
    for r in sorted(cands, key=lambda r: (r.x0, r.y0)):
        for m in merged:
            if m.intersects(r):
                m |= r
                break
        else:
            merged.append(fitz.Rect(r))

    if len(merged) != 1:
        raise Unlocatable(
            f"{spec.name}: {len(merged)} distinct squares left of "
            f"{spec.locator['caption']!r} on page {geo.index + 1}")
    return Located(merged[0])


def locate_signature_panel(geo: PageGeometry, spec: Spec) -> fitz.Rect:
    heading = geo.one_line(spec.locator["block"], spec.name)
    panels = _grey_boxes(geo, SIGNATURE_BOX_HEIGHT_RANGE,
                         SIGNATURE_BOX_MIN_WIDTH)
    captions = geo.lines_matching(SIGNATURE_BOX_CAPTION)

    hits = [v for v in panels
            if v.rect.x0 - 1 <= heading.rect.x0 <= v.rect.x1 + 1
            and v.rect.y0 >= heading.rect.y1 - 1
            and any(v.rect.contains(c.rect) for c in captions)]
    if len(hits) != 1:
        raise Unlocatable(
            f"{spec.name}: {len(hits)} signature panels under "
            f"{spec.locator['block']!r} on page {geo.index + 1}")
    p = hits[0].rect
    return Located(fitz.Rect(p.x0 + BOX_INSET_Y, p.y0 + BOX_INSET_Y,
                             p.x1 - BOX_INSET_Y, p.y1 - BOX_INSET_Y))


def locate_ruled_line(geo: PageGeometry, spec: Spec) -> fitz.Rect:
    heading = geo.one_line(spec.locator["block"], spec.name)

    # The row label ("Name"/"Title"/"Date") repeats per block; pick the one
    # left-aligned with this block's heading.
    labels = [l for l in geo.lines_matching(spec.locator["label"])
              if abs(l.rect.x0 - heading.rect.x0) <= 2
              and l.rect.y0 > heading.rect.y1]
    if len(labels) != 1:
        raise Unlocatable(
            f"{spec.name}: {len(labels)} {spec.locator['label']!r} labels in "
            f"block {spec.locator['block']!r} on page {geo.index + 1}")
    label = labels[0]

    rules = [v.rect for v in geo.rects
             if v.rect.height <= RULE_MAX_HEIGHT
             and v.rect.width >= RULE_MIN_WIDTH
             and 0 < v.rect.x0 - label.rect.x1 <= RULE_MAX_GAP_FROM_LABEL
             and 0 < v.rect.y0 - label.rect.y1 <= RULE_MAX_DROP_FROM_LABEL]
    if len(rules) != 1:
        raise Unlocatable(
            f"{spec.name}: {len(rules)} ruled lines beside "
            f"{spec.locator['label']!r} in block {spec.locator['block']!r} "
            f"on page {geo.index + 1}")
    rule = rules[0]
    return Located(fitz.Rect(rule.x0, rule.y0 - RULED_LINE_FIELD_HEIGHT,
                             rule.x1, rule.y0))


LOCATORS = {
    "grey_box": locate_grey_box,
    "square_left_of": locate_checkbox,
    "signature_panel": locate_signature_panel,
    "ruled_line": locate_ruled_line,
}


@dataclass
class Placement:
    spec: Spec
    rect_pdf: tuple[float, float, float, float]   # PDF user space
    tooltip: str
    backdrop: Optional[tuple[float, float, float]] = None


def resolve(pages: list[PageGeometry]) -> tuple[list[Placement], list[str]]:
    placements: list[Placement] = []
    problems: list[str] = []
    for spec in FIELDS:
        geo = pages[spec.page - 1]
        try:
            found = LOCATORS[spec.locator["via"]](geo, spec)
        except Unlocatable as exc:
            problems.append(str(exc))
            continue
        pdf_rect = found.rect * geo.to_pdf
        placements.append(Placement(
            spec=spec,
            rect_pdf=(round(pdf_rect.x0, 2), round(pdf_rect.y0, 2),
                      round(pdf_rect.x1, 2), round(pdf_rect.y1, 2)),
            tooltip=spec.tooltip or found.placeholder or spec.name,
            backdrop=found.backdrop,
        ))
    return placements, problems


# ------------------------------------------------------------------- writing

FF_MULTILINE = 1 << 12          # bit 13
ANNOT_FLAG_PRINT = 4            # bit 3


def _fmt(v: float) -> str:
    return f"{v:.4f}".rstrip("0").rstrip(".") or "0"


def _default_appearance() -> str:
    r, g, b = TEXT_COLOR
    return f"/Helv {_fmt(BODY_FONT_SIZE)} Tf {_fmt(r)} {_fmt(g)} {_fmt(b)} rg"


def _form_xobject(pdf, w, h, content=b"", resources=None):
    st = pikepdf.Stream(pdf, content)
    st[Name.Type] = Name.XObject
    st[Name.Subtype] = Name.Form
    st[Name.FormType] = 1
    st[Name.BBox] = Array([0, 0, w, h])
    st[Name.Resources] = resources if resources is not None else Dictionary()
    return pdf.make_indirect(st)


def _check_stream(pdf, w, h, color, zadb_font):
    size = min(w, h) * CHECK_GLYPH["scale"]
    gw = CHECK_GLYPH["width_em"] * size
    gh = CHECK_GLYPH["height_em"] * size
    tx, ty = (w - gw) / 2, (h - gh) / 2
    r, g, b = color
    content = (
        f"q {_fmt(r)} {_fmt(g)} {_fmt(b)} rg BT /ZaDb {_fmt(size)} Tf "
        f"{_fmt(tx)} {_fmt(ty)} Td ({CHECK_GLYPH['char']}) Tj ET Q"
    ).encode("ascii")
    res = Dictionary(Font=Dictionary(ZaDb=zadb_font))
    return _form_xobject(pdf, w, h, content, res)


def build(src: str, dst: str, placements: list[Placement]) -> None:
    pdf = pikepdf.open(src)

    helv = pdf.make_indirect(Dictionary(
        Type=Name.Font, Subtype=Name.Type1,
        BaseFont=Name.Helvetica, Encoding=Name.WinAnsiEncoding))
    zadb = pdf.make_indirect(Dictionary(
        Type=Name.Font, Subtype=Name.Type1, BaseFont=Name.ZapfDingbats))

    acro = Dictionary(
        Fields=Array(),
        DA=String(_default_appearance()),
        DR=Dictionary(Font=Dictionary(Helv=helv, ZaDb=zadb)),
        # Deliberately False.  With NeedAppearances=true some viewers rebuild
        # *every* widget appearance from /MK -- including a default background
        # and border -- which would repaint over the artwork (notably the
        # checkbox inside the purple band).  Fields ship with their own /AP;
        # viewers regenerate the text appearance on typing regardless.
        NeedAppearances=False,
    )
    if any(p.spec.kind == "signature" for p in placements):
        acro[Name.SigFlags] = 3
    pdf.Root[Name.AcroForm] = pdf.make_indirect(acro)

    per_page: dict[int, list] = {}

    for pl in placements:
        spec = pl.spec
        x0, y0, x1, y1 = pl.rect_pdf
        w, h = x1 - x0, y1 - y0
        page = pdf.pages[spec.page - 1]

        widget = Dictionary(
            Type=Name.Annot,
            Subtype=Name.Widget,
            Rect=Array([x0, y0, x1, y1]),
            T=String(spec.name),
            TU=String(pl.tooltip),
            F=ANNOT_FLAG_PRINT,
            P=page.obj,
            MK=Dictionary(),        # no border, no background: visuals unchanged
        )

        if spec.kind == "checkbox":
            widget[Name.FT] = Name.Btn
            widget[Name.Ff] = 0
            widget[Name.V] = Name.Off
            widget[Name.DV] = Name.Off
            widget[Name.AS] = Name.Off
            widget[Name.MK] = Dictionary(CA=String(CHECK_GLYPH["char"]))
            # /DA matters as much as /AP: with NeedAppearances set, a viewer
            # may rebuild the tick from /MK + /DA, so carry the colour here too
            # (this is what keeps the purple-band tick white).
            cr, cg, cb = spec.check_color
            widget[Name.DA] = String(
                f"/ZaDb 0 Tf {_fmt(cr)} {_fmt(cg)} {_fmt(cb)} rg")
            on = _check_stream(pdf, w, h, spec.check_color, zadb)
            off = _form_xobject(pdf, w, h)
            widget[Name.AP] = Dictionary(
                N=Dictionary({"/Off": off, "/Yes": on}),
                D=Dictionary({"/Off": off, "/Yes": on}),
            )
        elif spec.kind == "signature":
            widget[Name.FT] = Name.Sig
            widget[Name.AP] = Dictionary(N=_form_xobject(pdf, w, h))
        else:  # text / text_on_rule
            widget[Name.FT] = Name.Tx
            widget[Name.Ff] = FF_MULTILINE if spec.multiline else 0
            widget[Name.V] = String("")
            widget[Name.DV] = String("")
            widget[Name.DA] = String(_default_appearance())
            widget[Name.Q] = 0      # left aligned, like the placeholders
            if MASK_PLACEHOLDER_WHEN_FILLED and pl.backdrop:
                widget[Name.MK] = Dictionary(
                    BG=Array([float(c) for c in pl.backdrop]))
            widget[Name.AP] = Dictionary(
                N=_form_xobject(pdf, w, h, b"",
                                Dictionary(Font=Dictionary(Helv=helv))))

        ref = pdf.make_indirect(widget)
        acro[Name.Fields].append(ref)
        per_page.setdefault(spec.page - 1, []).append(ref)

    # Tab order: /Annots in config order (reading order), declared explicitly.
    for idx, refs in per_page.items():
        page = pdf.pages[idx]
        existing = list(page.obj.get(Name.Annots, Array()))
        page.obj[Name.Annots] = Array(existing + refs)
        page.obj[Name.Tabs] = Name.A     # annotation-array order

    pdf.save(dst)
    pdf.close()


# ---------------------------------------------------------------- verifying

TYPE_LABEL = {"/Tx": "text", "/Btn": "checkbox", "/Sig": "signature"}


def verify(path: str, expected: Optional[list[Placement]] = None) -> bool:
    print(f"\n=== VERIFICATION: re-opened {path} ===")
    ok = True

    with pikepdf.open(path) as pdf:
        page_of = {pdf.pages[i].obj.objgen: i + 1 for i in range(len(pdf.pages))}
        acro = pdf.Root.get(Name.AcroForm)
        if acro is None:
            print("  !! no /AcroForm"); return False
        fields = list(acro.get(Name.Fields, Array()))

        print(f"{'#':>3}  {'name':<40} {'type':<10} {'ml':<3} {'pg':>2}  "
              f"{'rect (PDF user space)':<34} tooltip")
        print("-" * 132)
        rows = []
        for i, f in enumerate(fields, 1):
            name = str(f.get(Name.T, ""))
            ft = str(f.get(Name.FT, "?"))
            kind = TYPE_LABEL.get(ft, ft)
            ff = int(f.get(Name.Ff, 0))
            ml = "yes" if ff & FF_MULTILINE else "-"
            pg = page_of.get(f.get(Name.P).objgen, "?") if Name.P in f else "?"
            rect = [round(float(v), 2) for v in f[Name.Rect]]
            tu = str(f.get(Name.TU, ""))
            rects = f"[{rect[0]:.1f}, {rect[1]:.1f}, {rect[2]:.1f}, {rect[3]:.1f}]"
            print(f"{i:>3}  {name:<40} {kind:<10} {ml:<3} {pg:>2}  "
                  f"{rects:<34} {tu[:40]}")
            rows.append((name, kind, pg, rect, ff, f))

        print("-" * 132)

        # --- structural assertions -----------------------------------------
        by_kind: dict[str, int] = {}
        for name, kind, *_ in rows:
            by_kind[kind] = by_kind.get(kind, 0) + 1
        print("counts by type:", ", ".join(f"{k}={v}" for k, v in
                                           sorted(by_kind.items())))

        names = [r[0] for r in rows]
        if len(set(names)) != len(names):
            dupes = {n for n in names if names.count(n) > 1}
            print(f"  !! duplicate field names: {sorted(dupes)}"); ok = False

        # every text field must open empty
        non_empty = [r[0] for r in rows
                     if r[1] == "text" and str(r[5].get(Name.V, "")) != ""]
        if non_empty:
            print(f"  !! text fields with a value: {non_empty}"); ok = False
        else:
            print("  ok  all text fields open empty (placeholder is /TU only)")

        checked = [r[0] for r in rows
                   if r[1] == "checkbox" and str(r[5].get(Name.AS)) != "/Off"]
        if checked:
            print(f"  !! checkboxes not Off: {checked}"); ok = False
        else:
            print("  ok  all checkboxes open unchecked")

        missing_tu = [r[0] for r in rows if not str(r[5].get(Name.TU, ""))]
        if missing_tu:
            print(f"  !! fields without a tooltip: {missing_tu}"); ok = False
        else:
            print("  ok  every field carries a /TU tooltip")

        # tab order == /Annots order == top-to-bottom per page
        for pno in sorted({r[2] for r in rows}):
            page_rows = [r for r in rows if r[2] == pno]
            annots = list(pdf.pages[pno - 1].obj.get(Name.Annots, Array()))
            annot_names = [str(a.get(Name.T, "")) for a in annots
                           if Name.T in a]
            if annot_names != [r[0] for r in page_rows]:
                print(f"  !! page {pno}: /Annots order differs from /Fields order")
                ok = False

    if expected is not None:
        want = len(expected)
        got = len(names)
        print(f"\ncount check: intended {want} widgets "
              f"({sum(1 for p in expected if p.spec.kind=='checkbox')} checkbox, "
              f"{sum(1 for p in expected if p.spec.kind=='signature')} signature, "
              f"{sum(1 for p in expected if p.spec.kind in ('text','text_on_rule'))} text)"
              f" -> found {got}  {'OK' if want == got else 'MISMATCH'}")
        if want != got:
            ok = False
        want_names = [p.spec.name for p in expected]
        if want_names != names:
            print("  !! field order/name mismatch vs the config map"); ok = False
        else:
            print("  ok  names and tab order match the config map exactly")

    # --- independent second reader ----------------------------------------
    try:
        from pypdf import PdfReader
        r = PdfReader(path)
        pf = r.get_fields() or {}
        print(f"\ncross-check with pypdf {__import__('pypdf').__version__}: "
              f"get_fields() -> {len(pf)} fields")
        if len(pf) != len(names):
            print("  !! pypdf disagrees with pikepdf on the field count")
            ok = False
    except Exception as exc:                      # pypdf missing or broken
        print(f"\n(pypdf cross-check skipped: {type(exc).__name__}: {exc})")

    print(f"\nRESULT: {'PASS' if ok else 'FAIL'}")
    return ok


# ---------------------------------------------------------------------- main

def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--in", dest="src", default=DEFAULT_INPUT)
    ap.add_argument("--out", dest="dst", default=DEFAULT_OUTPUT)
    ap.add_argument("--verify-only", metavar="PDF",
                    help="only run the verification pass on an existing PDF")
    args = ap.parse_args(argv)

    if args.verify_only:
        return 0 if verify(args.verify_only) else 1

    doc = fitz.open(args.src)
    pages = probe(doc)
    print(f"probed {len(pages)} pages of {args.src}")

    placements, problems = resolve(pages)
    doc.close()

    print(f"located {len(placements)} of {len(FIELDS)} configured fields")
    if problems:
        print("\n!! COULD NOT LOCATE (skipped rather than guessed):")
        for p in problems:
            print("   -", p)
        print()

    build(args.src, args.dst, placements)
    print(f"wrote {args.dst}")

    ok = verify(args.dst, placements)
    if problems:
        print(f"\nNOTE: {len(problems)} configured field(s) were skipped; "
              f"see the list above.")
        ok = False
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())

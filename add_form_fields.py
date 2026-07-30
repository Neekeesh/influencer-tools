#!/usr/bin/env python3
"""
Add a real AcroForm field layer to Assetera package PDFs.

The source PDFs are design-tool exports: they *look* like forms but the
input boxes, checkboxes, signature panels and ruled lines are plain
vector art.  This script finds those elements by *content* and drops
correctly sized interactive widgets on top of them.  No page coordinate
is hardcoded, so the output survives a re-export with minor layout
shifts.

One engine, many documents
--------------------------
All locating and writing logic is shared.  Each document contributes a
DocumentConfig -- field list (label -> hint -> type), checkbox captions,
signature block/row captions, tab order.  Adding a third document means
adding a config block, not touching the writer.

Locating strategy
-----------------
Rows are anchored on the dark left-hand LABEL (multi-line labels are
joined), with the small grey hint beneath it as a secondary
disambiguator.  The input box is then the grey rounded rect on the same
row: to the right of the label, vertically overlapping it.  Anything
that does not resolve to exactly one target is reported, never guessed.

Single-line vs multiline is *derived from the document*: the located box
heights are clustered and the threshold is the midpoint of the widest
gap.  A document with one cluster gets all single-line fields.

Library choice
--------------
Writing: **pikepdf**.  This job needs hand-built /AP appearance streams
    (the white tick on document A's purple band), real /FT /Sig fields,
    and precise /Annots ordering for tab order.  pikepdf is a thin,
    well-typed wrapper over the object model (qpdf underneath), so all
    three are plain dictionary writes and page content is never touched.
    pypdf's field helpers are higher level and steer you toward
    NeedAppearances, which is exactly what has to be avoided here.

Reading: **PyMuPDF**, read-only.  Locating needs glyph positions *and*
    vector-art rectangles; neither pypdf nor pikepdf exposes both, and
    these files' Type3 subset fonts defeat naive text extraction.
    PyMuPDF is AGPL -- it is used only by `probe()`, which can be
    swapped for pdfplumber without touching the writer.

Verify: pikepdf + pypdf, two independent readers, so a malformed write
    shows up as disagreement rather than silence.

Requires: pikepdf, pymupdf, pypdf

Usage:
    python3 add_form_fields.py                 # build every document
    python3 add_form_fields.py --only doc_a
    python3 add_form_fields.py --shift-test    # re-export robustness check
    python3 add_form_fields.py --verify-only out.pdf
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
# END-OF-CONFIG banner.  No page coordinate appears anywhere in this file.

# ---------------------------------------------------------------- appearance
# Body text in these documents measures 8.6 pt (hints) / 10.52 pt (labels).
BODY_FONT_SIZE = 10.0

# Dark ink the documents use for real content (#151421) -- deliberately not
# the grey of the hint text.
TEXT_COLOR = (0x15 / 255, 0x14 / 255, 0x21 / 255)

CHECK_DARK = TEXT_COLOR              # tick on a white/pale checkbox
CHECK_LIGHT = (1.0, 1.0, 1.0)        # tick on a saturated background

# Padding inside a located grey box, so the widget does not overhang the
# rounded corners and typed text is not flush against the edge.
BOX_PAD_LEFT = 8.0
BOX_PAD_RIGHT = 4.0
BOX_PAD_Y = 1.0

# Height of a text widget sitting on a ruled signature line.
RULED_LINE_FIELD_HEIGHT = 16.0

# ZapfDingbats glyph "4" == U+2713 CHECK MARK.  Metrics as a fraction of the
# font size (from the ZapfDingbats AFM); used to centre the tick in its box.
CHECK_GLYPH = {"char": "4", "width_em": 0.788, "height_em": 0.79, "scale": 0.72}

# ------------------------------------------------------- element recognition
COLOR_TOLERANCE = 12  # per 8-bit channel

HINT_TEXT_COLOR = (0x82, 0x8C, 0x99)     # small grey hint under the label
GREY_BOX_FILL = (0xF2, 0xF1, 0xF6)       # the rounded input boxes

# Page furniture that must never be mistaken for a hint line.  Matched
# against the whole line, case-insensitively.
FOOTER_TEXT_PATTERNS = (r"^www\.", r"^\d{1,3}$")

# Label blocks: consecutive lines are joined when they share a left edge,
# share a colour and size, and follow each other closely.
LABEL_JOIN_MAX_GAP = 3.0
LABEL_JOIN_X_TOL = 1.0

# Hint blocks: grey lines starting below the label block, same left edge.
HINT_MAX_GAP = 6.0
HINT_X_TOL = 1.5
# "USDC-" + "equivalent" -> "USDC-equivalent" rather than "USDC- equivalent".
JOIN_HYPHENATED_HINTS = True

# Row input boxes.
INPUT_BOX_MIN_WIDTH = 100.0
INPUT_BOX_HEIGHT_RANGE = (12.0, 60.0)
ROW_BOX_MIN_OVERLAP = 0.5          # fraction of the label block's height
ROW_BOX_MAX_GAP = 400.0            # label right edge -> box left edge

# The large grey signature panel.
SIGNATURE_PANEL_MIN_WIDTH = 120.0
SIGNATURE_PANEL_HEIGHT_RANGE = (45.0, 160.0)
SIGNATURE_BLOCK_X_TOL = 3.0        # heading left edge vs panel left edge

# Signature rows (Name / Title / Date).  The target is either a grey box
# (document B) or a thin ruled line (document A); both are accepted, box
# first.  This is one code path, not two.
SIGNATURE_ROW_MAX_GAP = 60.0       # label right edge -> box/rule left edge
RULE_MAX_HEIGHT = 2.5
RULE_MIN_WIDTH = 50.0
RULE_MAX_DROP_FROM_LABEL = 18.0

# Checkboxes: a near-square rect immediately left of its caption.
CHECKBOX_SIZE_RANGE = (9.0, 26.0)
CHECKBOX_MAX_ASPECT_SKEW = 3.0
CHECKBOX_MAX_GAP = 60.0
CHECKBOX_MIN_VERTICAL_OVERLAP = 0.4

# ------------------------------------------------- height clustering (types)
# The single/multiline threshold is derived per document from the located
# box heights: split at the midpoint of the widest gap, but only if that gap
# is genuinely dominant.  Otherwise the document has one cluster and every
# field is single-line.
HEIGHT_CLUSTER_MIN_GAP = 4.0       # pt; smaller gaps are within-cluster noise
HEIGHT_CLUSTER_GAP_RATIO = 2.5     # widest gap must beat the runner-up by this
HEIGHT_AMBIGUITY_BAND = 1.5        # pt either side of the threshold

# --------------------------------------------------------- contact splitting
# A hint of "Full name, email, phone" means one box holding three answers.
# Split it into three single-line fields: stacked if the box is tall enough
# to give each row a usable height, otherwise side by side.
CONTACT_PARTS = ("name", "email", "phone")
CONTACT_PART_LABELS = ("Full name", "Email", "Phone")
CONTACT_MIN_STACK_ROW_HEIGHT = 13.0        # per row, to allow stacking
CONTACT_COLUMN_WEIGHTS = (0.32, 0.40, 0.28)  # name / email / phone
CONTACT_COLUMN_GUTTER = 6.0

# ---------------------------------------------------------------- field map
# Constructors used by the per-document field lists below.
#
#   Row(name, page, label=..., hint=..., kind=...)
#       kind: "auto"     -> single or multi, decided by the height clusters
#             "single"   -> force single-line
#             "multi"    -> force multiline
#             "contact3" -> split into _name / _email / _phone
#       hint is a secondary disambiguator, used when a label matches more
#       than one block; a mismatch elsewhere is reported as a warning.
#
#   Check(name, page, caption=..., check=...)
#   Signature(prefix, page, block=..., rows=...)
#       expands to <prefix>_signature (/FT /Sig) plus one text field per row.


@dataclass
class Spec:
    name: str
    page: int                       # 1-based
    kind: str                       # row | checkbox | signature | signature_row
    locator: dict[str, Any]
    sizing: str = "auto"            # auto | single | multi | contact3
    tooltip: Optional[str] = None
    check_color: tuple[float, float, float] = CHECK_DARK


def Row(name, page, *, label, hint=None, kind="auto", tooltip=None):
    return Spec(name, page, "row", {"label": label, "hint": hint},
                sizing=kind, tooltip=tooltip)


def Check(name, page, *, caption, check=CHECK_DARK, tooltip=None):
    return Spec(name, page, "checkbox", {"caption": caption},
                tooltip=tooltip, check_color=check)


def Signature(prefix, page, *, block, rows=("Name", "Title", "Date")):
    out = [Spec(f"{prefix}_signature", page, "signature", {"block": block},
                tooltip=f"{block}: signature")]
    for row in rows:
        out.append(Spec(f"{prefix}_{row.lower()}", page, "signature_row",
                        {"block": block, "row": row},
                        sizing="single", tooltip=f"{block}: {row.lower()}"))
    return out


@dataclass
class DocumentConfig:
    key: str
    src: str
    out: str
    signature_caption: str          # grey caption drawn inside the sig panel
    fields: list[Spec]              # config order == tab order


# --------------------------------------------------------------------------
# Document A -- Token Listing Package (7 pages, revised layout)
# --------------------------------------------------------------------------

DOC_A = DocumentConfig(
    key="doc_a",
    src="Token_Listing_Package.pdf",
    out="Token_Listing_Package_-_Fillable.pdf",
    signature_caption="Signature",
    fields=[
        # ---- page 3: Optional services - 3. Marketing ----
        Check("marketing_publications", 3, caption="Publications"),
        Check("marketing_partnerships_co_marketing", 3,
              caption="Partnerships & Co-Marketing"),
        Check("marketing_dashboard_placements", 3,
              caption="Dashboard Placements"),
        Check("marketing_influencer_marketing", 3,
              caption="Influencer Marketing"),

        # ---- page 3: Token issuer information - 1. Issuer / Applicant ----
        Row("issuer_legal_name", 3,
            label="Legal name of the issuing entity",
            hint="Full registered name"),
        Row("issuer_jurisdiction_of_incorporation", 3,
            label="In which jurisdiction is the company incorporated",
            hint="Country of incorporation"),
        Row("issuer_company_address", 3,
            label="Company address",
            hint="Street, postcode, city, country"),
        Row("issuer_company_register_no", 3,
            label="Company register No.",
            hint="if available or similar unique national identifier"),
        Row("issuer_lei", 3, label="LEI",
            hint="20-character code; if available"),
        Row("issuer_fatca_id", 3, label="FATCA-ID",
            hint="6-character code; if available"),
        Row("issuer_giin", 3, label="GIIN",
            hint="19-character code; if available"),
        Row("issuer_primary_business_contact", 3,
            label="Primary business contact",
            hint="Full name, email, phone", kind="contact3"),
        Row("issuer_legal_compliance_contact", 3,
            label="Legal / Compliance contact",
            hint="Full name, email, phone", kind="contact3"),

        # ---- page 4: 2. Due diligence ----
        Row("dd_ubo_signatory_1", 4,
            label="UBO with signatory power 1",
            hint="Full name, email, phone", kind="contact3"),
        Row("dd_representative_1", 4,
            label="Representative 1",
            hint="Full name, email, phone", kind="contact3"),

        # ---- page 4: 3. Securities offering data ----
        Row("offering_token_name", 4, label="Token name",
            hint="Name of the token as it will be listed"),
        Row("offering_isin", 4, label="ISIN", hint="if available"),
        Row("offering_symbol", 4, label="Symbol", hint="Ticker symbol"),
        Row("offering_token_pairs", 4,
            label="Which token pairs should be listed",
            hint="e.g. Token/USDC, or EURO stablecoin, etc."),
        Row("offering_total_token_supply", 4, label="Total token supply",
            hint="e.g. 100,000,000 max · placed at listing 20,000,000"),
        Row("offering_target_go_live_date", 4, label="Target go-live date",
            hint="Preferred date and any hard external deadlines"),
        Row("offering_other_trading_venues", 4, label="Other trading venues",
            hint="if available"),

        # ---- page 4: 4. Technical data ----
        Row("technical_blockchain_network", 4, label="Blockchain network",
            hint="e.g. Ethereum mainnet / Polygon / Base — chain ID if non-mainnet"),
        Row("technical_token_standard", 4, label="Token standard",
            hint="ERC-20 / ERC-3475 / ERC-3643 — describe wrapper if non-standard"),
        Row("technical_smart_contract_address", 4,
            label="Smart contract address", hint="0x…"),
        Row("technical_token_price_at_issuance", 4,
            label="Token price at issuance", hint="e.g. 1.00 USDC per token"),
        Row("technical_decimal_precision", 4, label="Decimal precision",
            hint="18 decimals (standard ERC-20) / 6 decimals (USDC-equivalent)"),
        Row("technical_minimum_subscription_amount", 4,
            label="Minimum subscription amount",
            hint="specify if different for retail vs. professional investors"),
        Row("technical_interest_and_redemption_flow", 4,
            label="Interest payments & redemption flow",
            hint="e.g. Issuer wallet → treasury → investors; redemption within 5 days"),

        # ---- page 5: acceptance + signatures ----
        # White tick: this checkbox is an outline on a saturated purple band.
        Check("accept_terms", 5,
              caption="I accept the terms as outlined in this offer.",
              check=CHECK_LIGHT),
        *Signature("signature_issuer", 5, block="Issuer — Authorized Signatory"),
        *Signature("signature_assetera", 5,
                   block="Assetera GmbH — Countersignature"),
    ],
)


# --------------------------------------------------------------------------
# Document B -- Tokenization & Listing Package (13 pages; 9-13 are GTC prose)
# --------------------------------------------------------------------------

DOC_B = DocumentConfig(
    key="doc_b",
    src="Tokenization_&_Listing_Package.pdf",
    out="Tokenization_&_Listing_Package_-_Fillable.pdf",
    signature_caption="Digital signature",
    fields=[
        # ---- page 2: 1. Tokenization and listing ----
        Check("service_smart_contract_audit", 2, caption="Smart Contract Audit"),
        Check("service_management_registry_admin_tool", 2,
              caption="Management, Registry, Maintenance and Admin Tool (monthly)"),

        # ---- page 3: Optional services - 3. Marketing ----
        Check("marketing_publications", 3, caption="Publications"),
        Check("marketing_partnerships_co_marketing", 3,
              caption="Partnerships & Co-Marketing"),
        Check("marketing_dashboard_placements", 3,
              caption="Dashboard Placements"),
        Check("marketing_influencer_marketing", 3,
              caption="Influencer Marketing"),

        # ---- page 4: Optional services - 4. Legal and regulatory ----
        Check("legal_structuring", 4, caption="Legal Structuring"),
        Check("legal_regulatory_documentation", 4,
              caption="Regulatory Documentation"),

        # ---- page 4: Token issuer information - 1. Issuer / Applicant ----
        Row("issuer_legal_name", 4,
            label="Legal name of the issuing entity",
            hint="Full registered name"),
        Row("issuer_jurisdiction_of_incorporation", 4,
            label="In which jurisdiction is the company incorporated",
            hint="Country of incorporation"),
        Row("issuer_company_address", 4, label="Company address",
            hint="Street, postcode, city, country"),
        Row("issuer_company_register_no", 4, label="Company register No.",
            hint="If available, or similar unique national identifier"),
        Row("issuer_financial_licenses", 4,
            label="Does the company hold any financial licenses or regulatory authorizations",
            hint="e.g. MiFID II, AIFMD, UCITS, SEC-registered"),
        Row("issuer_planned_legal_structure", 4,
            label="What is the planned legal structure for the issuance",
            hint="NewCo / SPV / Fund Compartment (e.g. Luxembourg) / Existing entity — describe"),
        Row("issuer_lei", 4, label="LEI",
            hint="20-character code; if available"),
        Row("issuer_fatca_id", 4, label="FATCA-ID",
            hint="6-character code; if available"),
        Row("issuer_giin", 4, label="GIIN",
            hint="19-character code; if available"),
        Row("issuer_primary_business_contact", 4,
            label="Primary business contact",
            hint="Full name, email, phone", kind="contact3"),
        Row("issuer_legal_compliance_contact", 4,
            label="Legal / Compliance contact",
            hint="Full name, email, phone", kind="contact3"),

        # ---- page 5: 2. Due diligence ----
        Row("dd_ubo_signatory_1", 5, label="UBO with signatory power 1",
            hint="Full name, email, phone", kind="contact3"),
        Row("dd_representative_1", 5, label="Representative 1",
            hint="Full name, email, phone", kind="contact3"),

        # ---- page 5: 3. Asset to be tokenized ----
        Row("asset_type", 5,
            label="What type of asset or product is to be tokenized",
            hint="Asset class and investment structure — e.g. real estate, private credit, bond, equity, fund interest, commodity, infrastructure, receivable"),
        Row("asset_description", 5,
            label="Please describe the underlying asset in detail",
            hint="Structure, revenue model, and key risks"),
        Row("asset_new_or_existing", 5,
            label="Is this a new product, or an existing product / fund being tokenized",
            hint="Newly established product, or an existing fund / asset / instrument"),
        Row("asset_target_issuance_volume_eur", 5,
            label="What is the target total issuance volume in EUR",
            hint="Expected aggregate issuance amount (hard cap) in EUR"),
        Row("asset_open_or_closed_ended", 5,
            label="Is the product open-ended or closed-ended",
            hint="Open-ended (continuous subscriptions and redemptions) or closed-ended (defined fundraising period)"),
        Row("asset_listing_start_date", 5,
            label="What is the intended listing / offering start date",
            hint="Expected launch date, including any pre-marketing, private placement or public offering phases"),
        Row("asset_maturity_or_redemption_date", 5,
            label="Is there a maturity date or planned redemption date",
            hint="Contractual maturity, expected term or redemption timeline; if none, describe the intended exit and liquidity"),

        # ---- page 5: 4. Product governance data ----
        Row("governance_client_knowledge_level", 5,
            label="At what client knowledge & experience level is the product targeted",
            hint="Basic (general investor) / Informed (some financial knowledge) / Advanced (professional, institutional)"),
        Row("governance_investor_risk_tolerance", 5,
            label="What is the investor risk tolerance for this product",
            hint="Conservative / Balanced / Risk-oriented or speculative"),
        Row("governance_negative_target_market", 5,
            label="Negative target market (who should NOT invest)",
            hint="e.g. Retail clients / Investors requiring capital protection / Execution-only clients"),
        Row("governance_eligible_investor_types", 5,
            label="Which investor types are eligible to invest",
            hint="Retail / Professional / Institutional / Qualified Purchaser / Accredited Investor only"),

        # ---- page 6: 5. Securities offering data ----
        Row("offering_token_name", 6, label="Token name",
            hint="Name of the token as it will be listed"),
        Row("offering_isin", 6, label="ISIN",
            hint="To be requested: Yes / No"),
        Row("offering_symbol", 6, label="Symbol", hint="Ticker symbol"),
        Row("offering_token_pair", 6,
            label="Which token pair should be listed",
            hint="e.g. Token/USDC (USD stablecoin) or Token/EURO stablecoin"),
        Row("offering_total_token_supply", 6, label="Total token supply",
            hint="e.g. 100,000,000 tokens (max)"),
        Row("offering_total_volume_on_assetera", 6,
            label="Total token volume on Assetera",
            hint="e.g. Assetera volume at listing: 20,000,000"),
        Row("offering_fee_structure", 6,
            label="What is the fee structure for this product",
            hint="Management fee (% p.a.) / Performance fee / Carried interest / Servicing fee / Subscription fee — list all"),
        Row("offering_target_go_live_date", 6, label="Target go-live date",
            hint="Preferred date and any hard external deadlines"),
        Row("offering_redemption_terms", 6,
            label="Are there redemption or repayment terms planned",
            hint="At maturity / Early redemption window / On investor request — describe conditions"),
        Row("offering_payment_currency", 6,
            label="In which currency will investors make payment and receive payouts",
            hint="EUR stablecoin / USD stablecoin / Fiat"),
        Row("offering_generates_yield", 6,
            label="Does the product generate interest, dividends, or coupon payments",
            hint="Yes — describe yield source / No"),
        Row("offering_yield_terms", 6,
            label="If yield-bearing — rate, payment frequency, and lock-in period",
            hint="e.g. 6% p.a. fixed, paid quarterly, 1-year lock-in then quarterly redemptions"),
        Row("offering_interest_and_redemption_flow", 6,
            label="Intended interest payments & redemption flow",
            hint="e.g. Issuer → Assetera → investor accounts; redemptions within 5 business days"),

        # ---- page 7: 6. Technical data ----
        Row("technical_blockchain_network", 7, label="Blockchain network",
            hint="e.g. Ethereum mainnet / Polygon mainnet / Base"),
        Row("technical_token_standard", 7, label="Token standard",
            hint="ERC-20 / ERC-3475 / ERC-3643 — if available"),
        Row("technical_smart_contract_address", 7,
            label="Smart contract address", hint="0x… — to be filled"),
        Row("technical_token_price_at_issuance", 7,
            label="Token price at issuance", hint="e.g. 1.00 USDC per token"),
        Row("technical_decimal_precision", 7, label="Decimal precision",
            hint="18 decimals (standard ERC-20) / 6 decimals (USDC-equivalent)"),
        Row("technical_minimum_subscription_amount", 7,
            label="Minimum subscription amount", hint="e.g. 1,000 USDC"),
        Row("technical_assetera_maintains_register", 7,
            label="Should Assetera maintain the investor register on behalf of the issuer",
            hint="Yes / No — if no, describe who maintains it"),
        Row("technical_list_on_secondary_marketplace", 7,
            label="Should tokens be listed on Assetera's secondary trading marketplace",
            hint="Yes, after distribution / No secondary trading"),
        Row("technical_other_trading_venues", 7,
            label="Other trading venues", hint="If available"),

        # ---- page 8: acceptance + signatures ----
        # Dark tick: unlike document A this checkbox is white-filled on a pale
        # lavender band, so the standard dark tick reads correctly.
        Check("accept_terms", 8,
              caption="I accept the terms as outlined in this offer.",
              check=CHECK_DARK),
        *Signature("signature_issuer", 8, block="Issuer — Authorized Signatory"),
        *Signature("signature_assetera", 8,
                   block="Assetera GmbH — Countersignature"),
    ],
)

DOCUMENTS = [DOC_A, DOC_B]

# =============================================================================
# =========================  END OF CONFIG SECTION  ===========================
# =============================================================================

import fitz          # PyMuPDF -- read-only geometry probe   # noqa: E402
import pikepdf       # writer                                # noqa: E402
from pikepdf import Array, Dictionary, Name, String          # noqa: E402


# ----------------------------------------------------------------- utilities

_WS = re.compile(r"\s+")
_FOOTER_RE = tuple(re.compile(p, re.I) for p in FOOTER_TEXT_PATTERNS)


def norm(s: str) -> str:
    """Whitespace/typography-insensitive comparison key for extracted text."""
    s = unicodedata.normalize("NFKC", s or "")
    s = (s.replace("–", "—")          # en dash -> em dash
           .replace("‘", "'").replace("’", "'")
           .replace("“", '"').replace("”", '"')
           .replace(" ", " "))
    return _WS.sub(" ", s).strip().casefold()


def is_footer_text(s: str) -> bool:
    t = s.strip()
    return any(r.match(t) for r in _FOOTER_RE)


def close_color(rgb_float: Optional[Sequence[float]],
                target_255: Sequence[int]) -> bool:
    if not rgb_float or len(rgb_float) != 3:
        return False
    return all(abs(c * 255 - t) <= COLOR_TOLERANCE
               for c, t in zip(rgb_float, target_255))


def int_color_close(packed: int, target_255: Sequence[int]) -> bool:
    rgb = ((packed >> 16) & 0xFF, (packed >> 8) & 0xFF, packed & 0xFF)
    return all(abs(c - t) <= COLOR_TOLERANCE for c, t in zip(rgb, target_255))


def join_text(parts: Iterable[str]) -> str:
    out = ""
    for p in parts:
        p = p.strip()
        if not p:
            continue
        if not out:
            out = p
        elif JOIN_HYPHENATED_HINTS and out.endswith("-") and p[:1].islower():
            out += p
        else:
            out += " " + p
    return out


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
    to_pdf: fitz.Matrix              # fitz page space -> PDF user space
    lines: list[TextLine] = dc_field(default_factory=list)
    rects: list[VectorRect] = dc_field(default_factory=list)

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
                           to_pdf=~page.transformation_matrix)
        for block in page.get_text("dict")["blocks"]:
            if block["type"] != 0:
                continue
            for line in block["lines"]:
                spans = [s for s in line["spans"] if s["text"].strip()]
                if not spans:
                    continue
                geo.lines.append(TextLine(
                    text="".join(s["text"] for s in line["spans"]).strip(),
                    rect=fitz.Rect(line["bbox"]),
                    color=spans[0]["color"],
                    size=round(max(s["size"] for s in spans), 2)))
        for path in page.get_drawings():
            r = path["rect"]
            if r.width <= 0 or r.height < 0:
                continue
            geo.rects.append(VectorRect(rect=r, fill=path.get("fill"),
                                        stroke=path.get("color")))
        geo.lines.sort(key=lambda l: (round(l.rect.y0, 1), l.rect.x0))
        pages.append(geo)
    return pages


# ------------------------------------------------------- label / hint blocks

@dataclass
class Block:
    text: str
    rect: fitz.Rect


def _label_blocks(geo: PageGeometry, first: TextLine) -> Block:
    """Join `first` with the lines continuing it (same left edge, same style)."""
    parts = [first]
    for line in geo.lines:
        prev = parts[-1]
        if line is prev or line.rect.y0 < prev.rect.y1 - 0.1:
            continue
        if (abs(line.rect.x0 - prev.rect.x0) <= LABEL_JOIN_X_TOL
                and 0 <= line.rect.y0 - prev.rect.y1 <= LABEL_JOIN_MAX_GAP
                and line.color == prev.color
                and abs(line.size - prev.size) < 0.05):
            parts.append(line)
    rect = fitz.Rect(parts[0].rect)
    for p in parts[1:]:
        rect |= p.rect
    return Block(join_text(p.text for p in parts), rect)


def find_label_block(geo: PageGeometry, label: str) -> list[Block]:
    """Every place on the page where the (possibly wrapped) label appears."""
    want = norm(label)
    out = []
    for line in geo.lines:
        if not want.startswith(norm(line.text)):
            continue
        block = _label_blocks(geo, line)
        if norm(block.text) == want:
            # keep the block anchored at its own first line only
            if not any(abs(b.rect.y0 - block.rect.y0) < 0.1
                       and abs(b.rect.x0 - block.rect.x0) < 0.1 for b in out):
                out.append(block)
    return out


def find_hint_block(geo: PageGeometry, label: Block) -> Optional[Block]:
    """The small grey hint directly beneath a label block."""
    parts: list[TextLine] = []
    cursor = label.rect.y1
    for line in geo.lines:
        if not int_color_close(line.color, HINT_TEXT_COLOR):
            continue
        if is_footer_text(line.text):
            continue
        if abs(line.rect.x0 - label.rect.x0) > HINT_X_TOL:
            continue
        if 0 <= line.rect.y0 - cursor <= HINT_MAX_GAP:
            parts.append(line)
            cursor = line.rect.y1
    if not parts:
        return None
    rect = fitz.Rect(parts[0].rect)
    for p in parts[1:]:
        rect |= p.rect
    return Block(join_text(p.text for p in parts), rect)


# ------------------------------------------------------------------ locators

@dataclass
class Located:
    rect: fitz.Rect
    hint: Optional[str] = None
    box_height: Optional[float] = None
    warning: Optional[str] = None


def _grey_boxes(geo: PageGeometry, height_range, min_width) -> list[VectorRect]:
    lo, hi = height_range
    return [v for v in geo.rects
            if close_color(v.fill, GREY_BOX_FILL)
            and v.rect.width >= min_width and lo <= v.rect.height <= hi]


def locate_row(geo: PageGeometry, spec: Spec) -> Located:
    """Label -> (hint) -> the grey box on the same row, to its right."""
    label_text = spec.locator["label"]
    want_hint = spec.locator.get("hint")

    blocks = find_label_block(geo, label_text)
    if not blocks:
        raise Unlocatable(
            f"{spec.name}: no label reading {label_text!r} on page "
            f"{geo.index + 1}")

    warning = None
    hints = {id(b): find_hint_block(geo, b) for b in blocks}

    if len(blocks) > 1 and want_hint:
        narrowed = [b for b in blocks
                    if hints[id(b)] and norm(hints[id(b)].text) == norm(want_hint)]
        if len(narrowed) == 1:
            blocks = narrowed
    if len(blocks) != 1:
        raise Unlocatable(
            f"{spec.name}: label {label_text!r} matched {len(blocks)} blocks "
            f"on page {geo.index + 1}; hint did not disambiguate")

    label = blocks[0]
    hint = hints[id(label)]
    if want_hint and (hint is None or norm(hint.text) != norm(want_hint)):
        warning = (f"{spec.name}: hint is {hint.text if hint else None!r}, "
                   f"config says {want_hint!r}")

    boxes = _grey_boxes(geo, INPUT_BOX_HEIGHT_RANGE, INPUT_BOX_MIN_WIDTH)
    lh = label.rect.height
    hits = [v.rect for v in boxes
            if v.rect.x0 > label.rect.x1
            and v.rect.x0 - label.rect.x1 <= ROW_BOX_MAX_GAP
            and (min(v.rect.y1, label.rect.y1) - max(v.rect.y0, label.rect.y0)
                 >= ROW_BOX_MIN_OVERLAP * lh)]
    if len(hits) != 1:
        raise Unlocatable(
            f"{spec.name}: {len(hits)} input boxes on the row of "
            f"{label_text!r} (page {geo.index + 1}); need exactly 1")

    b = hits[0]
    rect = fitz.Rect(b.x0 + BOX_PAD_LEFT, b.y0 + BOX_PAD_Y,
                     b.x1 - BOX_PAD_RIGHT, b.y1 - BOX_PAD_Y)
    return Located(rect, hint=(hint.text if hint else None),
                   box_height=round(b.height, 1), warning=warning)


def locate_checkbox(geo: PageGeometry, spec: Spec) -> Located:
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

    merged: list[fitz.Rect] = []       # rounded outlines are two nested paths
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


def locate_signature_panel(geo: PageGeometry, spec: Spec,
                           doc: DocumentConfig) -> Located:
    heading = geo.one_line(spec.locator["block"], spec.name)
    panels = _grey_boxes(geo, SIGNATURE_PANEL_HEIGHT_RANGE,
                         SIGNATURE_PANEL_MIN_WIDTH)
    captions = geo.lines_matching(doc.signature_caption)

    hits = [v.rect for v in panels
            if v.rect.x0 - SIGNATURE_BLOCK_X_TOL <= heading.rect.x0 <= v.rect.x1
            and v.rect.y0 >= heading.rect.y1 - 1
            and any(v.rect.contains(c.rect) for c in captions)]
    if len(hits) != 1:
        raise Unlocatable(
            f"{spec.name}: {len(hits)} panels captioned "
            f"{doc.signature_caption!r} under {spec.locator['block']!r} on "
            f"page {geo.index + 1}")
    p = hits[0]
    return Located(fitz.Rect(p.x0 + BOX_PAD_Y, p.y0 + BOX_PAD_Y,
                             p.x1 - BOX_PAD_Y, p.y1 - BOX_PAD_Y))


def locate_signature_row(geo: PageGeometry, spec: Spec) -> Located:
    """Name / Title / Date -- the target is a grey box or a ruled line."""
    heading = geo.one_line(spec.locator["block"], spec.name)
    row = spec.locator["row"]

    labels = [l for l in geo.lines_matching(row)
              if abs(l.rect.x0 - heading.rect.x0) <= SIGNATURE_BLOCK_X_TOL
              and l.rect.y0 > heading.rect.y1]
    if len(labels) != 1:
        raise Unlocatable(
            f"{spec.name}: {len(labels)} {row!r} labels in block "
            f"{spec.locator['block']!r} on page {geo.index + 1}")
    label = labels[0]

    def right_of(r: fitz.Rect) -> bool:
        return 0 < r.x0 - label.rect.x1 <= SIGNATURE_ROW_MAX_GAP

    boxes = [v.rect for v in _grey_boxes(geo, INPUT_BOX_HEIGHT_RANGE,
                                         RULE_MIN_WIDTH)
             if right_of(v.rect)
             and (min(v.rect.y1, label.rect.y1) - max(v.rect.y0, label.rect.y0)
                  >= ROW_BOX_MIN_OVERLAP * label.rect.height)]
    if boxes:
        if len(boxes) != 1:
            raise Unlocatable(
                f"{spec.name}: {len(boxes)} boxes beside {row!r} on page "
                f"{geo.index + 1}")
        b = boxes[0]
        return Located(fitz.Rect(b.x0 + BOX_PAD_LEFT, b.y0 + BOX_PAD_Y,
                                 b.x1 - BOX_PAD_RIGHT, b.y1 - BOX_PAD_Y),
                       box_height=round(b.height, 1))

    rules = [v.rect for v in geo.rects
             if v.rect.height <= RULE_MAX_HEIGHT
             and v.rect.width >= RULE_MIN_WIDTH
             and right_of(v.rect)
             and 0 < v.rect.y0 - label.rect.y1 <= RULE_MAX_DROP_FROM_LABEL]
    if len(rules) != 1:
        raise Unlocatable(
            f"{spec.name}: no box and {len(rules)} ruled lines beside {row!r} "
            f"on page {geo.index + 1}")
    r = rules[0]
    return Located(fitz.Rect(r.x0, r.y0 - RULED_LINE_FIELD_HEIGHT, r.x1, r.y0))


# ------------------------------------------------------- height -> line type

@dataclass
class HeightClusters:
    threshold: Optional[float]
    groups: list[list[float]]
    ambiguous: list[float]

    def is_multiline(self, h: Optional[float]) -> bool:
        return self.threshold is not None and h is not None and h > self.threshold

    def describe(self) -> str:
        if self.threshold is None:
            vals = self.groups[0] if self.groups else []
            return (f"one cluster {vals} -> no tall boxes, "
                    f"every field single-line")
        lo, hi = self.groups
        return (f"two clusters: standard {lo}, tall {hi}; "
                f"threshold {self.threshold:.2f} pt")


def cluster_heights(heights: Iterable[float]) -> HeightClusters:
    vals = sorted({round(h, 1) for h in heights if h is not None})
    if len(vals) < 2:
        return HeightClusters(None, [vals], [])
    gaps = [vals[i + 1] - vals[i] for i in range(len(vals) - 1)]
    widest = max(gaps)
    i = gaps.index(widest)
    runner_up = max([g for j, g in enumerate(gaps) if j != i] or [0.0])
    if (widest >= HEIGHT_CLUSTER_MIN_GAP
            and widest >= HEIGHT_CLUSTER_GAP_RATIO * max(runner_up, 0.01)):
        thr = (vals[i] + vals[i + 1]) / 2
        ambiguous = [v for v in vals if abs(v - thr) <= HEIGHT_AMBIGUITY_BAND]
        return HeightClusters(thr, [vals[:i + 1], vals[i + 1:]], ambiguous)
    return HeightClusters(None, [vals], [])


# ------------------------------------------------------------- placement pass

@dataclass
class Placement:
    name: str
    page: int
    kind: str                      # text | checkbox | signature
    rect_pdf: tuple[float, float, float, float]
    tooltip: str
    multiline: bool = False
    check_color: tuple[float, float, float] = CHECK_DARK


@dataclass
class Resolution:
    placements: list[Placement]
    clusters: HeightClusters
    problems: list[str]
    warnings: list[str]
    row_heights: dict[str, float]
    contact_layout: dict[str, str]


def _contact_rects(box: fitz.Rect) -> tuple[list[fitz.Rect], str]:
    """Three sub-rects inside `box`: stacked if it is tall enough, else columns."""
    n = len(CONTACT_PARTS)
    if box.height >= n * CONTACT_MIN_STACK_ROW_HEIGHT:
        h = box.height / n
        return ([fitz.Rect(box.x0, box.y0 + i * h, box.x1, box.y0 + (i + 1) * h)
                 for i in range(n)], "stacked")
    total = box.width - CONTACT_COLUMN_GUTTER * (n - 1)
    rects, x = [], box.x0
    for w in CONTACT_COLUMN_WEIGHTS:
        rects.append(fitz.Rect(x, box.y0, x + total * w, box.y1))
        x += total * w + CONTACT_COLUMN_GUTTER
    return rects, "side-by-side"


def resolve(doc: DocumentConfig, pages: list[PageGeometry]) -> Resolution:
    problems: list[str] = []
    warnings: list[str] = []
    found: list[tuple[Spec, Located]] = []

    for spec in doc.fields:
        geo = pages[spec.page - 1]
        try:
            if spec.kind == "row":
                loc = locate_row(geo, spec)
            elif spec.kind == "checkbox":
                loc = locate_checkbox(geo, spec)
            elif spec.kind == "signature":
                loc = locate_signature_panel(geo, spec, doc)
            else:
                loc = locate_signature_row(geo, spec)
        except Unlocatable as exc:
            problems.append(str(exc))
            continue
        if loc.warning:
            warnings.append(loc.warning)
        found.append((spec, loc))

    clusters = cluster_heights(
        loc.box_height for spec, loc in found
        if spec.kind == "row" and spec.sizing == "auto")

    placements: list[Placement] = []
    row_heights: dict[str, float] = {}
    contact_layout: dict[str, str] = {}

    for spec, loc in found:
        geo = pages[spec.page - 1]

        def emit(name, rect, tooltip, kind="text", multiline=False):
            r = rect * geo.to_pdf
            placements.append(Placement(
                name=name, page=spec.page, kind=kind,
                rect_pdf=(round(r.x0, 2), round(r.y0, 2),
                          round(r.x1, 2), round(r.y1, 2)),
                tooltip=tooltip, multiline=multiline,
                check_color=spec.check_color))

        tooltip = (spec.tooltip or loc.hint or spec.locator.get("label")
                   or spec.locator.get("caption") or spec.name)

        if spec.kind == "checkbox":
            emit(spec.name, loc.rect, tooltip, kind="checkbox")
            continue
        if spec.kind == "signature":
            emit(spec.name, loc.rect, tooltip, kind="signature")
            continue

        if loc.box_height is not None:
            row_heights[spec.name] = loc.box_height

        if spec.sizing == "contact3":
            rects, layout = _contact_rects(loc.rect)
            contact_layout[spec.name] = layout
            label = spec.locator.get("label", spec.name)
            for part, part_label, rect in zip(CONTACT_PARTS,
                                              CONTACT_PART_LABELS, rects):
                emit(f"{spec.name}_{part}", rect, f"{label}: {part_label}")
            continue

        if spec.sizing == "multi":
            multiline = True
        elif spec.sizing == "single":
            multiline = False
        else:
            multiline = clusters.is_multiline(loc.box_height)
            if loc.box_height in clusters.ambiguous:
                warnings.append(
                    f"{spec.name}: box height {loc.box_height} pt sits within "
                    f"{HEIGHT_AMBIGUITY_BAND} pt of the cluster threshold "
                    f"{clusters.threshold:.2f}; placed SINGLE-line -- set "
                    f"kind= explicitly in the config to override")
                multiline = False
        emit(spec.name, loc.rect, tooltip, multiline=multiline)

    return Resolution(placements, clusters, problems, warnings,
                      row_heights, contact_layout)


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


def _check_stream(pdf, w, h, color, zadb):
    size = min(w, h) * CHECK_GLYPH["scale"]
    gw = CHECK_GLYPH["width_em"] * size
    gh = CHECK_GLYPH["height_em"] * size
    r, g, b = color
    content = (
        f"q {_fmt(r)} {_fmt(g)} {_fmt(b)} rg BT /ZaDb {_fmt(size)} Tf "
        f"{_fmt((w - gw) / 2)} {_fmt((h - gh) / 2)} Td "
        f"({CHECK_GLYPH['char']}) Tj ET Q").encode("ascii")
    return _form_xobject(pdf, w, h, content,
                         Dictionary(Font=Dictionary(ZaDb=zadb)))


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
        # and border -- which repaints over the artwork (notably the checkbox
        # sitting on document A's purple band).  Fields ship with their own
        # /AP; viewers regenerate the text appearance on typing regardless.
        NeedAppearances=False,
    )
    if any(p.kind == "signature" for p in placements):
        acro[Name.SigFlags] = 3
    pdf.Root[Name.AcroForm] = pdf.make_indirect(acro)

    per_page: dict[int, list] = {}

    for pl in placements:
        x0, y0, x1, y1 = pl.rect_pdf
        w, h = x1 - x0, y1 - y0
        page = pdf.pages[pl.page - 1]

        widget = Dictionary(
            Type=Name.Annot, Subtype=Name.Widget,
            Rect=Array([x0, y0, x1, y1]),
            T=String(pl.name), TU=String(pl.tooltip),
            F=ANNOT_FLAG_PRINT, P=page.obj,
            MK=Dictionary(),        # no border, no background: visuals unchanged
        )

        if pl.kind == "checkbox":
            widget[Name.FT] = Name.Btn
            widget[Name.Ff] = 0
            widget[Name.V] = Name.Off
            widget[Name.DV] = Name.Off
            widget[Name.AS] = Name.Off
            widget[Name.MK] = Dictionary(CA=String(CHECK_GLYPH["char"]))
            # /DA matters as much as /AP: a viewer that rebuilds the tick from
            # /MK + /DA must use the same colour the /AP stream uses.
            cr, cg, cb = pl.check_color
            widget[Name.DA] = String(
                f"/ZaDb 0 Tf {_fmt(cr)} {_fmt(cg)} {_fmt(cb)} rg")
            on = _check_stream(pdf, w, h, pl.check_color, zadb)
            off = _form_xobject(pdf, w, h)
            widget[Name.AP] = Dictionary(
                N=Dictionary({"/Off": off, "/Yes": on}),
                D=Dictionary({"/Off": off, "/Yes": on}))
        elif pl.kind == "signature":
            widget[Name.FT] = Name.Sig
            widget[Name.AP] = Dictionary(N=_form_xobject(pdf, w, h))
        else:
            widget[Name.FT] = Name.Tx
            widget[Name.Ff] = FF_MULTILINE if pl.multiline else 0
            widget[Name.V] = String("")
            widget[Name.DV] = String("")
            widget[Name.DA] = String(_default_appearance())
            widget[Name.Q] = 0
            widget[Name.AP] = Dictionary(
                N=_form_xobject(pdf, w, h, b"",
                                Dictionary(Font=Dictionary(Helv=helv))))

        ref = pdf.make_indirect(widget)
        acro[Name.Fields].append(ref)
        per_page.setdefault(pl.page - 1, []).append(ref)

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


def verify(path: str, expected: Optional[list[Placement]] = None,
           quiet_rows: bool = False) -> bool:
    print(f"\n--- verification: re-opened {path}")
    ok = True

    with pikepdf.open(path) as pdf:
        page_of = {pdf.pages[i].obj.objgen: i + 1 for i in range(len(pdf.pages))}
        acro = pdf.Root.get(Name.AcroForm)
        if acro is None:
            print("  !! no /AcroForm")
            return False
        fields = list(acro.get(Name.Fields, Array()))

        rows = []
        if not quiet_rows:
            print(f"{'#':>3}  {'name':<44} {'type':<10} {'ml':<3} {'pg':>2}  "
                  f"{'rect (PDF user space)':<32} tooltip")
            print("-" * 140)
        for i, f in enumerate(fields, 1):
            name = str(f.get(Name.T, ""))
            kind = TYPE_LABEL.get(str(f.get(Name.FT, "?")), str(f.get(Name.FT)))
            ff = int(f.get(Name.Ff, 0))
            ml = "yes" if ff & FF_MULTILINE else "-"
            pg = page_of.get(f[Name.P].objgen, "?") if Name.P in f else "?"
            rect = [round(float(v), 1) for v in f[Name.Rect]]
            tu = str(f.get(Name.TU, ""))
            if not quiet_rows:
                rs = f"[{rect[0]}, {rect[1]}, {rect[2]}, {rect[3]}]"
                print(f"{i:>3}  {name:<44} {kind:<10} {ml:<3} {pg:>2}  "
                      f"{rs:<32} {tu[:44]}")
            rows.append((name, kind, pg, rect, ff, f))
        if not quiet_rows:
            print("-" * 140)

        by_kind: dict[str, int] = {}
        for _, kind, *_ in rows:
            by_kind[kind] = by_kind.get(kind, 0) + 1
        print("  counts by type:", ", ".join(f"{k}={v}" for k, v in
                                             sorted(by_kind.items())),
              f"(total {len(rows)})")

        names = [r[0] for r in rows]
        if len(set(names)) != len(names):
            dupes = sorted({n for n in names if names.count(n) > 1})
            print(f"  !! duplicate field names: {dupes}")
            ok = False
        else:
            print("  ok  no duplicate field names")

        non_empty = [r[0] for r in rows
                     if r[1] == "text" and str(r[5].get(Name.V, "")) != ""]
        if non_empty:
            print(f"  !! text fields with a value: {non_empty}")
            ok = False
        else:
            print("  ok  all text fields open empty (hint lives in /TU only)")

        checked = [r[0] for r in rows
                   if r[1] == "checkbox" and str(r[5].get(Name.AS)) != "/Off"]
        if checked:
            print(f"  !! checkboxes not Off: {checked}")
            ok = False
        else:
            print("  ok  all checkboxes open unchecked")

        missing_tu = [r[0] for r in rows if not str(r[5].get(Name.TU, ""))]
        if missing_tu:
            print(f"  !! fields without a tooltip: {missing_tu}")
            ok = False
        else:
            print("  ok  every field carries a /TU tooltip")

        annots_ok = True
        for pno in sorted({r[2] for r in rows}):
            page_rows = [r[0] for r in rows if r[2] == pno]
            annots = list(pdf.pages[pno - 1].obj.get(Name.Annots, Array()))
            annot_names = [str(a.get(Name.T, "")) for a in annots if Name.T in a]
            if annot_names != page_rows:
                print(f"  !! page {pno}: /Annots order differs from /Fields order")
                annots_ok = ok = False
        if annots_ok:
            print("  ok  /Annots order matches /Fields order on every page")

    if expected is not None:
        want, got = len(expected), len(names)
        print(f"  count check: intended {want} -> found {got}  "
              f"{'OK' if want == got else 'MISMATCH'}")
        if want != got:
            ok = False
        if [p.name for p in expected] != names:
            print("  !! field order/name mismatch vs the config map")
            ok = False
        else:
            print("  ok  names and tab order match the config map exactly")

    try:
        from pypdf import PdfReader
        import pypdf
        pf = PdfReader(path).get_fields() or {}
        agree = len(pf) == len(names)
        print(f"  cross-check with pypdf {pypdf.__version__}: {len(pf)} fields "
              f"-> {'readers agree' if agree else 'READERS DISAGREE'}")
        if not agree:
            ok = False
    except Exception as exc:
        print(f"  (pypdf cross-check skipped: {type(exc).__name__}: {exc})")

    return ok


# ---------------------------------------------------------------------- main

def process(doc: DocumentConfig, src: Optional[str] = None,
            dst: Optional[str] = None, quiet_rows: bool = False) -> bool:
    src = src or doc.src
    dst = dst or doc.out
    print(f"\n{'=' * 78}\n=== {doc.key}: {src}\n{'=' * 78}")

    fitz_doc = fitz.open(src)
    pages = probe(fitz_doc)
    res = resolve(doc, pages)
    fitz_doc.close()

    print(f"configured entries: {len(doc.fields)}  ->  widgets: "
          f"{len(res.placements)}")
    print(f"height clusters: {res.clusters.describe()}")

    if res.clusters.threshold is not None:
        multi = sorted(n for n, h in res.row_heights.items()
                       if res.clusters.is_multiline(h))
        single = sorted(n for n, h in res.row_heights.items()
                        if not res.clusters.is_multiline(h))
        print(f"  multiline ({len(multi)}):")
        for n in multi:
            print(f"      {res.row_heights[n]:5.1f} pt  {n}")
        print(f"  single-line ({len(single)}): "
              f"{', '.join(f'{n}' for n in single)}")
    else:
        print(f"  single-line ({len(res.row_heights)}): every located row")

    if res.contact_layout:
        for name, layout in res.contact_layout.items():
            print(f"  contact split [{layout}]: {name}"
                  f"_{{{','.join(CONTACT_PARTS)}}}")

    if res.warnings:
        print("\n  WARNINGS:")
        for w in res.warnings:
            print("   -", w)
    if res.problems:
        print("\n  !! COULD NOT LOCATE (skipped rather than guessed):")
        for p in res.problems:
            print("   -", p)

    build(src, dst, res.placements)
    print(f"\nwrote {dst}")

    ok = verify(dst, res.placements, quiet_rows=quiet_rows)
    if res.problems:
        ok = False
    print(f"  RESULT: {'PASS' if ok else 'FAIL'}")
    return ok


def shift_test(doc: DocumentConfig, dx: float = 6.5, dy: float = -9.25) -> bool:
    """Re-export robustness: translate every page, expect identical results."""
    import tempfile, os
    print(f"\n### shift test [{doc.key}] translate all pages by ({dx}, {dy})")
    tmp = tempfile.mkdtemp()
    shifted = os.path.join(tmp, "shifted.pdf")
    with pikepdf.open(doc.src) as p:
        for pg in p.pages:
            pg.contents_add(pikepdf.Stream(p, f"q 1 0 0 1 {dx} {dy} cm\n"
                                           .encode()), prepend=True)
            pg.contents_add(pikepdf.Stream(p, b"\nQ\n"), prepend=False)
        p.save(shifted)

    base = fitz.open(doc.src)
    base_res = resolve(doc, probe(base))
    base.close()
    moved = fitz.open(shifted)
    moved_res = resolve(doc, probe(moved))
    moved.close()

    if moved_res.problems:
        print("  !! shifted copy failed to locate:", moved_res.problems)
        return False
    if len(base_res.placements) != len(moved_res.placements):
        print(f"  !! widget count changed: {len(base_res.placements)} -> "
              f"{len(moved_res.placements)}")
        return False
    if base_res.clusters.threshold != moved_res.clusters.threshold:
        print("  !! height clustering changed under shift")
        return False

    worst = 0.0
    for a, b in zip(base_res.placements, moved_res.placements):
        if a.name != b.name or a.multiline != b.multiline:
            print(f"  !! field changed: {a.name} vs {b.name}")
            return False
        want = (a.rect_pdf[0] + dx, a.rect_pdf[1] + dy,
                a.rect_pdf[2] + dx, a.rect_pdf[3] + dy)
        worst = max(worst, max(abs(w - g) for w, g in zip(want, b.rect_pdf)))
    print(f"  ok  {len(base_res.placements)} widgets tracked the shift, "
          f"max deviation {worst:.3f} pt")
    return worst < 0.05


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--only", help="process a single document by config key")
    ap.add_argument("--shift-test", action="store_true",
                    help="run the layout-shift robustness check and exit")
    ap.add_argument("--verify-only", metavar="PDF")
    ap.add_argument("--quiet-rows", action="store_true",
                    help="suppress the per-field table")
    args = ap.parse_args(argv)

    if args.verify_only:
        return 0 if verify(args.verify_only) else 1

    docs = [d for d in DOCUMENTS if not args.only or d.key == args.only]
    if not docs:
        print(f"no document with key {args.only!r}; "
              f"known: {[d.key for d in DOCUMENTS]}")
        return 2

    if args.shift_test:
        return 0 if all(shift_test(d) for d in docs) else 1

    return 0 if all(process(d, quiet_rows=args.quiet_rows)
                    for d in docs) else 1


if __name__ == "__main__":
    sys.exit(main())

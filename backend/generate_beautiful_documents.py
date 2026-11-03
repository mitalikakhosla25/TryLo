"""Generates beautiful, high-fidelity, attractive, and easily readable PDF documents
for TryLo's verified startups and testers using pure vector PDF rendering.

Generates:
1. Nexus_AI_Labs_MCA_Incorporation_Attested.pdf
2. Priya_Patel_Senior_QA_Automation_Attested.pdf
3. ISTQB_CTAL_TAE_Priya_Patel_Attested.pdf
4. AWS_Security_Specialty_Priya_Patel_Attested.pdf
"""

import os
import sys

class PDFCanvas:
    def __init__(self, width=595.28, height=841.89):  # A4 standard
        self.width = width
        self.height = height
        self.ops = []

    def rect(self, x, y, w, h, fill_color=None, stroke_color=None, stroke_width=1):
        if fill_color:
            r, g, b = fill_color
            self.ops.append(f"{r:.3f} {g:.3f} {b:.3f} rg")
        if stroke_color:
            r, g, b = stroke_color
            self.ops.append(f"{r:.3f} {g:.3f} {b:.3f} RG")
            self.ops.append(f"{stroke_width} w")

        self.ops.append(f"{x:.2f} {y:.2f} {w:.2f} {h:.2f} re")
        if fill_color and stroke_color:
            self.ops.append("B")
        elif fill_color:
            self.ops.append("f")
        elif stroke_color:
            self.ops.append("S")

    def line(self, x1, y1, x2, y2, color=(0.7, 0.7, 0.7), width=1):
        r, g, b = color
        self.ops.append(f"{r:.3f} {g:.3f} {b:.3f} RG")
        self.ops.append(f"{width} w")
        self.ops.append(f"{x1:.2f} {y1:.2f} m {x2:.2f} {y2:.2f} l S")

    def text(self, x, y, text_str, font="F2", size=10, color=(0.1, 0.1, 0.1)):
        r, g, b = color
        self.ops.append(f"{r:.3f} {g:.3f} {b:.3f} rg")
        clean_text = (
            text_str.replace("\\", "\\\\")
            .replace("(", "\\(")
            .replace(")", "\\)")
            .encode("latin-1", "replace")
            .decode("latin-1")
        )
        self.ops.append(f"BT /{font} {size} Tf {x:.2f} {y:.2f} Td ({clean_text}) Tj ET")

    def badge(self, x, y, text_str, bg_color=(0.84, 0.94, 0.92), text_color=(0.03, 0.33, 0.35), font="F1", size=8):
        padding_x = 8
        width = len(text_str) * (size * 0.58) + (padding_x * 2)
        height = size + 8
        self.rect(x, y - 2, width, height, fill_color=bg_color, stroke_color=text_color, stroke_width=0.75)
        self.text(x + padding_x, y + 2, text_str, font=font, size=size, color=text_color)
        return width

    def build(self) -> bytes:
        stream_content = "\n".join(self.ops).encode("latin-1")
        stream_len = len(stream_content)

        header = b"%PDF-1.4\n"
        obj1 = b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        obj2 = b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        obj3 = (
            b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 "
            + f"{self.width:.2f} {self.height:.2f}".encode("latin-1")
            + b"] /Contents 4 0 R /Resources << /Font << "
            + b"/F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> "
            + b"/F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> "
            + b"/F3 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >> "
            + b"/F4 << /Type /Font /Subtype /Type1 /BaseFont /Courier >> "
            + b"/F5 << /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >> "
            + b">> >> >>\nendobj\n"
        )
        obj4_header = f"4 0 obj\n<< /Length {stream_len} >>\nstream\n".encode("latin-1")
        obj4_footer = b"\nendstream\nendobj\n"

        offsets = [0]
        curr = len(header)
        offsets.append(curr)
        curr += len(obj1)
        offsets.append(curr)
        curr += len(obj2)
        offsets.append(curr)
        curr += len(obj3)
        offsets.append(curr)
        curr += len(obj4_header) + stream_len + len(obj4_footer)

        xref = (
            b"xref\n0 5\n"
            + b"0000000000 65535 f \n"
            + f"{offsets[1]:010d} 00000 n \n".encode("latin-1")
            + f"{offsets[2]:010d} 00000 n \n".encode("latin-1")
            + f"{offsets[3]:010d} 00000 n \n".encode("latin-1")
            + f"{offsets[4]:010d} 00000 n \n".encode("latin-1")
        )
        trailer = (
            b"trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n"
            + f"{curr}".encode("latin-1")
            + b"\n%%EOF\n"
        )

        return header + obj1 + obj2 + obj3 + obj4_header + stream_content + obj4_footer + xref + trailer


# Color Palettes
C_IVORY = (0.965, 0.961, 0.929)
C_WHITE = (1.000, 1.000, 1.000)
C_DARK = (0.063, 0.165, 0.208)
C_SLATE = (0.322, 0.396, 0.420)
C_TEAL_DARK = (0.027, 0.329, 0.353)
C_TEAL_BRIGHT = (0.031, 0.486, 0.502)
C_AQUA_BG = (0.843, 0.937, 0.922)
C_AQUA_BORDER = (0.737, 0.882, 0.855)
C_EMERALD = (0.055, 0.486, 0.341)
C_EMERALD_BG = (0.902, 0.969, 0.941)
C_AMBER = (0.851, 0.467, 0.024)
C_AMBER_BG = (0.996, 0.953, 0.780)
C_BORDER_LIGHT = (0.863, 0.906, 0.890)
C_NAVY = (0.059, 0.125, 0.235)


def generate_mca_incorporation(output_path: str):
    pdf = PDFCanvas()
    # Canvas Ivory Background
    pdf.rect(0, 0, 595.28, 841.89, fill_color=C_IVORY)

    # Double Outer Frame
    pdf.rect(20, 20, 555.28, 801.89, stroke_color=C_TEAL_DARK, stroke_width=2)
    pdf.rect(24, 24, 547.28, 793.89, stroke_color=C_AQUA_BORDER, stroke_width=0.75)

    # Top Header Band
    pdf.rect(26, 740, 543.28, 75, fill_color=C_TEAL_DARK)
    pdf.text(297.64 - 130, 788, "GOVERNMENT OF INDIA", font="F1", size=15, color=C_WHITE)
    pdf.text(297.64 - 150, 768, "MINISTRY OF CORPORATE AFFAIRS", font="F1", size=13, color=(0.85, 0.95, 0.93))
    pdf.text(297.64 - 135, 750, "REGISTRAR OF COMPANIES, KARNATAKA", font="F2", size=9, color=(0.75, 0.88, 0.86))

    # Certificate Title Block
    pdf.rect(45, 685, 505.28, 42, fill_color=C_WHITE, stroke_color=C_BORDER_LIGHT, stroke_width=1)
    pdf.text(297.64 - 155, 708, "CERTIFICATE OF INCORPORATION", font="F1", size=14, color=C_DARK)
    pdf.text(297.64 - 195, 693, "[Pursuant to sub-section (2) of section 7 of the Companies Act, 2013 and rule 18]", font="F3", size=8, color=C_SLATE)

    # Formal Preamble
    pdf.text(45, 665, "I hereby certify that NEXUS AI TECHNOLOGIES PRIVATE LIMITED is incorporated on this", font="F2", size=9.5, color=C_DARK)
    pdf.text(45, 650, "Fourteenth day of October Two Thousand Twenty-Three under the Companies Act, 2013.", font="F2", size=9.5, color=C_DARK)

    # High-Priority Entity Highlight Card
    pdf.rect(45, 520, 505.28, 115, fill_color=C_WHITE, stroke_color=C_AQUA_BORDER, stroke_width=1.5)
    pdf.rect(45, 605, 505.28, 30, fill_color=C_AQUA_BG)
    pdf.text(58, 615, "OFFICIAL CORPORATE REGISTRATION CREDENTIALS", font="F1", size=10, color=C_TEAL_DARK)

    # Grid labels & values
    pdf.text(58, 582, "Corporate Identity Number (CIN):", font="F1", size=9.5, color=C_SLATE)
    pdf.text(230, 582, "U72900KA2023PTC178942", font="F5", size=11, color=C_TEAL_DARK)

    pdf.text(58, 560, "Legal Entity Name:", font="F1", size=9.5, color=C_SLATE)
    pdf.text(230, 560, "Nexus AI Technologies Private Limited", font="F1", size=10, color=C_DARK)

    pdf.text(58, 538, "GSTIN / Tax Identifier:", font="F1", size=9.5, color=C_SLATE)
    pdf.text(230, 538, "29AABCN8412K1Z9", font="F5", size=10, color=C_DARK)

    # Key Specifications Card
    pdf.rect(45, 335, 505.28, 170, fill_color=C_WHITE, stroke_color=C_BORDER_LIGHT, stroke_width=1)
    pdf.rect(45, 480, 505.28, 25, fill_color=(0.95, 0.95, 0.92))
    pdf.text(58, 488, "STATUTORY PARTICULARS & REGISTERED OFFICE", font="F1", size=9.5, color=C_DARK)

    specs = [
        ("Company Category:", "Company limited by Shares"),
        ("Company Sub-Category:", "Non-govt company, Indian Non-Government Company"),
        ("Class of Company:", "Private Limited (Pvt Ltd)"),
        ("Date of Incorporation:", "14 October 2023 (14/10/2023)"),
        ("Authorized Capital:", "INR 2,500,000 (Twenty-Five Lakh Indian Rupees)"),
        ("Paid-up Capital:", "INR 1,000,000 (Ten Lakh Indian Rupees)"),
        ("Registered Office Address:", "#42 Outer Ring Road, Bellandur, Bengaluru, KA 560103, India"),
    ]
    curr_y = 458
    for label, val in specs:
        pdf.text(58, curr_y, label, font="F1", size=8.5, color=C_SLATE)
        pdf.text(210, curr_y, val, font="F2", size=8.5, color=C_DARK)
        pdf.line(55, curr_y - 4, 535, curr_y - 4, color=(0.93, 0.93, 0.90), width=0.5)
        curr_y -= 19

    # TryLo Anti-Shell Compliance Shield
    pdf.rect(45, 170, 505.28, 150, fill_color=C_EMERALD_BG, stroke_color=C_EMERALD, stroke_width=1.5)
    pdf.rect(45, 290, 505.28, 30, fill_color=C_EMERALD)
    pdf.text(58, 300, "[V] TRYLO ANTI-SHELL INTEGRITY & LEGITIMACY CLEARANCE", font="F1", size=10, color=C_WHITE)

    pdf.text(58, 270, "Validation Status:", font="F1", size=9, color=C_EMERALD)
    pdf.text(180, 270, "BUSINESS VERIFIED & CLEARED FOR BETA CAMPAIGNS", font="F1", size=9, color=C_EMERALD)

    pdf.text(58, 250, "MCA Registry Check:", font="F1", size=9, color=C_SLATE)
    pdf.text(180, 250, "CIN Active & Validated on Ministry of Corporate Affairs Master Data", font="F2", size=9, color=C_DARK)

    pdf.text(58, 230, "Corporate Domain:", font="F1", size=9, color=C_SLATE)
    pdf.text(180, 230, "Validated domain match: @nexusai.io (Founder Aarav Sharma)", font="F2", size=9, color=C_DARK)

    pdf.text(58, 210, "Digital Record Hash:", font="F1", size=9, color=C_SLATE)
    pdf.text(180, 210, "SHA256: 7e93a02b...55f891e4 (Immutable Attestation Ledger)", font="F4", size=8, color=C_SLATE)

    pdf.text(58, 185, "Verification Date:", font="F1", size=9, color=C_SLATE)
    pdf.text(180, 185, "14-Oct-2023 11:42:09 UTC | Status: APPROVED", font="F2", size=9, color=C_DARK)

    # Footer Sign-off
    pdf.line(45, 120, 550, 120, color=C_BORDER_LIGHT, width=1)
    pdf.text(58, 95, "Issued under the seal of the Registrar of Companies, Karnataka.", font="F3", size=8, color=C_SLATE)
    pdf.text(58, 80, "Digitally signed by ROC Officer (DS ROC KARNATAKA 12). Official TryLo Verification Copy.", font="F3", size=8, color=C_SLATE)

    # Signature Stamp
    pdf.rect(380, 45, 170, 60, fill_color=C_WHITE, stroke_color=C_TEAL_DARK, stroke_width=1)
    pdf.text(390, 85, "DIGITALLY SIGNED", font="F1", size=8.5, color=C_TEAL_DARK)
    pdf.text(390, 70, "Registrar of Companies", font="F2", size=8, color=C_DARK)
    pdf.text(390, 55, "Ministry of Corporate Affairs", font="F2", size=7.5, color=C_SLATE)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(pdf.build())
    print(f"Generated: {output_path}")


def generate_tester_resume(output_path: str):
    pdf = PDFCanvas()
    pdf.rect(0, 0, 595.28, 841.89, fill_color=C_IVORY)

    # Outer border
    pdf.rect(20, 20, 555.28, 801.89, stroke_color=C_BORDER_LIGHT, stroke_width=1)

    # Header Executive Banner
    pdf.rect(22, 720, 551.28, 99, fill_color=C_TEAL_DARK)
    pdf.text(45, 785, "PRIYA PATEL", font="F1", size=22, color=C_WHITE)
    pdf.text(45, 762, "Senior QA Automation Engineer & Security Testing Specialist", font="F1", size=11, color=(0.85, 0.95, 0.93))
    pdf.text(45, 740, "Bengaluru, India | priya.patel@trylo.io | github.com/priyapatel-qa | linkedin.com/in/priyapatel-qa", font="F2", size=8.5, color=(0.75, 0.88, 0.86))

    # TryLo Trust Tier Ribbon
    pdf.rect(40, 675, 515.28, 35, fill_color=C_AQUA_BG, stroke_color=C_AQUA_BORDER, stroke_width=1)
    pdf.text(55, 688, "[*] TRYLO TIER 3 TOP-RATED VETTED TESTER", font="F1", size=11, color=C_TEAL_DARK)
    pdf.text(340, 688, "Rating: 5.0 / 5.0 (3 Verified Reviews)", font="F1", size=9.5, color=C_DARK)

    # Executive Bio Card
    pdf.rect(40, 595, 515.28, 68, fill_color=C_WHITE, stroke_color=C_BORDER_LIGHT, stroke_width=1)
    pdf.text(55, 642, "PROFESSIONAL SUMMARY & ATTESTATION", font="F1", size=10, color=C_DARK)
    pdf.text(55, 624, "Over 6+ years of disciplined test engineering specializing in distributed systems, REST/gRPC API", font="F2", size=8.5, color=C_SLATE)
    pdf.text(55, 610, "load verification, concurrency race detection, and end-to-end automation with Playwright and pytest.", font="F2", size=8.5, color=C_SLATE)

    # Core Competencies & Toolchain
    pdf.rect(40, 480, 515.28, 103, fill_color=C_WHITE, stroke_color=C_BORDER_LIGHT, stroke_width=1)
    pdf.text(55, 563, "CORE TESTING COMPETENCIES & TOOLING", font="F1", size=10, color=C_DARK)

    skills = [
        ("Automation Frameworks:", "Playwright, Cypress, Selenium, Appium, Python pytest, Jest"),
        ("API & Microservices:", "REST, GraphQL, gRPC, Postman, k6, Locust Load Testing"),
        ("Security & Pen Testing:", "Burp Suite, OWASP Top 10, JWT Session Resiliency, OAuth 2.0"),
        ("Platforms & Cloud:", "Linux (Ubuntu/Debian), macOS, Docker, Kubernetes, AWS"),
    ]
    sy = 542
    for cat, val in skills:
        pdf.text(55, sy, cat, font="F1", size=8.5, color=C_TEAL_BRIGHT)
        pdf.text(180, sy, val, font="F2", size=8.5, color=C_DARK)
        sy -= 16

    # Verified Attested Experience
    pdf.rect(40, 275, 515.28, 193, fill_color=C_WHITE, stroke_color=C_BORDER_LIGHT, stroke_width=1)
    pdf.text(55, 448, "VERIFIED EXPERIENCE & BETA CAMPAIGN RECORD", font="F1", size=10, color=C_DARK)

    experiences = [
        ("Nexus AI Labs - Beta Contributor (2023 - Present)", "Scope: Nexus AI Core Engine & Distributed Mesh", [
            "- Identified 3 critical concurrency token races during cluster failover testing.",
            "- Supplied reproducible curl commands, wireshark packet traces, and docker compose mocks.",
            "- Rated 5.0/5.0 by Aarav Sharma (Founder): 'Priya is exceptional... gold-standard traces.'",
        ]),
        ("HyperScale Cloud - Performance QA Lead (2022 - 2023)", "Scope: Cloud Gateway & Microservices Migration", [
            "- Conducted 10,000 RPS burst testing, uncovering memory leakage in WebSocket proxies.",
            "- Authored automated regression test suites executed across 4 staging clusters.",
            "- Rated 5.0/5.0 by Sarah Jenkins (Head of Engineering): 'Rigorous and disciplined.'",
        ]),
    ]
    ey = 430
    for title, sub, bullets in experiences:
        pdf.text(55, ey, title, font="F1", size=9, color=C_DARK)
        pdf.text(320, ey, sub, font="F3", size=8, color=C_SLATE)
        ey -= 14
        for b in bullets:
            pdf.text(70, ey, b, font="F2", size=8, color=C_DARK)
            ey -= 12
        ey -= 8

    # Verified Credentials Card
    pdf.rect(40, 160, 515.28, 103, fill_color=C_WHITE, stroke_color=C_BORDER_LIGHT, stroke_width=1)
    pdf.text(55, 243, "VERIFIED LICENSES & CERTIFICATIONS", font="F1", size=10, color=C_DARK)

    certs = [
        ("ISTQB CTAL-TAE", "Certified Tester Advanced Level - Test Automation Engineer", "ID: ISTQB-CTAL-TAE-2023-8821", "VERIFIED"),
        ("AWS Security Specialty", "AWS Certified Security - Specialty", "ID: AWS-SEC-SPEC-99120", "VERIFIED"),
    ]
    cy = 223
    for short, name, cid, st in certs:
        pdf.text(55, cy, f"[*] {name}", font="F1", size=8.5, color=C_DARK)
        pdf.text(380, cy, cid, font="F4", size=8, color=C_SLATE)
        pdf.badge(490, cy - 2, st, bg_color=C_EMERALD_BG, text_color=C_EMERALD, size=7)
        cy -= 20

    # Attestation Seal
    pdf.rect(40, 50, 515.28, 98, fill_color=C_EMERALD_BG, stroke_color=C_EMERALD, stroke_width=1.5)
    pdf.text(55, 126, "[V] TRYLO ATTESTED TALENT VERIFICATION", font="F1", size=10, color=C_EMERALD)
    pdf.text(55, 108, "This curriculum vitae and verified track record have been authenticated by the TryLo Platform.", font="F2", size=8.5, color=C_DARK)
    pdf.text(55, 94, "All listed certifications, employer reviews, and bug resolution histories have been cryptographically", font="F2", size=8.5, color=C_DARK)
    pdf.text(55, 80, "verified against platform logs and third-party credential databases.", font="F2", size=8.5, color=C_DARK)
    pdf.text(55, 62, "Attestation Ledger ID: TRYLO-QA-VET-2024-88392 | Issued for: Priya Patel", font="F5", size=8, color=C_TEAL_DARK)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(pdf.build())
    print(f"Generated: {output_path}")


def generate_istqb_certificate(output_path: str):
    pdf = PDFCanvas(width=841.89, height=595.28)  # Landscape Certificate
    pdf.rect(0, 0, 841.89, 595.28, fill_color=C_IVORY)

    # Ornate Certificate Borders
    pdf.rect(20, 20, 801.89, 555.28, stroke_color=C_TEAL_DARK, stroke_width=3)
    pdf.rect(26, 26, 789.89, 543.28, stroke_color=C_AMBER, stroke_width=1)
    pdf.rect(30, 30, 781.89, 535.28, stroke_color=C_AQUA_BORDER, stroke_width=0.75)

    # Top Brand Ribbon
    pdf.rect(32, 500, 777.89, 63, fill_color=C_TEAL_DARK)
    pdf.text(420.94 - 230, 538, "INTERNATIONAL SOFTWARE TESTING QUALIFICATIONS BOARD", font="F1", size=15, color=C_WHITE)
    pdf.text(420.94 - 100, 516, "INDIAN TESTING BOARD (ITB)", font="F1", size=11, color=(0.85, 0.95, 0.93))

    # Certificate Body
    pdf.text(420.94 - 150, 460, "This is to certify that the examination committee has evaluated", font="F3", size=11, color=C_SLATE)
    pdf.text(420.94 - 110, 415, "PRIYA PATEL", font="F1", size=26, color=C_DARK)
    pdf.line(260, 405, 580, 405, color=C_AMBER, width=2)

    pdf.text(420.94 - 170, 375, "and hereby awards the professional qualification and designation of:", font="F2", size=11, color=C_SLATE)

    # Designation Box
    pdf.rect(120, 300, 601.89, 55, fill_color=C_WHITE, stroke_color=C_TEAL_BRIGHT, stroke_width=1.5)
    pdf.text(420.94 - 175, 332, "CERTIFIED TESTER ADVANCED LEVEL", font="F1", size=15, color=C_TEAL_DARK)
    pdf.text(420.94 - 160, 312, "TEST AUTOMATION ENGINEER (CTAL-TAE)", font="F1", size=13, color=C_DARK)

    # Credential Metadata Table
    pdf.rect(120, 210, 601.89, 75, fill_color=C_WHITE, stroke_color=C_BORDER_LIGHT, stroke_width=1)
    pdf.text(140, 260, "Credential Identification:", font="F1", size=9, color=C_SLATE)
    pdf.text(280, 260, "ISTQB-CTAL-TAE-2023-8821", font="F5", size=10, color=C_DARK)

    pdf.text(140, 240, "Issue Date:", font="F1", size=9, color=C_SLATE)
    pdf.text(280, 240, "15 August 2023 (15/08/2023)", font="F2", size=9, color=C_DARK)

    pdf.text(140, 220, "Validity & Status:", font="F1", size=9, color=C_SLATE)
    pdf.text(280, 220, "Lifetime Valid / Active Professional Status", font="F1", size=9, color=C_EMERALD)

    # TryLo Digital Verification Ribbon
    pdf.rect(120, 115, 601.89, 75, fill_color=C_EMERALD_BG, stroke_color=C_EMERALD, stroke_width=1)
    pdf.text(140, 165, "[V] TRYLO ATTESTED & VERIFIED CREDENTIAL RECORD", font="F1", size=10, color=C_EMERALD)
    pdf.text(140, 147, "Authenticated on TryLo Platform via official ITB / ISTQB certification repository.", font="F2", size=8.5, color=C_DARK)
    pdf.text(140, 131, "Cryptographic Hash: e3b0c44298fc...7113 | Verification: CONFIRMED", font="F4", size=8, color=C_SLATE)

    # Signatures
    pdf.line(140, 70, 300, 70, color=C_SLATE, width=1)
    pdf.text(160, 55, "Chairperson, ISTQB", font="F1", size=8.5, color=C_DARK)

    pdf.line(540, 70, 700, 70, color=C_SLATE, width=1)
    pdf.text(560, 55, "President, Indian Testing Board", font="F1", size=8.5, color=C_DARK)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(pdf.build())
    print(f"Generated: {output_path}")


def generate_aws_certificate(output_path: str):
    pdf = PDFCanvas(width=841.89, height=595.28)  # Landscape
    pdf.rect(0, 0, 841.89, 595.28, fill_color=C_IVORY)

    # Outer border
    pdf.rect(20, 20, 801.89, 555.28, stroke_color=C_NAVY, stroke_width=2.5)
    pdf.rect(26, 26, 789.89, 543.28, stroke_color=(0.95, 0.60, 0.15), stroke_width=1.5)

    # Header Band
    pdf.rect(28, 510, 785.89, 57, fill_color=C_NAVY)
    pdf.text(420.94 - 150, 538, "AMAZON WEB SERVICES", font="F1", size=17, color=C_WHITE)
    pdf.text(420.94 - 120, 520, "Training and Certification", font="F2", size=10, color=(0.95, 0.60, 0.15))

    # Recipient
    pdf.text(420.94 - 120, 465, "This credential validates that", font="F3", size=11, color=C_SLATE)
    pdf.text(420.94 - 110, 420, "PRIYA PATEL", font="F1", size=26, color=C_DARK)
    pdf.line(260, 410, 580, 410, color=(0.95, 0.60, 0.15), width=2)

    pdf.text(420.94 - 150, 380, "has successfully demonstrated advanced expertise and is awarded:", font="F2", size=11, color=C_SLATE)

    # Specialty Designation Card
    pdf.rect(130, 290, 581.89, 65, fill_color=C_WHITE, stroke_color=C_NAVY, stroke_width=1.5)
    pdf.text(420.94 - 170, 332, "AWS Certified Security - Specialty", font="F1", size=18, color=C_NAVY)
    pdf.text(420.94 - 200, 308, "Demonstrating comprehensive knowledge of cloud security, encryption, and IAM governance.", font="F2", size=9, color=C_SLATE)

    # Credentials Table
    pdf.rect(130, 195, 581.89, 78, fill_color=C_WHITE, stroke_color=C_BORDER_LIGHT, stroke_width=1)
    pdf.text(150, 252, "Validation Number:", font="F1", size=9, color=C_SLATE)
    pdf.text(290, 252, "AWS-SEC-SPEC-99120", font="F5", size=10, color=C_DARK)

    pdf.text(150, 232, "Issue Date:", font="F1", size=9, color=C_SLATE)
    pdf.text(290, 232, "12 November 2023", font="F2", size=9, color=C_DARK)

    pdf.text(150, 212, "Expiration Date:", font="F1", size=9, color=C_SLATE)
    pdf.text(290, 212, "12 November 2026 (Active)", font="F1", size=9, color=C_EMERALD)

    # TryLo Attestation Shield
    pdf.rect(130, 105, 581.89, 75, fill_color=C_EMERALD_BG, stroke_color=C_EMERALD, stroke_width=1)
    pdf.text(150, 155, "[V] TRYLO VERIFIED CLOUD CREDENTIAL", font="F1", size=10, color=C_EMERALD)
    pdf.text(150, 137, "Authenticated against AWS Certification Verification Registry (aws.amazon.com/verification).", font="F2", size=8.5, color=C_DARK)
    pdf.text(150, 121, "Attested ID: TRYLO-AWS-SEC-99120 | Verified for Beta Security Roles", font="F4", size=8, color=C_SLATE)

    # Footer
    pdf.text(420.94 - 150, 50, "Amazon Web Services, Inc. All rights reserved. Verify at aws.amazon.com/verification", font="F3", size=8, color=C_SLATE)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(pdf.build())
    print(f"Generated: {output_path}")


def main():
    target_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "documents"))
    print(f"Writing polished documents to: {target_dir}")

    generate_mca_incorporation(os.path.join(target_dir, "Nexus_AI_Labs_MCA_Incorporation_Attested.pdf"))
    generate_tester_resume(os.path.join(target_dir, "Priya_Patel_Senior_QA_Automation_Attested.pdf"))
    generate_istqb_certificate(os.path.join(target_dir, "ISTQB_CTAL_TAE_Priya_Patel_Attested.pdf"))
    generate_aws_certificate(os.path.join(target_dir, "AWS_Security_Specialty_Priya_Patel_Attested.pdf"))
    print("All 4 documents generated successfully with premium vector styling!")


if __name__ == "__main__":
    main()


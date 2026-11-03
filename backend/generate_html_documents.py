"""Generates pixel-perfect, highly attractive, easy-to-read, and authentic HTML companion documents
for TryLo's verified startups and testers.

Documents:
1. Nexus_AI_Labs_MCA_Incorporation_Attested.html  (Govt of India Form INC-11)
2. Priya_Patel_Senior_QA_Automation_Attested.html (Executive QA CV with TryLo ratings)
3. ISTQB_CTAL_TAE_Priya_Patel_Attested.html      (Prestigious CTAL-TAE Certificate)
4. AWS_Security_Specialty_Priya_Patel_Attested.html (AWS Certified Security Specialty)
5. index.html                                    (Document Showcase & Hub)
"""

import os

DOCS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "public", "documents")
os.makedirs(DOCS_DIR, exist_ok=True)

# Shared Top Bar Component for Document HTMLs
def get_top_nav(doc_name, pdf_filename):
    return f"""
    <!-- Top Global TryLo Verification Bar -->
    <nav class="w-full bg-[#07545A] text-white px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md sticky top-0 z-50">
      <div class="flex items-center gap-3">
        <a href="index.html" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div class="h-8 w-8 rounded-lg bg-[#2DD4BF] flex items-center justify-center text-[#07545A] font-black text-sm">
            TL
          </div>
          <div>
            <span class="font-extrabold text-sm tracking-wide block">TryLo Document Registry</span>
            <span class="text-[10px] text-[#D7EFEB] font-medium block">Cryptographically Attested Verification</span>
          </div>
        </a>
        <span class="hidden sm:inline text-white/30">|</span>
        <span class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30">
          <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
          Tamper-Evident Ledger Verified
        </span>
      </div>

      <div class="flex items-center gap-2.5 text-xs font-semibold">
        <a href="index.html" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
          <span>All Documents</span>
        </a>
        <a href="../trial.html" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#D7EFEB] transition-all flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span>Trial Simulation</span>
        </a>
        <a href="{pdf_filename}" download class="px-3.5 py-1.5 rounded-xl bg-[#2DD4BF] hover:bg-[#20b8a5] text-[#07545A] font-bold transition-all shadow-sm flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          <span>Download Vector PDF</span>
        </a>
      </div>
    </nav>
    """

def generate_mca_incorporation():
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate of Incorporation — Nexus AI Technologies Private Limited</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&family=Cinzel:wght@600;700;800&display=swap" rel="stylesheet">
  <style>
    body {{ font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F4F1EA; }}
    .font-cinzel {{ font-family: 'Cinzel', serif; }}
    .font-mono {{ font-family: 'JetBrains Mono', monospace; }}
    .certificate-border {{
      box-shadow: 0 25px 50px -12px rgba(7, 84, 90, 0.15), 0 0 0 1px rgba(7, 84, 90, 0.08);
      border: 8px solid #FFFFFF;
      outline: 2px solid #07545A;
    }}
    .guilloche-bg {{
      background-color: #FFFFFF;
      background-image: radial-gradient(#07545A 0.5px, transparent 0.5px), radial-gradient(#087C80 0.5px, #FFFFFF 0.5px);
      background-size: 20px 20px;
      background-position: 0 0, 10px 10px;
      background-opacity: 0.03;
    }}
  </style>
</head>
<body class="min-h-screen flex flex-col justify-between text-[#102A35]">

  {get_top_nav("Nexus AI MCA Certificate", "Nexus_AI_Labs_MCA_Incorporation_Attested.pdf")}

  <main class="flex-1 p-4 sm:p-10 flex justify-center items-center">
    <div class="max-w-4xl w-full certificate-border bg-white rounded-3xl p-6 sm:p-14 space-y-8 relative overflow-hidden">
      
      <!-- Watermark Background Emblem -->
      <div class="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
        <svg class="w-96 h-96 text-[#07545A]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>

      <!-- Top National Emblem & MCA Header -->
      <header class="text-center space-y-3 border-b-2 border-[#DCE7E3] pb-6 relative z-10">
        <!-- National Emblem Silhouette Representation -->
        <div class="mx-auto flex flex-col items-center">
          <div class="h-16 w-16 rounded-full bg-gradient-to-tr from-[#07545A] to-[#087C80] text-amber-300 flex items-center justify-center shadow-lg border-2 border-amber-300/60">
            <svg class="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </div>
          <span class="text-[11px] font-bold tracking-widest text-[#07545A] uppercase mt-2">सत्यमेव जयते &bull; SATYAMEVA JAYATE</span>
        </div>

        <div class="space-y-1">
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#07545A] tracking-wider uppercase font-cinzel">Government of India</h1>
          <h2 class="text-lg sm:text-xl font-bold text-[#102A35] tracking-wide">MINISTRY OF CORPORATE AFFAIRS</h2>
          <p class="text-xs sm:text-sm text-[#52656B] uppercase font-semibold">Office of the Registrar of Companies &mdash; Karnataka</p>
          <p class="text-[11px] text-[#52656B]">Kendriya Sadan, 2nd Floor, E-Wing, Koramangala, Bengaluru - 560034</p>
        </div>
      </header>

      <!-- Certificate Title Box -->
      <div class="text-center space-y-2 bg-[#F6F5ED] p-5 rounded-2xl border border-[#DCE7E3] relative z-10">
        <h3 class="text-xl sm:text-2xl font-extrabold text-[#102A35] tracking-wide font-cinzel">CERTIFICATE OF INCORPORATION</h3>
        <p class="text-xs text-[#52656B] max-w-xl mx-auto">
          [Pursuant to sub-section (2) of section 7 of the Companies Act, 2013 (18 of 2013) and rule 18 of the Companies (Incorporation) Rules, 2014]
        </p>
      </div>

      <!-- Formal Recital -->
      <div class="text-center space-y-3 relative z-10 max-w-2xl mx-auto">
        <p class="text-sm sm:text-base text-[#102A35] leading-relaxed">
          I hereby certify that <span class="text-[#07545A] font-extrabold text-lg block my-1">NEXUS AI TECHNOLOGIES PRIVATE LIMITED</span>
          is incorporated on this <strong>Fourteenth day of October Two Thousand Twenty-Three</strong> under the Companies Act, 2013 and that the company is <strong>limited by shares</strong>.
        </p>
      </div>

      <!-- Key Identifiers Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs relative z-10">
        <div class="p-5 rounded-2xl bg-gradient-to-br from-white to-[#F6F5ED] border-2 border-[#087C80]/30 shadow-xs space-y-1.5">
          <span class="text-[10px] uppercase font-bold text-[#52656B] tracking-wider block">Corporate Identity Number (CIN)</span>
          <div class="font-mono text-base sm:text-lg font-extrabold text-[#07545A] tracking-wider">U72900KA2023PTC178942</div>
          <p class="text-[10px] text-[#52656B]">Registered with MCA21 Electronic Registry Portal</p>
        </div>

        <div class="p-5 rounded-2xl bg-gradient-to-br from-white to-[#F6F5ED] border-2 border-[#087C80]/30 shadow-xs space-y-1.5">
          <span class="text-[10px] uppercase font-bold text-[#52656B] tracking-wider block">GSTIN &amp; Permanent Account Number (PAN)</span>
          <div class="font-mono text-base sm:text-lg font-extrabold text-[#102A35] tracking-wider">29AABCN8412K1Z9</div>
          <p class="text-[10px] text-[#52656B]">PAN: <strong class="font-mono">AABCN8412K</strong> (Verified with NSDL / ITD)</p>
        </div>
      </div>

      <!-- Detailed Company Structure Table -->
      <div class="rounded-2xl border border-[#DCE7E3] overflow-hidden text-xs relative z-10 shadow-xs">
        <table class="w-full text-left">
          <tbody class="divide-y divide-[#DCE7E3]">
            <tr class="bg-[#F6F5ED]/80">
              <td class="p-3.5 font-bold text-[#52656B] w-1/3">Legal Entity Structure</td>
              <td class="p-3.5 font-semibold text-[#102A35]">Private Company Limited by Shares (Non-Government)</td>
            </tr>
            <tr>
              <td class="p-3.5 font-bold text-[#52656B]">Date of Incorporation</td>
              <td class="p-3.5 font-mono font-bold text-[#07545A]">14/10/2023 (Active &amp; In Good Standing)</td>
            </tr>
            <tr class="bg-[#F6F5ED]/80">
              <td class="p-3.5 font-bold text-[#52656B]">Authorized Share Capital</td>
              <td class="p-3.5 font-mono text-[#102A35]">INR 2,500,000 (Twenty-Five Lakh Indian Rupees)</td>
            </tr>
            <tr>
              <td class="p-3.5 font-bold text-[#52656B]">Paid-up Share Capital</td>
              <td class="p-3.5 font-mono text-[#102A35]">INR 1,000,000 (Ten Lakh Indian Rupees)</td>
            </tr>
            <tr class="bg-[#F6F5ED]/80">
              <td class="p-3.5 font-bold text-[#52656B]">Registered Office Address</td>
              <td class="p-3.5 text-[#102A35] leading-relaxed">
                #42 Outer Ring Road, Prestige Tech Park, Bellandur, Bengaluru, Karnataka &mdash; 560103, India
              </td>
            </tr>
            <tr>
              <td class="p-3.5 font-bold text-[#52656B]">Verified Executive Contact</td>
              <td class="p-3.5 font-mono text-[#07545A] font-bold">founder@nexusai.io (Domain Validated)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Dual Sign-off Seals: MCA Digital Signature & TryLo Anti-Shell Clearance -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 relative z-10">
        
        <!-- Official Digital Signature Stamp -->
        <div class="p-4 rounded-2xl bg-white border border-[#DCE7E3] space-y-2">
          <div class="flex items-center gap-2">
            <span class="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              &#10004;
            </span>
            <span class="text-xs font-bold text-[#102A35]">Digitally Signed &bull; MCA21</span>
          </div>
          <div class="text-[11px] text-[#52656B] space-y-0.5 leading-tight">
            <p><strong>Signed by:</strong> Registrar of Companies, Karnataka</p>
            <p><strong>Date &amp; Time:</strong> 14.10.2023 16:42:18 IST</p>
            <p><strong>Location:</strong> Bengaluru, Karnataka</p>
          </div>
        </div>

        <!-- TryLo Anti-Shell Legitimacy Clearance Seal -->
        <div class="p-4 rounded-2xl bg-[#E6F7F0] border-2 border-[#0E7C57] space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-extrabold text-[#0E7C57] flex items-center gap-1.5 uppercase tracking-wide">
              <span>&#128737;</span> TryLo Anti-Shell Cleared
            </span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0E7C57] text-white">VERIFIED STARTUP</span>
          </div>
          <p class="text-[11px] text-[#0E7C57] leading-relaxed">
            Entity vetted against official MCA records. Cleared to publish live beta campaigns on TryLo.
          </p>
          <div class="pt-1.5 border-t border-[#B6EDD5] text-[10px] font-mono text-[#52656B] flex justify-between">
            <span>SHA-256: 7e93a02b...55f891e4</span>
            <span class="text-[#0E7C57] font-bold">&#10004; Active Status</span>
          </div>
        </div>

      </div>

      <!-- Bottom Attestation Note -->
      <footer class="pt-4 border-t border-[#DCE7E3] flex flex-wrap items-center justify-between gap-3 text-xs text-[#52656B] relative z-10">
        <span>Attested Proof for TryLo High-Trust Verification Architecture</span>
        <a href="Nexus_AI_Labs_MCA_Incorporation_Attested.pdf" download class="font-bold text-[#07545A] hover:underline flex items-center gap-1">
          <span>Download Signed PDF</span>
          <span>&darr;</span>
        </a>
      </footer>

    </div>
  </main>

</body>
</html>"""
    path = os.path.join(DOCS_DIR, "Nexus_AI_Labs_MCA_Incorporation_Attested.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Generated MCA Incorporation HTML: {path}")

def generate_priya_cv():
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Curriculum Vitae — Priya Patel | Senior QA Automation Engineer</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    body {{ font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F4F1EA; }}
    .font-mono {{ font-family: 'JetBrains Mono', monospace; }}
  </style>
</head>
<body class="min-h-screen flex flex-col justify-between text-[#102A35]">

  {get_top_nav("Priya Patel QA CV", "Priya_Patel_Senior_QA_Automation_Attested.pdf")}

  <main class="flex-1 p-4 sm:p-10 flex justify-center items-center">
    <div class="max-w-4xl w-full bg-white rounded-3xl p-6 sm:p-12 shadow-xl border border-[#DCE7E3] space-y-8">

      <!-- Executive Header Banner -->
      <header class="bg-gradient-to-r from-[#07545A] to-[#087C80] rounded-2xl p-6 sm:p-8 text-white space-y-4 shadow-lg">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2.5">
              <h1 class="text-2xl sm:text-4xl font-extrabold tracking-tight">PRIYA PATEL</h1>
              <span class="h-3 w-3 rounded-full bg-[#2DD4BF] animate-pulse"></span>
            </div>
            <p class="text-sm sm:text-base text-[#D7EFEB] font-medium">Senior QA Automation Engineer &bull; Security &amp; Resiliency Specialist</p>
          </div>

          <div class="flex flex-col items-start sm:items-end gap-1.5">
            <span class="px-3.5 py-1.5 rounded-full bg-[#2DD4BF] text-[#07545A] font-extrabold text-xs tracking-wide shadow-xs flex items-center gap-1.5">
              <span>&#9733;</span> TIER 3 TOP-RATED TESTER
            </span>
            <span class="text-[11px] text-[#D7EFEB] font-mono">Member since August 2023</span>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-4 pt-4 border-t border-white/20 text-xs text-white/90 font-mono">
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-[#2DD4BF]" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path></svg>
            priya.patel@trylo.io
          </span>
          <span class="text-white/40">&bull;</span>
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-[#2DD4BF]" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>
            Bengaluru, Karnataka, India
          </span>
          <span class="text-white/40">&bull;</span>
          <span class="flex items-center gap-1 text-[#2DD4BF] font-bold">
            github.com/priyapatel-qa
          </span>
        </div>
      </header>

      <!-- TryLo Verified Performance Scorecard -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] text-center space-y-1">
          <span class="text-[10px] uppercase font-bold text-[#52656B] block">Average Founder Rating</span>
          <span class="text-lg sm:text-xl font-extrabold text-amber-500 block">&#9733; 5.0 / 5.0</span>
          <span class="text-[10px] text-[#52656B]">Across all campaigns</span>
        </div>
        <div class="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] text-center space-y-1">
          <span class="text-[10px] uppercase font-bold text-[#52656B] block">Verified Campaigns</span>
          <span class="text-lg sm:text-xl font-extrabold text-[#07545A] block">3 Completed</span>
          <span class="text-[10px] text-emerald-600 font-bold">&#10004; 100% on-time</span>
        </div>
        <div class="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] text-center space-y-1">
          <span class="text-[10px] uppercase font-bold text-[#52656B] block">Critical Bugs Reported</span>
          <span class="text-lg sm:text-xl font-extrabold text-[#102A35] block">14 Confirmed</span>
          <span class="text-[10px] text-[#52656B]">0 False positives</span>
        </div>
        <div class="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] text-center space-y-1">
          <span class="text-[10px] uppercase font-bold text-[#52656B] block">Founder Endorsements</span>
          <span class="text-lg sm:text-xl font-extrabold text-[#0E7C57] block">6 Received</span>
          <span class="text-[10px] text-[#52656B]">Security &amp; API QA</span>
        </div>
      </div>

      <!-- Executive Summary -->
      <section class="space-y-2">
        <h2 class="text-xs font-bold uppercase tracking-wider text-[#52656B]">Professional Profile</h2>
        <div class="p-5 rounded-2xl bg-white border border-[#DCE7E3] text-xs sm:text-sm text-[#102A35] leading-relaxed shadow-xs">
          High-discipline Test Automation and Security QA specialist with 6+ years of rigorous engineering experience. Specialized in breaking distributed backend microservices under simulated network partition, load spikiness, authorization race conditions, and gRPC stream corruption. Proven track record conducting deep technical beta reviews for high-growth tech startups.
        </div>
      </section>

      <!-- Technical Competencies & Specializations -->
      <section class="space-y-3">
        <h2 class="text-xs font-bold uppercase tracking-wider text-[#52656B]">Verified Competencies &amp; Tooling</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div class="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-1.5">
            <span class="font-bold text-[#07545A] block text-sm">Automated Test Suites</span>
            <div class="flex flex-wrap gap-1.5 pt-1">
              <span class="px-2 py-0.5 rounded-md bg-white border border-[#DCE7E3] text-[11px] font-semibold text-[#102A35]">Playwright</span>
              <span class="px-2 py-0.5 rounded-md bg-white border border-[#DCE7E3] text-[11px] font-semibold text-[#102A35]">Cypress</span>
              <span class="px-2 py-0.5 rounded-md bg-white border border-[#DCE7E3] text-[11px] font-semibold text-[#102A35]">Python pytest</span>
              <span class="px-2 py-0.5 rounded-md bg-white border border-[#DCE7E3] text-[11px] font-semibold text-[#102A35]">Selenium Grid</span>
              <span class="px-2 py-0.5 rounded-md bg-white border border-[#DCE7E3] text-[11px] font-semibold text-[#102A35]">Jest</span>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-1.5">
            <span class="font-bold text-[#07545A] block text-sm">Security &amp; Resilience</span>
            <div class="flex flex-wrap gap-1.5 pt-1">
              <span class="px-2 py-0.5 rounded-md bg-white border border-[#DCE7E3] text-[11px] font-semibold text-[#102A35]">Burp Suite Pro</span>
              <span class="px-2 py-0.5 rounded-md bg-white border border-[#DCE7E3] text-[11px] font-semibold text-[#102A35]">OWASP Top 10</span>
              <span class="px-2 py-0.5 rounded-md bg-white border border-[#DCE7E3] text-[11px] font-semibold text-[#102A35]">JWT Race Testing</span>
              <span class="px-2 py-0.5 rounded-md bg-white border border-[#DCE7E3] text-[11px] font-semibold text-[#102A35]">OAuth 2.0 Auth</span>
              <span class="px-2 py-0.5 rounded-md bg-white border border-[#DCE7E3] text-[11px] font-semibold text-[#102A35]">SQLMap</span>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-1.5">
            <span class="font-bold text-[#07545A] block text-sm">API &amp; Performance Testing</span>
            <div class="flex flex-wrap gap-1.5 pt-1">
              <span class="px-2 py-0.5 rounded-md bg-white border border-[#DCE7E3] text-[11px] font-semibold text-[#102A35]">k6 Load Engine</span>
              <span class="px-2 py-0.5 rounded-md bg-white border border-[#DCE7E3] text-[11px] font-semibold text-[#102A35]">Postman / Newman</span>
              <span class="px-2 py-0.5 rounded-md bg-white border border-[#DCE7E3] text-[11px] font-semibold text-[#102A35]">gRPC Protobuf</span>
              <span class="px-2 py-0.5 rounded-md bg-white border border-[#DCE7E3] text-[11px] font-semibold text-[#102A35]">Locust</span>
              <span class="px-2 py-0.5 rounded-md bg-white border border-[#DCE7E3] text-[11px] font-semibold text-[#102A35]">GraphQL</span>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-1.5">
            <span class="font-bold text-[#07545A] block text-sm">Infrastructure &amp; CI/CD</span>
            <div class="flex flex-wrap gap-1.5 pt-1">
              <span class="px-2 py-0.5 rounded-md bg-white border border-[#DCE7E3] text-[11px] font-semibold text-[#102A35]">Docker Containers</span>
              <span class="px-2 py-0.5 rounded-md bg-white border border-[#DCE7E3] text-[11px] font-semibold text-[#102A35]">Kubernetes (k8s)</span>
              <span class="px-2 py-0.5 rounded-md bg-white border border-[#DCE7E3] text-[11px] font-semibold text-[#102A35]">GitHub Actions</span>
              <span class="px-2 py-0.5 rounded-md bg-white border border-[#DCE7E3] text-[11px] font-semibold text-[#102A35]">AWS VPC / IAM</span>
              <span class="px-2 py-0.5 rounded-md bg-white border border-[#DCE7E3] text-[11px] font-semibold text-[#102A35]">Linux Bash</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Verified Startup Beta Campaigns & Founder Endorsements -->
      <section class="space-y-3">
        <h2 class="text-xs font-bold uppercase tracking-wider text-[#52656B]">TryLo Verified Campaign History</h2>
        
        <div class="space-y-3">
          <!-- Campaign 1 -->
          <div class="p-5 rounded-2xl bg-white border border-[#DCE7E3] space-y-2 shadow-xs">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div class="flex items-center gap-2">
                <span class="font-bold text-[#102A35] text-sm">Nexus AI Labs &mdash; Core Engine Alpha</span>
                <span class="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">Verified Bug Hunter</span>
              </div>
              <span class="text-amber-500 font-extrabold text-xs">&#9733;&#9733;&#9733;&#9733;&#9733; 5.0 / 5.0</span>
            </div>
            <p class="text-xs text-[#52656B] italic leading-relaxed">
              &ldquo;Priya discovered a critical race condition in our JWT session invalidation logic that would have allowed stale session replays. Her bug report included exact curl commands, millisecond latency breakdown, and reproduction scripts. Unbelievable precision.&rdquo;
            </p>
            <div class="pt-2 border-t border-[#DCE7E3] flex items-center justify-between text-[11px] text-[#52656B]">
              <span>Founder: <strong>Aarav Sharma</strong></span>
              <span class="font-mono text-[#07545A]">Bounty Awarded: $120.00 USD</span>
            </div>
          </div>

          <!-- Campaign 2 -->
          <div class="p-5 rounded-2xl bg-white border border-[#DCE7E3] space-y-2 shadow-xs">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div class="flex items-center gap-2">
                <span class="font-bold text-[#102A35] text-sm">HyperScale Cloud &mdash; Ingress Gateway Beta</span>
                <span class="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">Resilience Testing</span>
              </div>
              <span class="text-amber-500 font-extrabold text-xs">&#9733;&#9733;&#9733;&#9733;&#9733; 5.0 / 5.0</span>
            </div>
            <p class="text-xs text-[#52656B] italic leading-relaxed">
              &ldquo;One of the top QA engineers in the ecosystem. Provided detailed k6 scripts generating 15,000 req/sec that pinpointed our connection pool leaks.&rdquo;
            </p>
            <div class="pt-2 border-t border-[#DCE7E3] flex items-center justify-between text-[11px] text-[#52656B]">
              <span>Lead Engineer: <strong>Sarah Jenkins</strong></span>
              <span class="font-mono text-[#07545A]">Bounty Awarded: $150.00 USD</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Attached Attestation & Verified Credentials -->
      <section class="p-5 rounded-2xl bg-[#E6F7F0] border border-[#B6EDD5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="space-y-0.5">
          <span class="text-xs font-bold text-[#0E7C57] flex items-center gap-1.5 uppercase tracking-wide">
            <span>&#128737;</span> TryLo Authenticated Tester Credential
          </span>
          <p class="text-[11px] text-[#0E7C57]">Verified Certifications: ISTQB CTAL-TAE (#2023-8821) &bull; AWS Certified Security Specialty</p>
        </div>
        <div class="flex items-center gap-2">
          <a href="ISTQB_CTAL_TAE_Priya_Patel_Attested.html" class="px-3 py-1.5 rounded-xl bg-white text-[#07545A] font-bold text-xs border border-[#B6EDD5] hover:bg-emerald-50 transition-colors">
            Inspect ISTQB Cert &rarr;
          </a>
          <a href="AWS_Security_Specialty_Priya_Patel_Attested.html" class="px-3 py-1.5 rounded-xl bg-[#07545A] text-white font-bold text-xs hover:bg-[#087C80] transition-colors">
            Inspect AWS Cert &rarr;
          </a>
        </div>
      </section>

    </div>
  </main>

</body>
</html>"""
    path = os.path.join(DOCS_DIR, "Priya_Patel_Senior_QA_Automation_Attested.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Generated Priya Patel CV HTML: {path}")

def generate_istqb_certificate():
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ISTQB Advanced Level Test Automation Engineer — Priya Patel</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Cinzel:wght@500;600;700;800&family=Playfair+Display:ital,wght@1,600&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    body {{ font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F4F1EA; }}
    .font-cinzel {{ font-family: 'Cinzel', serif; }}
    .font-playfair {{ font-family: 'Playfair Display', serif; }}
    .font-mono {{ font-family: 'JetBrains Mono', monospace; }}
    .cert-frame {{
      box-shadow: 0 25px 50px -12px rgba(7, 84, 90, 0.2);
      border: 14px solid #FFFFFF;
      outline: 3px double #D4AF37;
    }}
    .gold-seal-bg {{
      background: radial-gradient(circle, #FFE29F 0%, #FFAE34 100%);
    }}
  </style>
</head>
<body class="min-h-screen flex flex-col justify-between text-[#102A35]">

  {get_top_nav("ISTQB Advanced Level Certificate", "ISTQB_CTAL_TAE_Priya_Patel_Attested.pdf")}

  <main class="flex-1 p-4 sm:p-10 flex justify-center items-center">
    <div class="max-w-4xl w-full cert-frame bg-white rounded-3xl p-6 sm:p-16 space-y-8 relative overflow-hidden text-center">

      <!-- Corner Classical Flourishes -->
      <div class="absolute top-4 left-4 text-[#D4AF37] opacity-60">
        <svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h6v2H6v4H4V4zm16 0h-6v2h4v4h2V4zM4 20h6v-2H6v-4H4v6zm16 0h-6v-2h4v-4h2v6z"/></svg>
      </div>
      <div class="absolute top-4 right-4 text-[#D4AF37] opacity-60">
        <svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M14 4h6v6h-2V6h-4V4zM4 4h6v2H6v4H4V4zm16 16h-6v-2h4v-4h2v6zm-16 0h6v-2H6v-4H4v6z"/></svg>
      </div>

      <!-- ISTQB Board Header -->
      <header class="space-y-2 border-b-2 border-amber-200/80 pb-6">
        <div class="h-16 w-16 mx-auto rounded-full bg-[#07545A] text-amber-300 font-extrabold flex items-center justify-center text-2xl shadow-md border-2 border-amber-300">
          &#127891;
        </div>
        <h1 class="text-xs sm:text-sm font-bold text-[#52656B] uppercase tracking-widest font-cinzel">
          International Software Testing Qualifications Board
        </h1>
        <h2 class="text-xl sm:text-2xl font-extrabold text-[#07545A] tracking-wider font-cinzel">
          INDIAN TESTING BOARD (ITB)
        </h2>
        <p class="text-[11px] text-[#52656B] uppercase tracking-wide">National Board Affiliate of ISTQB&reg;</p>
      </header>

      <!-- Recital -->
      <div class="space-y-4">
        <p class="text-xs sm:text-sm text-[#52656B] italic font-cinzel">
          This is to certify that the examination committee has examined and confirmed that
        </p>
        
        <div class="text-3xl sm:text-5xl font-extrabold text-[#102A35] tracking-wide font-cinzel border-b-2 border-amber-400 pb-2 inline-block px-10">
          PRIYA PATEL
        </div>

        <p class="text-xs sm:text-sm text-[#52656B] italic font-cinzel">
          has fulfilled all theoretical and practical examination requirements and is awarded the qualification of
        </p>
      </div>

      <!-- Credential Designation Box -->
      <div class="p-6 rounded-2xl bg-gradient-to-r from-[#F6F5ED] via-white to-[#F6F5ED] border-2 border-[#07545A] space-y-1.5 shadow-sm max-w-2xl mx-auto">
        <h3 class="text-lg sm:text-2xl font-extrabold text-[#07545A] font-cinzel tracking-tight">
          CERTIFIED TESTER ADVANCED LEVEL
        </h3>
        <h4 class="text-base sm:text-xl font-bold text-[#102A35] font-cinzel">
          TEST AUTOMATION ENGINEER (CTAL-TAE)
        </h4>
        <p class="text-[11px] text-[#52656B]">
          Covering Test Automation Architecture, Risk-Based Selection, Continuous Integration, and Metrics
        </p>
      </div>

      <!-- Metadata Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs max-w-2xl mx-auto">
        <div class="p-3.5 bg-white rounded-xl border border-[#DCE7E3] space-y-0.5">
          <span class="text-[10px] uppercase font-bold text-[#52656B] block">Certificate Number</span>
          <span class="font-mono font-bold text-[#07545A] text-xs sm:text-sm block">ISTQB-CTAL-TAE-2023-8821</span>
        </div>
        <div class="p-3.5 bg-white rounded-xl border border-[#DCE7E3] space-y-0.5">
          <span class="text-[10px] uppercase font-bold text-[#52656B] block">Date of Issue</span>
          <span class="font-mono font-bold text-[#102A35] text-xs sm:text-sm block">15 August 2023</span>
        </div>
        <div class="p-3.5 bg-white rounded-xl border border-[#DCE7E3] space-y-0.5">
          <span class="text-[10px] uppercase font-bold text-[#52656B] block">Accreditation Validity</span>
          <span class="font-bold text-[#0E7C57] text-xs sm:text-sm block">&#10004; Lifetime Active</span>
        </div>
      </div>

      <!-- Signatures & Embossed Seal Row -->
      <div class="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-amber-200/80 gap-6">
        <div class="text-center sm:text-left space-y-1">
          <div class="font-playfair italic text-lg sm:text-xl text-[#07545A]">Dr. S. Ramanathan</div>
          <div class="w-36 h-0.5 bg-amber-400 mx-auto sm:mx-0"></div>
          <span class="text-[10px] uppercase font-bold text-[#52656B] block">Chair, Examination Board &bull; ITB</span>
        </div>

        <!-- Gold Embossed Seal Representation -->
        <div class="h-20 w-20 rounded-full gold-seal-bg border-4 border-amber-300 shadow-lg flex flex-col items-center justify-center text-amber-950 font-cinzel text-center p-1">
          <span class="text-[8px] font-bold tracking-tight uppercase">ISTQB Certified</span>
          <span class="text-xs font-black">&#9733;&#9733;&#9733;</span>
          <span class="text-[8px] font-bold uppercase">Official Seal</span>
        </div>

        <div class="text-center sm:text-right space-y-1">
          <div class="font-playfair italic text-lg sm:text-xl text-[#07545A]">Elena Rostova</div>
          <div class="w-36 h-0.5 bg-amber-400 mx-auto sm:ml-auto"></div>
          <span class="text-[10px] uppercase font-bold text-[#52656B] block">Accreditation Committee &bull; ISTQB</span>
        </div>
      </div>

      <!-- TryLo Verification Ribbon -->
      <div class="p-3.5 rounded-xl bg-[#E6F7F0] border border-[#B6EDD5] flex items-center justify-between text-xs">
        <span class="text-[#0E7C57] font-semibold flex items-center gap-1.5">
          <span>&#128737;</span> Attested &amp; Authenticated Credential for TryLo Tier 2 &amp; Tier 3 Tester Status
        </span>
        <span class="text-[11px] font-mono text-[#52656B]">Cryptographic Hash: e3b0c44298fc1c14...</span>
      </div>

    </div>
  </main>

</body>
</html>"""
    path = os.path.join(DOCS_DIR, "ISTQB_CTAL_TAE_Priya_Patel_Attested.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Generated ISTQB Certificate HTML: {path}")

def generate_aws_certificate():
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AWS Certified Security - Specialty — Priya Patel</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    body {{ font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F4F1EA; }}
    .font-mono {{ font-family: 'JetBrains Mono', monospace; }}
    .aws-card {{
      box-shadow: 0 25px 50px -12px rgba(22, 30, 46, 0.25);
    }}
  </style>
</head>
<body class="min-h-screen flex flex-col justify-between text-[#102A35]">

  {get_top_nav("AWS Security Specialty Certificate", "AWS_Security_Specialty_Priya_Patel_Attested.pdf")}

  <main class="flex-1 p-4 sm:p-10 flex justify-center items-center">
    <div class="max-w-4xl w-full aws-card bg-white rounded-3xl p-6 sm:p-14 border border-[#DCE7E3] space-y-8">

      <!-- AWS Dark Header Bar -->
      <header class="bg-[#161E2E] rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div class="space-y-1 text-center sm:text-left">
          <div class="flex items-center gap-2 justify-center sm:justify-start">
            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-wide text-white">AMAZON WEB SERVICES</h1>
          </div>
          <p class="text-xs sm:text-sm text-[#FF9900] font-bold tracking-wide uppercase">Training and Certification &bull; Global Registry</p>
        </div>

        <div class="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#FF9900] to-[#E68A00] text-black font-extrabold flex flex-col items-center justify-center shadow-md">
          <span class="text-xs font-black">aws</span>
          <span class="text-[8px] font-bold tracking-tight">CERTIFIED</span>
        </div>
      </header>

      <!-- Awardee Section -->
      <div class="text-center space-y-3">
        <p class="text-xs sm:text-sm text-[#52656B] italic">
          This credential officially confirms that
        </p>

        <div class="text-2xl sm:text-4xl font-extrabold text-[#161E2E] border-b-2 border-[#FF9900] pb-2 inline-block px-10">
          PRIYA PATEL
        </div>

        <p class="text-xs sm:text-sm text-[#52656B] italic">
          has successfully passed the comprehensive examination and is recognized as an
        </p>
      </div>

      <!-- Credential Designation -->
      <div class="p-6 rounded-2xl bg-[#F6F5ED] border-2 border-[#161E2E] text-center space-y-2">
        <h2 class="text-xl sm:text-3xl font-extrabold text-[#161E2E]">
          AWS Certified Security &mdash; Specialty
        </h2>
        <p class="text-xs sm:text-sm text-[#52656B] max-w-xl mx-auto leading-relaxed">
          Demonstrating advanced expertise in architecting secure cloud workloads, incident response automation, KMS key encryption, IAM governance policies, and infrastructure protection.
        </p>
      </div>

      <!-- Metadata Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div class="p-4 bg-white rounded-xl border border-[#DCE7E3] text-center space-y-1">
          <span class="text-[10px] uppercase font-bold text-[#52656B] block">Validation Number</span>
          <span class="font-mono font-bold text-[#161E2E] text-xs sm:text-sm block">AWS-SEC-SPEC-99120</span>
        </div>
        <div class="p-4 bg-white rounded-xl border border-[#DCE7E3] text-center space-y-1">
          <span class="text-[10px] uppercase font-bold text-[#52656B] block">Original Issue Date</span>
          <span class="font-mono font-bold text-[#102A35] text-xs sm:text-sm block">12 November 2023</span>
        </div>
        <div class="p-4 bg-white rounded-xl border border-[#DCE7E3] text-center space-y-1">
          <span class="text-[10px] uppercase font-bold text-[#52656B] block">Valid Through</span>
          <span class="font-bold text-[#0E7C57] text-xs sm:text-sm block">&#10004; 12 November 2026</span>
        </div>
      </div>

      <!-- Exam Domain Coverage Breakdown -->
      <div class="space-y-2 text-xs">
        <h3 class="text-xs font-bold uppercase tracking-wider text-[#52656B]">Validated Domain Competencies</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div class="p-3 rounded-xl bg-white border border-[#DCE7E3] flex items-center justify-between">
            <span class="font-semibold text-[#102A35]">Domain 1: Threat Detection &amp; Incident Response</span>
            <span class="font-mono text-[#0E7C57] font-bold">100% Pass</span>
          </div>
          <div class="p-3 rounded-xl bg-white border border-[#DCE7E3] flex items-center justify-between">
            <span class="font-semibold text-[#102A35]">Domain 2: Identity &amp; Access Management (IAM)</span>
            <span class="font-mono text-[#0E7C57] font-bold">100% Pass</span>
          </div>
          <div class="p-3 rounded-xl bg-white border border-[#DCE7E3] flex items-center justify-between">
            <span class="font-semibold text-[#102A35]">Domain 3: Infrastructure Security &amp; Network Firewalls</span>
            <span class="font-mono text-[#0E7C57] font-bold">100% Pass</span>
          </div>
          <div class="p-3 rounded-xl bg-white border border-[#DCE7E3] flex items-center justify-between">
            <span class="font-semibold text-[#102A35]">Domain 4: Data Protection &amp; KMS Envelope Encryption</span>
            <span class="font-mono text-[#0E7C57] font-bold">100% Pass</span>
          </div>
        </div>
      </div>

      <!-- TryLo Verification Ribbon -->
      <div class="p-4 rounded-xl bg-[#E6F7F0] border border-[#B6EDD5] flex items-center justify-between text-xs">
        <span class="text-[#0E7C57] font-semibold flex items-center gap-1.5">
          <span>&#128737;</span> Verified Cloud Security Credential on TryLo
        </span>
        <a href="AWS_Security_Specialty_Priya_Patel_Attested.pdf" download class="px-3.5 py-1.5 rounded-lg bg-[#161E2E] text-white font-bold text-xs hover:bg-black transition-colors">
          Download PDF Vector &darr;
        </a>
      </div>

    </div>
  </main>

</body>
</html>"""
    path = os.path.join(DOCS_DIR, "AWS_Security_Specialty_Priya_Patel_Attested.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Generated AWS Specialty Certificate HTML: {path}")

def generate_index_showcase():
    html = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TryLo Attested Document Registry &amp; Verification Showcase</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&family=Cinzel:wght@600;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F4F1EA; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="min-h-screen text-[#102A35] flex flex-col justify-between">

  <!-- Top Global Bar -->
  <header class="bg-[#07545A] text-white px-4 sm:px-8 py-5 shadow-md">
    <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-xl bg-[#2DD4BF] text-[#07545A] font-black text-lg flex items-center justify-center shadow-md">
          TL
        </div>
        <div>
          <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight">TryLo Attested Document Showcase</h1>
          <p class="text-xs text-[#D7EFEB]">Cryptographically Verified Official Artifacts &bull; High-Trust Architecture</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <a href="../trial.html" class="px-4 py-2 rounded-xl bg-[#2DD4BF] hover:bg-[#20b8a5] text-[#07545A] font-bold text-xs transition-all shadow-sm flex items-center gap-1.5">
          <span>&larr; Return to Live Trial Walkthrough</span>
        </a>
      </div>
    </div>
  </header>

  <!-- Main Showcase Container -->
  <main class="max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-8 flex-1">
    
    <!-- Hero Explainer Banner -->
    <div class="bg-white rounded-3xl p-6 sm:p-8 border border-[#DCE7E3] shadow-sm space-y-3">
      <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#07545A]">
        <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
        Two-Sided Verification Integrity
      </div>
      <h2 class="text-xl sm:text-2xl font-black text-[#102A35]">
        High-Trust Verification Artifacts: Startups &amp; Testers
      </h2>
      <p class="text-xs sm:text-sm text-[#52656B] max-w-3xl leading-relaxed">
        Below are the 4 official attested documents demonstrating TryLo's anti-shell founder protections and verified tester progression. Each document is available as an interactive responsive HTML view and a pure vector printable PDF.
      </p>
    </div>

    <!-- Documents Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

      <!-- Document 1: MCA Incorporation -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-[#DCE7E3] shadow-xs flex flex-col justify-between space-y-5 hover:border-[#07545A] transition-all">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              Founder &bull; Government Incorporation
            </span>
            <span class="text-xs font-mono font-bold text-emerald-600">&#10004; MCA21 Validated</span>
          </div>

          <div class="space-y-1">
            <h3 class="text-lg font-bold text-[#102A35]">Form INC-11 Certificate of Incorporation</h3>
            <p class="text-xs text-[#07545A] font-semibold">Nexus AI Technologies Private Limited</p>
          </div>

          <p class="text-xs text-[#52656B] leading-relaxed">
            Issued by the Ministry of Corporate Affairs, Registrar of Companies Karnataka. Validates CIN, PAN, GSTIN, registered office address, and anti-shell status.
          </p>

          <div class="p-3 bg-[#F6F5ED] rounded-xl font-mono text-[11px] text-[#52656B] space-y-1">
            <div>CIN: <strong class="text-[#07545A]">U72900KA2023PTC178942</strong></div>
            <div>GSTIN: <strong class="text-[#102A35]">29AABCN8412K1Z9</strong></div>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-4 border-t border-[#DCE7E3]">
          <a href="Nexus_AI_Labs_MCA_Incorporation_Attested.html" class="flex-1 py-2 text-center rounded-xl bg-[#07545A] hover:bg-[#087C80] text-white font-bold text-xs transition-colors">
            Interactive HTML View &rarr;
          </a>
          <a href="Nexus_AI_Labs_MCA_Incorporation_Attested.pdf" download class="px-3.5 py-2 rounded-xl bg-[#F6F5ED] hover:bg-stone-200 text-[#102A35] font-bold text-xs border border-[#DCE7E3] transition-colors">
            PDF Vector &darr;
          </a>
        </div>
      </div>

      <!-- Document 2: Senior QA CV -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-[#DCE7E3] shadow-xs flex flex-col justify-between space-y-5 hover:border-[#07545A] transition-all">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="px-3 py-1 rounded-full text-[11px] font-bold bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA]">
              Tester &bull; Executive Resume
            </span>
            <span class="text-xs font-mono font-bold text-amber-500">&#9733; 5.0 Rating (Tier 3)</span>
          </div>

          <div class="space-y-1">
            <h3 class="text-lg font-bold text-[#102A35]">Senior QA &amp; Test Automation CV</h3>
            <p class="text-xs text-[#07545A] font-semibold">Priya Patel &mdash; Security &amp; Resiliency Specialist</p>
          </div>

          <p class="text-xs text-[#52656B] leading-relaxed">
            Attested professional curriculum vitae with verified TryLo performance score, founder endorsements, and technical automation stack breakdown.
          </p>

          <div class="p-3 bg-[#F6F5ED] rounded-xl font-mono text-[11px] text-[#52656B] space-y-1">
            <div>Tier: <strong class="text-[#07545A]">Tier 3 (Top-Rated Vetted Tester)</strong></div>
            <div>Bugs Reported: <strong class="text-[#102A35]">14 Critical (0 False Positives)</strong></div>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-4 border-t border-[#DCE7E3]">
          <a href="Priya_Patel_Senior_QA_Automation_Attested.html" class="flex-1 py-2 text-center rounded-xl bg-[#07545A] hover:bg-[#087C80] text-white font-bold text-xs transition-colors">
            Interactive HTML View &rarr;
          </a>
          <a href="Priya_Patel_Senior_QA_Automation_Attested.pdf" download class="px-3.5 py-2 rounded-xl bg-[#F6F5ED] hover:bg-stone-200 text-[#102A35] font-bold text-xs border border-[#DCE7E3] transition-colors">
            PDF Vector &darr;
          </a>
        </div>
      </div>

      <!-- Document 3: ISTQB CTAL-TAE Certificate -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-[#DCE7E3] shadow-xs flex flex-col justify-between space-y-5 hover:border-[#07545A] transition-all">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
              Tester &bull; Advanced Certification
            </span>
            <span class="text-xs font-mono font-bold text-emerald-600">&#10004; Lifetime Active</span>
          </div>

          <div class="space-y-1">
            <h3 class="text-lg font-bold text-[#102A35]">ISTQB Certified Tester Advanced Level</h3>
            <p class="text-xs text-[#07545A] font-semibold">Test Automation Engineer (CTAL-TAE)</p>
          </div>

          <p class="text-xs text-[#52656B] leading-relaxed">
            Issued by the Indian Testing Board (ITB). Authenticated professional qualification demonstrating advanced architecture for test automation.
          </p>

          <div class="p-3 bg-[#F6F5ED] rounded-xl font-mono text-[11px] text-[#52656B] space-y-1">
            <div>Credential ID: <strong class="text-[#07545A]">ISTQB-CTAL-TAE-2023-8821</strong></div>
            <div>Issue Date: <strong class="text-[#102A35]">15 August 2023</strong></div>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-4 border-t border-[#DCE7E3]">
          <a href="ISTQB_CTAL_TAE_Priya_Patel_Attested.html" class="flex-1 py-2 text-center rounded-xl bg-[#07545A] hover:bg-[#087C80] text-white font-bold text-xs transition-colors">
            Interactive HTML View &rarr;
          </a>
          <a href="ISTQB_CTAL_TAE_Priya_Patel_Attested.pdf" download class="px-3.5 py-2 rounded-xl bg-[#F6F5ED] hover:bg-stone-200 text-[#102A35] font-bold text-xs border border-[#DCE7E3] transition-colors">
            PDF Vector &darr;
          </a>
        </div>
      </div>

      <!-- Document 4: AWS Security Specialty -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-[#DCE7E3] shadow-xs flex flex-col justify-between space-y-5 hover:border-[#07545A] transition-all">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-900 text-[#FF9900] border border-slate-700">
              Tester &bull; Cloud Security
            </span>
            <span class="text-xs font-mono font-bold text-emerald-600">&#10004; Active Thru 2026</span>
          </div>

          <div class="space-y-1">
            <h3 class="text-lg font-bold text-[#102A35]">AWS Certified Security &mdash; Specialty</h3>
            <p class="text-xs text-[#07545A] font-semibold">Amazon Web Services Global Registry</p>
          </div>

          <p class="text-xs text-[#52656B] leading-relaxed">
            Validation of specialized security engineering across cloud IAM, incident remediation, KMS encryption, and infrastructure defense.
          </p>

          <div class="p-3 bg-[#F6F5ED] rounded-xl font-mono text-[11px] text-[#52656B] space-y-1">
            <div>Validation No: <strong class="text-[#07545A]">AWS-SEC-SPEC-99120</strong></div>
            <div>Expiration: <strong class="text-[#102A35]">12 November 2026</strong></div>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-4 border-t border-[#DCE7E3]">
          <a href="AWS_Security_Specialty_Priya_Patel_Attested.html" class="flex-1 py-2 text-center rounded-xl bg-[#07545A] hover:bg-[#087C80] text-white font-bold text-xs transition-colors">
            Interactive HTML View &rarr;
          </a>
          <a href="AWS_Security_Specialty_Priya_Patel_Attested.pdf" download class="px-3.5 py-2 rounded-xl bg-[#F6F5ED] hover:bg-stone-200 text-[#102A35] font-bold text-xs border border-[#DCE7E3] transition-colors">
            PDF Vector &darr;
          </a>
        </div>
      </div>

    </div>

  </main>

  <!-- Bottom Footer -->
  <footer class="bg-white border-t border-[#DCE7E3] py-4 text-center text-xs text-[#52656B]">
    TryLo High-Trust Verification Architecture &bull; Cryptographically Verified Document Repository
  </footer>

</body>
</html>"""
    path = os.path.join(DOCS_DIR, "index.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Generated Document Showcase Index HTML: {path}")

if __name__ == "__main__":
    generate_mca_incorporation()
    generate_priya_cv()
    generate_istqb_certificate()
    generate_aws_certificate()
    generate_index_showcase()
    print("All documents generated successfully!")

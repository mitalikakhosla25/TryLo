"""TryLo LaTeX Resume ATS (Applicant Tracking System) Parser & Scoring Engine.

Enforces that tester resumes must be LaTeX-based and evaluates:
1. LaTeX Structure & Environment Integrity (25%)
2. QA & Software Testing Domain Keywords (35%)
3. Quantifiable Impact & Performance Metrics (20%)
4. Typography, Itemization & ATS Readability (20%)
"""

import re
from typing import Any, Dict, List, Optional, Tuple


# Core LaTeX tags that MUST be present for a valid LaTeX document
REQUIRED_LATEX_TOKENS = [
    r"\documentclass",
    r"\begin{document}",
    r"\end{document}",
]

# Section headers common in professional LaTeX resumes
STANDARD_SECTIONS = [
    (r"\b(experience|work|employment|professional\s+experience)\b", "Experience & History", 4),
    (r"\b(skills|technical\s+skills|technologies|competencies)\b", "Technical Skills", 4),
    (r"\b(education|academic|qualifications)\b", "Education & Degrees", 4),
    (r"\b(projects|open\s*source|portfolio)\b", "Technical Projects", 3),
]

# High-impact Software QA, Testing, & Automation Keywords
QA_KEYWORD_CATEGORIES = {
    "Automation Frameworks": [
        "playwright", "cypress", "selenium", "appium", "puppeteer", 
        "pytest", "junit", "testng", "webdriver", "robot framework", "postman"
    ],
    "Testing Methodologies": [
        "regression", "smoke", "e2e", "end-to-end", "unit testing", 
        "integration", "exploratory", "load testing", "stress testing", 
        "sanity", "black box", "white box", "agile", "scrum", "bdd", "tdd"
    ],
    "API & Backend Systems": [
        "rest api", "graphql", "postman", "swagger", "json", "microservices", 
        "grpc", "http", "endpoints", "fastapi", "node", "express"
    ],
    "CI/CD & DevOps": [
        "github actions", "docker", "ci/cd", "jenkins", "gitlab ci", 
        "kubernetes", "aws", "git", "bash", "linux"
    ],
    "Performance, Security & Tooling": [
        "k6", "jmeter", "owasp", "security testing", "vulnerability", 
        "jira", "testrail", "confluence", "sentry", "datadog", "telemetry"
    ]
}

# Strong action verbs for ATS parsing
STRONG_ACTION_VERBS = [
    "automated", "architected", "designed", "implemented", "engineered",
    "executed", "optimized", "triaged", "detected", "reduced", "accelerated",
    "scaled", "streamlined", "spearheaded", "developed", "orchestrated",
    "verified", "debugged", "monitored", "delivered"
]


def validate_latex_source(content: str) -> Tuple[bool, Optional[str]]:
    """
    Validates whether the provided content is a legitimate LaTeX document.
    Must contain documentclass, begin{document}, and end{document}.
    """
    if not content or not isinstance(content, str):
        return False, "Resume content cannot be empty."

    stripped = content.strip()
    if len(stripped) < 150:
        return False, "LaTeX resume source is too short to be a valid professional CV (minimum 150 characters required)."

    # Verify essential tokens
    if r"\documentclass" not in stripped:
        return False, "Invalid format: Missing '\\documentclass' declaration. Only LaTeX-based resumes are accepted."

    if r"\begin{document}" not in stripped:
        return False, "Invalid format: Missing '\\begin{document}' environment. Only LaTeX-based resumes are accepted."

    if r"\end{document}" not in stripped:
        return False, "Invalid format: Missing '\\end{document}' closure. Ensure the LaTeX code compiles properly."

    return True, None


def calculate_ats_score(content: str) -> Dict[str, Any]:
    """
    Calculates the ATS Score (0 to 100) and actionable breakdown for a LaTeX resume.
    """
    is_valid, error_msg = validate_latex_source(content)
    if not is_valid:
        raise ValueError(error_msg or "Content is not a valid LaTeX document.")

    content_lower = content.lower()

    # 1. Structure Score (Max 25 points)
    structure_score = 10  # Base for valid LaTeX document class & document block
    matched_sections = []
    for pattern, name, points in STANDARD_SECTIONS:
        if re.search(pattern, content_lower):
            structure_score += points
            matched_sections.append(name)

    # Bonus for itemize or moderncv environments
    if r"\begin{itemize}" in content or r"\cventry" in content or r"\cvitem" in content:
        structure_score = min(25, structure_score + 2)

    structure_score = min(25, max(0, structure_score))

    # 2. QA Keywords Score (Max 35 points)
    detected_keywords = []
    category_scores = {}
    total_kw_points = 0

    for cat_name, kw_list in QA_KEYWORD_CATEGORIES.items():
        found_in_cat = [kw for kw in kw_list if kw in content_lower]
        detected_keywords.extend(found_in_cat)
        # Up to 7 points per category (5 categories * 7 = 35)
        cat_pts = min(7, len(found_in_cat) * 2)
        category_scores[cat_name] = cat_pts
        total_kw_points += cat_pts

    keywords_score = min(35, max(5, total_kw_points))

    # 3. Metrics & Impact Score (Max 20 points)
    # Check for quantifiable metrics: percentages (%), milliseconds/seconds (ms, sec),
    # dollar figures ($), scale factors (5x, 10x), or bug/test counts (150+ tests)
    metric_matches = re.findall(
        r"(\b\d+%\b|\b\d+\s*ms\b|\b\d+\s*sec\b|\b\d+x\b|\b\d+\+\s*tests?\b|\b\d+\+\s*bugs?\b|\b\d+\s*microservices?\b|\b\d+\s*rps\b|\$\d+)",
        content_lower
    )
    metric_count = len(metric_matches)
    metrics_pts = min(12, metric_count * 3)

    # Check for strong action verbs
    found_verbs = [v for v in STRONG_ACTION_VERBS if re.search(rf"\b{v}\b", content_lower)]
    verb_pts = min(8, len(found_verbs) * 2)

    metrics_score = min(20, metrics_pts + verb_pts)

    # 4. Formatting & Readability Score (Max 20 points)
    readability_score = 0

    # Length check (clean CV ~ 300 to 2500 words)
    word_count = len(re.findall(r"\b\w+\b", content))
    if 250 <= word_count <= 1800:
        readability_score += 8
    elif 150 <= word_count < 250:
        readability_score += 4
    else:
        readability_score += 2

    # Itemized bullet count
    bullet_count = content.count(r"\item") + content.count(r"\cventry")
    if bullet_count >= 6:
        readability_score += 7
    elif bullet_count >= 3:
        readability_score += 4
    else:
        readability_score += 1

    # Balanced LaTeX formatting (no raw unbalanced braces check)
    open_braces = content.count("{")
    close_braces = content.count("}")
    if abs(open_braces - close_braces) <= 1:
        readability_score += 5
    else:
        readability_score += 2

    readability_score = min(20, readability_score)

    # Total ATS Score (0 - 100)
    total_ats = structure_score + keywords_score + metrics_score + readability_score
    total_ats = max(10, min(100, total_ats))

    # Generate constructive feedback
    feedback: List[str] = []
    if structure_score >= 22:
        feedback.append("Excellent LaTeX typography and standard resume section partitioning.")
    else:
        feedback.append("Consider adding standard sections (e.g. \\section{Experience}, \\section{Technical Skills}).")

    if keywords_score >= 28:
        feedback.append(f"Strong keyword density ({len(detected_keywords)} QA/dev terms identified).")
    else:
        feedback.append("Include more specific testing tools (e.g. Playwright, k6, Postman, CI/CD).")

    if metric_count >= 3:
        feedback.append(f"Great quantification of achievements ({metric_count} measurable impact metrics detected).")
    else:
        feedback.append("Add quantifiable metrics (e.g. 'reduced latency by 35%', '99.4% test coverage') to boost impact.")

    if readability_score >= 18:
        feedback.append("Clean bullet-point itemization and optimal word count for ATS automated parsers.")

    return {
        "ats_score": total_ats,
        "is_latex_verified": True,
        "breakdown": {
            "structure": structure_score,
            "keywords": keywords_score,
            "metrics": metrics_score,
            "readability": readability_score,
        },
        "feedback": feedback,
        "detected_keywords": sorted(list(set(detected_keywords))),
        "metrics_found": metric_count,
    }


DEFAULT_PRIYA_PATEL_LATEX_RESUME = r"""\documentclass[11pt,a4paper]{moderncv}
\moderncvstyle{classic}
\moderncvcolor{teal}
\usepackage[utf8]{inputenc}
\usepackage[margin=1in]{geometry}

\firstname{Priya}
\familyname{Patel}
\title{Senior QA Automation \& Performance Engineer}
\email{priya.patel@trylo.io}
\phone{+91 98765 43210}
\social[github]{priyapatel-qa}
\social[linkedin]{priyapatel-testing}

\begin{document}
\makecvtitle

\section{Professional Summary}
Senior QA Automation and Resilience Engineer with 5+ years of hands-on experience designing end-to-end testing frameworks, k6 load testing, and CI/CD automated gates. Specialized in microservices architectures, Playwright, and OWASP security vulnerability detection.

\section{Technical Skills}
\cvitem{Automation}{Playwright, Cypress, Selenium WebDriver, Appium, PyTest, Jest}
\cvitem{API \& Performance}{Postman, REST APIs, GraphQL, k6, Apache JMeter, Locust}
\cvitem{DevOps \& CI/CD}{GitHub Actions, Docker, Kubernetes, Jenkins, AWS, Git}
\cvitem{Methodologies}{End-to-End (E2E), Regression, Security (OWASP Top 10), Exploratory Testing, Agile Scrum}

\section{Work Experience}
\cventry{2022--Present}{Lead QA Automation Engineer}{ApexCloud Labs}{Bengaluru}{}{
\begin{itemize}
  \item Architected end-to-end automated testing suite with Playwright and TypeScript, reducing regression cycle time by 68\% across 40+ microservices.
  \item Engineered high-load distributed testing simulations using k6 and Docker, validating 5,000 RPS latency thresholds before production releases.
  \item Integrated automated security fuzzing into GitHub Actions CI pipeline, detecting 14 critical CVE vulnerabilities prior to deployment.
  \item Mentored 6 junior QA engineers on BDD best practices, increasing test coverage from 54\% to 92\%.
\end{itemize}}

\cventry{2019--2022}{QA Test Automation Specialist}{FinTech Velocity}{Bengaluru}{}{
\begin{itemize}
  \item Developed automated REST API test frameworks using Python PyTest and Postman Newman, cutting release triage time by 45\%.
  \item Created reproducible defect reports with network HAR payloads and console telemetry, achieving a 98\% first-time bug resolution rate.
  \item Implemented cross-browser compatibility testing for responsive web applications across Chrome, Safari, and Firefox.
\end{itemize}}

\section{Education}
\cventry{2015--2019}{Bachelor of Engineering (B.E.) in Computer Science}{VTU Karnataka}{First Class with Distinction}{}{}

\section{Certifications}
\cvitem{ISTQB}{Certified Tester Advanced Level - Test Automation Engineer (CTAL-TAE)}
\cvitem{AWS}{AWS Certified Developer Associate}

\end{document}
"""


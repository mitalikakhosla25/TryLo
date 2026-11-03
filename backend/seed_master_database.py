"""
TryLo Master Database Migration and Seeding Script.
Ensures schema integrity, safe column additions for SQLite,
and populates rich relational entities across all platform domains.
"""

import os
import sys
import uuid
import sqlite3
from datetime import datetime, timezone, timedelta, date
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.core.config import settings, CANONICAL_DB_FILE
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import get_engine, get_session_factory
from app.models.user import User, UserRole
from app.models.profile import FounderProfile, TesterProfile
from app.models.startup import Startup
from app.models.startup_verification import StartupVerification
from app.models.campaign import (
    Campaign,
    CAMPAIGN_STATUS_PUBLISHED,
    REWARD_TYPE_MONETARY,
    REWARD_TYPE_PERK,
)
from app.models.application import (
    CampaignApplication,
    APPLICATION_STATUS_ACCEPTED,
    APPLICATION_STATUS_PENDING,
)
from app.models.task_progress import (
    CampaignTaskProgress,
    TASK_PROGRESS_COMPLETED,
    TASK_PROGRESS_IN_PROGRESS,
    TASK_PROGRESS_NOT_STARTED,
)
from app.models.feedback import (
    FeedbackSubmission,
    FeedbackInternalNote,
    FeedbackStatusHistory,
    FEEDBACK_TYPE_BUG,
    FEEDBACK_TYPE_GENERAL,
    SEVERITY_HIGH,
    FEEDBACK_STATUS_IN_REVIEW,
    FEEDBACK_STATUS_RESOLVED,
    FEEDBACK_STATUS_SUBMITTED,
)
from app.models.tester_verification import (
    TesterResume,
    TesterCertification,
    TesterEndorsement,
    TesterEmployerReview,
    CERT_STATUS_VERIFIED,
)


def run_sqlite_migrations(db_path: Path):
    """Safely adds missing columns to SQLite tables if they do not exist."""
    print(f"[Migration] Inspecting SQLite database at {db_path}...")
    con = sqlite3.connect(str(db_path))
    cur = con.cursor()

    def get_columns(table_name):
        return [row[1] for row in cur.execute(f"PRAGMA table_info({table_name})").fetchall()]

    # 1. feedback_submissions
    try:
        cols = get_columns("feedback_submissions")
        if cols:
            if "device_info" not in cols:
                print("  Adding column 'device_info' to feedback_submissions")
                cur.execute("ALTER TABLE feedback_submissions ADD COLUMN device_info JSON")
            if "attachments" not in cols:
                print("  Adding column 'attachments' to feedback_submissions")
                cur.execute("ALTER TABLE feedback_submissions ADD COLUMN attachments JSON DEFAULT '[]'")
    except Exception as e:
        print("  Error updating feedback_submissions:", e)

    # 2. campaign_task_progress
    try:
        cols = get_columns("campaign_task_progress")
        if cols:
            if "proof_url" not in cols:
                print("  Adding column 'proof_url' to campaign_task_progress")
                cur.execute("ALTER TABLE campaign_task_progress ADD COLUMN proof_url VARCHAR(500)")
    except Exception as e:
        print("  Error updating campaign_task_progress:", e)

    # 3. campaign_applications
    try:
        cols = get_columns("campaign_applications")
        if cols:
            if "ats_score_at_application" not in cols:
                print("  Adding column 'ats_score_at_application' to campaign_applications")
                cur.execute("ALTER TABLE campaign_applications ADD COLUMN ats_score_at_application INTEGER")
    except Exception as e:
        print("  Error updating campaign_applications:", e)

    # 4. startup_verifications
    try:
        cols = get_columns("startup_verifications")
        if cols:
            if "signatory_name" not in cols:
                print("  Adding column 'signatory_name' to startup_verifications")
                cur.execute("ALTER TABLE startup_verifications ADD COLUMN signatory_name VARCHAR(255)")
            if "official_address" not in cols:
                print("  Adding column 'official_address' to startup_verifications")
                cur.execute("ALTER TABLE startup_verifications ADD COLUMN official_address TEXT")
    except Exception as e:
        print("  Error updating startup_verifications:", e)

    con.commit()
    con.close()
    print("[Migration] SQLite column migration completed successfully.")


def seed_master_data():
    """Seeds complete, high-fidelity relational data."""
    engine = get_engine()
    Base.metadata.create_all(bind=engine)
    session_factory = get_session_factory()
    db = session_factory()

    hashed_pw = hash_password("Password123!")
    now = datetime.now(timezone.utc)

    print("[Seeding] Checking and populating master database entities...")

    # =========================================================================
    # 1. USERS & PROFILES
    # =========================================================================
    users_data = [
        # Founders
        {
            "email": "founder@trylo.io",
            "full_name": "Aarav Sharma",
            "role": "founder",
            "startup_name": "Nexus AI Labs",
            "industry": "Developer Tools & AI",
            "company_stage": "Growth",
            "city": "Bengaluru",
            "country": "India",
            "title": "Founder & CEO",
            "website": "https://nexusai.dev",
            "desc": "Autonomous pull request review assistant powered by localized LLM reasoning.",
        },
        {
            "email": "priya.founder@trylo.io",
            "full_name": "Priya Sengupta",
            "role": "founder",
            "startup_name": "Bloomly",
            "industry": "Sustainability & Smart Hardware",
            "company_stage": "Early Traction",
            "city": "Pune",
            "country": "India",
            "title": "Co-founder & Head of Product",
            "website": "https://bloomly.co",
            "desc": "Zero-waste smart household liquid dispensers with automated usage tracking.",
        },
        {
            "email": "vikram.founder@trylo.io",
            "full_name": "Vikram Malhotra",
            "role": "founder",
            "startup_name": "StudyGenie",
            "industry": "EdTech & Voice AI",
            "company_stage": "MVP",
            "city": "New Delhi",
            "country": "India",
            "title": "Founder",
            "website": "https://studygenie.ai",
            "desc": "Voice-first personalized STEM tutoring assistant for higher secondary students.",
        },
        {
            "email": "ananya.founder@trylo.io",
            "full_name": "Dr. Ananya Rao",
            "role": "founder",
            "startup_name": "FemmeCare Health",
            "industry": "HealthTech & Diagnostics",
            "company_stage": "Growth",
            "city": "Hyderabad",
            "country": "India",
            "title": "Co-founder & Chief Medical Officer",
            "website": "https://femmecare.health",
            "desc": "Non-invasive hormonal health monitoring and cycle synchronization telehealth platform.",
        },
        # Testers
        {
            "email": "tester@trylo.io",
            "full_name": "Priya Patel",
            "role": "tester",
            "bio": "Senior QA Engineer specializing in automated regression, API penetration testing, and distributed concurrency benchmarks. ISTQB Advanced Certified.",
            "skills": ["Manual Testing", "Automated Testing", "API Testing", "Security Testing", "Performance Testing", "Playwright", "Postman", "Cypress"],
            "interests": ["Developer Tools", "FinTech", "HealthTech", "AI Agents", "Cloud Infrastructure"],
            "experience_level": "Advanced",
            "devices": ["macOS", "Windows", "Android", "iOS", "Linux / Ubuntu"],
            "city": "Mumbai",
            "country": "India",
            "linkedin": "https://linkedin.com/in/priya-patel-qa-pro",
        },
        {
            "email": "rohan.tester@trylo.io",
            "full_name": "Rohan Verma",
            "role": "tester",
            "bio": "Full-stack QA Automation & Performance Specialist with 5 years experience stress-testing high-throughput web apps and microservices using k6 and JMeter.",
            "skills": ["Automated Testing", "Performance Testing", "k6", "JMeter", "Python", "Docker", "REST API"],
            "interests": ["FinTech", "SaaS", "Microservices", "Developer Tools"],
            "experience_level": "Advanced",
            "devices": ["Windows", "Linux / Ubuntu", "Android"],
            "city": "Bengaluru",
            "country": "India",
            "linkedin": "https://linkedin.com/in/rohanverma-qa",
        },
        {
            "email": "sneha.tester@trylo.io",
            "full_name": "Sneha Kulkarni",
            "role": "tester",
            "bio": "Mobile UX and Exploratory Tester specializing in cross-device usability, biometric authentication flows, and accessibility (WCAG 2.1 AA compliance).",
            "skills": ["Manual Testing", "Usability Testing", "Accessibility Testing", "Mobile QA", "Appium", "Figma"],
            "interests": ["Mobile Apps", "EdTech", "HealthTech", "Social Platforms"],
            "experience_level": "Intermediate",
            "devices": ["iOS", "Android", "macOS"],
            "city": "Chennai",
            "country": "India",
            "linkedin": "https://linkedin.com/in/snehakulkarni-uxqa",
        },
    ]

    users_by_email = {}
    for udata in users_data:
        user = db.query(User).filter(User.email == udata["email"]).first()
        if not user:
            user = User(
                email=udata["email"],
                full_name=udata["full_name"],
                password_hash=hashed_pw,
                role=udata["role"],
                is_active=True,
                created_at=now - timedelta(days=60),
            )
            db.add(user)
            db.flush()
            print(f"  Created user: {user.email} ({user.role})")
        else:
            # Ensure password hash is valid
            user.password_hash = hashed_pw
            user.is_active = True
            db.flush()

        users_by_email[udata["email"]] = user

        # Associate profile
        if udata["role"] == "founder":
            fprof = db.query(FounderProfile).filter(FounderProfile.user_id == user.id).first()
            if not fprof:
                fprof = FounderProfile(
                    user_id=user.id,
                    startup_name=udata["startup_name"],
                    professional_title=udata["title"],
                    industry=udata["industry"],
                    company_stage=udata["company_stage"],
                    website_url=udata["website"],
                    startup_description=udata["desc"],
                    city=udata["city"],
                    country=udata["country"],
                )
                db.add(fprof)
                db.flush()
        else:
            tprof = db.query(TesterProfile).filter(TesterProfile.user_id == user.id).first()
            if not tprof:
                tprof = TesterProfile(
                    user_id=user.id,
                    bio=udata["bio"],
                    skills=udata["skills"],
                    interests=udata["interests"],
                    experience_level=udata["experience_level"],
                    devices=udata["devices"],
                    city=udata["city"],
                    country=udata["country"],
                    linkedin_url=udata["linkedin"],
                )
                db.add(tprof)
                db.flush()

    # =========================================================================
    # 2. STARTUPS & VERIFICATIONS
    # =========================================================================
    startups_data = [
        {
            "owner": users_by_email["founder@trylo.io"],
            "name": "Nexus AI Labs",
            "slug": "nexus-ai-labs",
            "tagline": "Autonomous code review assistant for engineering teams",
            "description": "Nexus AI analyzes pull requests in real time to catch architectural bottlenecks, security vulnerabilities, and logic flaws before merge.",
            "industry": "Developer Tools",
            "stage": "Growth",
            "website": "https://nexusai.dev",
            "logo": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80",
            "city": "Bengaluru",
            "state": "Karnataka",
            "country": "India",
            "founded_year": 2022,
            "verification": {
                "legal_name": "Nexus AI Technologies Private Limited",
                "reg_type": "Private Limited (Pvt Ltd)",
                "reg_no": "U72900KA2022PTC158912",
                "tax_id": "29AABCN1234F1Z5",
                "corp_email": "legal@nexusai.dev",
                "signatory": "Aarav Sharma",
                "address": "Indiranagar 100 Feet Road, Bengaluru, Karnataka 560038",
                "doc_name": "Certificate_of_Incorporation_NexusAI.pdf",
                "doc_url": "/documents/Certificate_of_Incorporation_NexusAI.pdf",
            },
        },
        {
            "owner": users_by_email["priya.founder@trylo.io"],
            "name": "Bloomly",
            "slug": "bloomly-wellness",
            "tagline": "Zero-waste smart household dispensers with IoT tracking",
            "description": "Bloomly designs eco-friendly smart dispensers that measure and optimize daily consumption while automatically scheduling refills.",
            "industry": "Sustainability",
            "stage": "Early Traction",
            "website": "https://bloomly.co",
            "logo": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=200&auto=format&fit=crop&q=80",
            "city": "Pune",
            "state": "Maharashtra",
            "country": "India",
            "founded_year": 2023,
            "verification": {
                "legal_name": "Bloomly EcoSolutions Private Limited",
                "reg_type": "Private Limited (Pvt Ltd)",
                "reg_no": "U29309PN2023PTC219430",
                "tax_id": "27AABCB9876E1Z2",
                "corp_email": "founders@bloomly.co",
                "signatory": "Priya Sengupta",
                "address": "Baner IT Hub, Pune, Maharashtra 411045",
                "doc_name": "MCA_Incorporation_Bloomly.pdf",
                "doc_url": "/documents/MCA_Incorporation_Bloomly.pdf",
            },
        },
        {
            "owner": users_by_email["founder@trylo.io"],
            "name": "FinMate",
            "slug": "finmate-wealth",
            "tagline": "Automated tax optimization and filing engine for freelancers",
            "description": "FinMate connects with Indian bank accounts and invoices to automatically optimize 44ADA presumptive taxation and streamline advance tax payments.",
            "industry": "FinTech",
            "stage": "Growth",
            "website": "https://finmate.io",
            "logo": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&auto=format&fit=crop&q=80",
            "city": "Mumbai",
            "state": "Maharashtra",
            "country": "India",
            "founded_year": 2021,
            "verification": {
                "legal_name": "FinMate Financial Services Private Limited",
                "reg_type": "Private Limited (Pvt Ltd)",
                "reg_no": "U67190MH2021PTC357821",
                "tax_id": "27AABCF4567D1Z8",
                "corp_email": "compliance@finmate.io",
                "signatory": "Aarav Sharma",
                "address": "Bandra Kurla Complex, Mumbai, Maharashtra 400051",
                "doc_name": "Certificate_of_Incorporation_FinMate.pdf",
                "doc_url": "/documents/Certificate_of_Incorporation_FinMate.pdf",
            },
        },
        {
            "owner": users_by_email["vikram.founder@trylo.io"],
            "name": "StudyGenie",
            "slug": "studygenie-ai",
            "tagline": "Voice-interactive STEM tutor for students",
            "description": "StudyGenie offers voice-based socratic tutoring in physics and math, guiding students through problem-solving without giving away immediate answers.",
            "industry": "EdTech",
            "stage": "MVP",
            "website": "https://studygenie.ai",
            "logo": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&auto=format&fit=crop&q=80",
            "city": "New Delhi",
            "state": "Delhi",
            "country": "India",
            "founded_year": 2023,
            "verification": {
                "legal_name": "StudyGenie Learning Solutions Private Limited",
                "reg_type": "Private Limited (Pvt Ltd)",
                "reg_no": "U80903DL2023PTC412984",
                "tax_id": "07AABCS7890C1Z4",
                "corp_email": "admin@studygenie.ai",
                "signatory": "Vikram Malhotra",
                "address": "Connaught Place, New Delhi 110001",
                "doc_name": "MCA_Incorporation_StudyGenie.pdf",
                "doc_url": "/documents/MCA_Incorporation_StudyGenie.pdf",
            },
        },
        {
            "owner": users_by_email["ananya.founder@trylo.io"],
            "name": "FemmeCare Health",
            "slug": "femmecare-health",
            "tagline": "Personalized hormonal diagnostics and cycle syncing",
            "description": "FemmeCare connects continuous biomarker data with clinically validated lifestyle recommendations to support women across every phase of life.",
            "industry": "HealthTech",
            "stage": "Growth",
            "website": "https://femmecare.health",
            "logo": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200&auto=format&fit=crop&q=80",
            "city": "Hyderabad",
            "state": "Telangana",
            "country": "India",
            "founded_year": 2022,
            "verification": {
                "legal_name": "FemmeCare Healthcare Private Limited",
                "reg_type": "Private Limited (Pvt Ltd)",
                "reg_no": "U85110TG2022PTC160543",
                "tax_id": "36AABCF3210B1Z9",
                "corp_email": "verify@femmecare.health",
                "signatory": "Dr. Ananya Rao",
                "address": "HITEC City, Hyderabad, Telangana 500081",
                "doc_name": "Certificate_of_Incorporation_FemmeCare.pdf",
                "doc_url": "/documents/Certificate_of_Incorporation_FemmeCare.pdf",
            },
        },
        {
            "owner": users_by_email["founder@trylo.io"],
            "name": "NutriBox",
            "slug": "nutribox-wellness",
            "tagline": "Clean organic protein & personalized nutrition regimens",
            "description": "NutriBox formulates customized whole-food nutrient packages and smart dietary subscriptions based on lifestyle biomarkers.",
            "industry": "Food & Beverage",
            "stage": "Growth",
            "website": "https://nutribox.life",
            "logo": "/images/product-nutribox.jpg",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "country": "India",
            "founded_year": 2022,
            "verification": {
                "legal_name": "NutriBox Foods Private Limited",
                "reg_type": "Private Limited (Pvt Ltd)",
                "reg_no": "U15400TN2022PTC149811",
                "tax_id": "33AABCN5678G1Z1",
                "corp_email": "founders@nutribox.life",
                "signatory": "Aarav Sharma",
                "address": "T. Nagar, Chennai, Tamil Nadu 600017",
                "doc_name": "Certificate_of_Incorporation_NutriBox.pdf",
                "doc_url": "/documents/Certificate_of_Incorporation_NutriBox.pdf",
            },
        },
        {
            "owner": users_by_email["priya.founder@trylo.io"],
            "name": "AutoMitra",
            "slug": "automitra-mobility",
            "tagline": "Smart electric vehicle battery telemetry & edge analytics",
            "description": "AutoMitra builds intelligent OBD-II hardware and cloud dashboards predicting EV battery health degradation and charging optimization.",
            "industry": "CleanTech",
            "stage": "Early Traction",
            "website": "https://automitra.in",
            "logo": "/images/product-automitra.jpg",
            "city": "Ahmedabad",
            "state": "Gujarat",
            "country": "India",
            "founded_year": 2023,
            "verification": {
                "legal_name": "AutoMitra Mobility Solutions Private Limited",
                "reg_type": "Private Limited (Pvt Ltd)",
                "reg_no": "U34100GJ2023PTC140291",
                "tax_id": "24AABCA1290K1Z9",
                "corp_email": "ops@automitra.in",
                "signatory": "Priya Sengupta",
                "address": "SG Highway, Ahmedabad, Gujarat 380054",
                "doc_name": "MCA_Incorporation_AutoMitra.pdf",
                "doc_url": "/documents/MCA_Incorporation_AutoMitra.pdf",
            },
        },
        {
            "owner": users_by_email["vikram.founder@trylo.io"],
            "name": "Kraftly",
            "slug": "kraftly-artisans",
            "tagline": "Direct-from-artisan curated ceramics & home goods",
            "description": "Kraftly connects traditional Indian pottery and textile artisans directly with global buyers using AR spatial showroom previews.",
            "industry": "Handicrafts",
            "stage": "MVP",
            "website": "https://kraftly.store",
            "logo": "/images/product-kraftly.jpg",
            "city": "Jaipur",
            "state": "Rajasthan",
            "country": "India",
            "founded_year": 2023,
            "verification": {
                "legal_name": "Kraftly Handicrafts Private Limited",
                "reg_type": "Private Limited (Pvt Ltd)",
                "reg_no": "U36990RJ2023PTC087612",
                "tax_id": "08AABCK4412P1Z3",
                "corp_email": "contact@kraftly.store",
                "signatory": "Vikram Malhotra",
                "address": "MI Road, Jaipur, Rajasthan 302001",
                "doc_name": "Certificate_of_Incorporation_Kraftly.pdf",
                "doc_url": "/documents/Certificate_of_Incorporation_Kraftly.pdf",
            },
        },
        {
            "owner": users_by_email["ananya.founder@trylo.io"],
            "name": "EcoKart",
            "slug": "ecokart-logistics",
            "tagline": "Zero-emission hyperlocal packaging & grocery delivery",
            "description": "EcoKart provides returnable insulated packaging and routed electric vehicle delivery networks for sustainable quick commerce.",
            "industry": "Sustainability",
            "stage": "Early Traction",
            "website": "https://ecokart.io",
            "logo": "/images/product-ecokart.jpg",
            "city": "Noida",
            "state": "Uttar Pradesh",
            "country": "India",
            "founded_year": 2022,
            "verification": {
                "legal_name": "EcoKart Hyperlocal Logistics Private Limited",
                "reg_type": "Private Limited (Pvt Ltd)",
                "reg_no": "U63090UP2022PTC169824",
                "tax_id": "09AABCE8823M1Z6",
                "corp_email": "fleet@ecokart.io",
                "signatory": "Dr. Ananya Rao",
                "address": "Sector 62, Noida, Uttar Pradesh 201309",
                "doc_name": "MCA_Incorporation_EcoKart.pdf",
                "doc_url": "/documents/MCA_Incorporation_EcoKart.pdf",
            },
        },
        {
            "owner": users_by_email["founder@trylo.io"],
            "name": "AgriDrone Labs",
            "slug": "agridrone-labs",
            "tagline": "Autonomous multispectral drone imagery for crop health",
            "description": "AgriDrone equips farmers with autonomous aerial scouting drones analyzing nitrogen depletion and pest infestation at centimeter resolution.",
            "industry": "AgriTech",
            "stage": "Prototype",
            "website": "https://agridrone.co",
            "logo": "/images/product-automitra.jpg",
            "city": "Ludhiana",
            "state": "Punjab",
            "country": "India",
            "founded_year": 2024,
            "verification": {
                "legal_name": "AgriDrone Technologies Private Limited",
                "reg_type": "Private Limited (Pvt Ltd)",
                "reg_no": "U29200PB2024PTC061234",
                "tax_id": "03AABCA9912Q1Z5",
                "corp_email": "research@agridrone.co",
                "signatory": "Aarav Sharma",
                "address": "Ferozepur Road, Ludhiana, Punjab 141001",
                "doc_name": "Certificate_of_Incorporation_AgriDrone.pdf",
                "doc_url": "/documents/Certificate_of_Incorporation_AgriDrone.pdf",
            },
        },
    ]

    startups_by_slug = {}
    for sdata in startups_data:
        st = db.query(Startup).filter(Startup.slug == sdata["slug"]).first()
        if not st:
            st = Startup(
                owner_id=sdata["owner"].id,
                name=sdata["name"],
                slug=sdata["slug"],
                tagline=sdata["tagline"],
                description=sdata["description"],
                industry=sdata["industry"],
                company_stage=sdata["stage"],
                website_url=sdata["website"],
                logo_url=sdata["logo"],
                city=sdata["city"],
                state=sdata["state"],
                country=sdata["country"],
                founded_year=sdata["founded_year"],
                created_at=now - timedelta(days=45),
            )
            db.add(st)
            db.flush()
            print(f"  Created startup: {st.name} ({st.city}, {st.state})")
        else:
            st.city = sdata["city"]
            st.state = sdata["state"]
            st.company_stage = sdata["stage"]
            st.tagline = sdata["tagline"]
            st.logo_url = sdata["logo"]
            db.flush()

        startups_by_slug[sdata["slug"]] = st

        # Verification record
        vdata = sdata["verification"]
        ver = db.query(StartupVerification).filter(StartupVerification.startup_id == st.id).first()
        if not ver:
            ver = StartupVerification(
                startup_id=st.id,
                legal_entity_name=vdata["legal_name"],
                registration_type=vdata["reg_type"],
                registration_number=vdata["reg_no"],
                tax_identifier=vdata["tax_id"],
                corporate_email=vdata["corp_email"],
                is_corporate_email_verified=True,
                signatory_name=vdata.get("signatory"),
                official_address=vdata.get("address"),
                document_name=vdata["doc_name"],
                document_url=vdata["doc_url"],
                verification_status="verified",
                verified_at=now - timedelta(days=40),
            )
            db.add(ver)
            db.flush()

    # =========================================================================
    # 3. CAMPAIGNS
    # =========================================================================
    campaigns_data = [
        {
            "startup": startups_by_slug["nexus-ai-labs"],
            "title": "Nexus Copilot Beta: Autonomous Pull Request Code Review Assistant",
            "slug": "nexus-copilot-beta-pr-review",
            "summary": "Screening senior developers & QA engineers to test pull request webhook integration and intentional CVE detection.",
            "description": "We are launching the closed beta of Nexus Copilot! Testers will connect a test GitHub repository, trigger PR scans across TypeScript and Python files, and evaluate accuracy and latency.",
            "product_type": "API / Developer Tool",
            "product_url": "https://beta.nexusai.dev",
            "access_instructions": "1. Navigate to https://beta.nexusai.dev\n2. Sign in with GitHub using your test account.\n3. Enter beta invite key: NEXUS-BETA-2026\n4. Follow the 3 testing tasks listed in the tasks tab.",
            "testing_tasks": [
                {
                    "id": "task-nexus-1",
                    "title": "GitHub App OAuth Installation & Webhook Connection",
                    "description": "Install the Nexus GitHub App on a public or private test repo and verify initial webhook receipt.",
                    "expected_outcome": "Webhook arrives in under 500ms and dashboard displays 'Connected'.",
                    "estimated_duration": "10 minutes",
                    "is_required": True,
                    "order": 1,
                },
                {
                    "id": "task-nexus-2",
                    "title": "CVE SQL Injection & XSS Vulnerability Detection",
                    "description": "Open a pull request containing intentional raw SQL query strings and verify copilot comments with precise line numbers.",
                    "expected_outcome": "Copilot flags SQL injection flaw with remediation code snippet.",
                    "estimated_duration": "20 minutes",
                    "is_required": True,
                    "order": 2,
                },
                {
                    "id": "task-nexus-3",
                    "title": "Multi-file Large PR Stress Benchmark (>500 lines)",
                    "description": "Submit a PR modifying 15+ files and assess analysis turnaround time.",
                    "expected_outcome": "Review completes within 45 seconds without timeout.",
                    "estimated_duration": "15 minutes",
                    "is_required": False,
                    "order": 3,
                },
            ],
            "screening_questions": [
                {
                    "id": "sq-1",
                    "prompt": "How many years of experience do you have with automated code analysis or CI/CD pipelines?",
                    "question_type": "single_choice",
                    "is_required": True,
                    "options": ["< 1 year", "1-3 years", "3-5 years", "5+ years"],
                },
                {
                    "id": "sq-2",
                    "prompt": "Do you actively maintain open source GitHub repositories?",
                    "question_type": "boolean",
                    "is_required": True,
                    "options": ["Yes", "No"],
                },
            ],
            "reward_type": REWARD_TYPE_MONETARY,
            "reward_amount": 75.0,
            "reward_currency": "USD",
            "reward_description": "$75 cash payout released upon completion of required tasks and reproducible report.",
            "reward_eligibility": "Must complete Task 1 & 2 and submit structured feedback.",
            "max_testers": 25,
            "deadline": now + timedelta(days=20),
            "start_date": now - timedelta(days=5),
            "end_date": now + timedelta(days=25),
        },
        {
            "startup": startups_by_slug["bloomly-wellness"],
            "title": "Bloomly Smart Dispenser Beta: BLE Onboarding & Consumption Telemetry",
            "slug": "bloomly-smart-dispenser-beta",
            "summary": "Testing Bluetooth Low Energy pairing and automated refill alert triggers across iOS and Android.",
            "description": "Bloomly is testing the companion mobile app for our gen-2 smart liquid dispenser. We are validating Bluetooth Low Energy handshake stability, firmware updates over-the-air, and background sync.",
            "product_type": "Mobile App",
            "product_url": "https://testflight.apple.com/join/bloomly-beta",
            "access_instructions": "Download the Bloomly Companion app via TestFlight (iOS) or Google Play Internal Testing. Use demo hardware device ID: BL-8842-DEMO.",
            "testing_tasks": [
                {
                    "id": "task-bloom-1",
                    "title": "Bluetooth Low Energy Discovery & Pairing",
                    "description": "Pair the dispenser emulator in under 15 seconds.",
                    "expected_outcome": "Device status updates to 'Paired' with battery percentage shown.",
                    "estimated_duration": "10 minutes",
                    "is_required": True,
                    "order": 1,
                },
                {
                    "id": "task-bloom-2",
                    "title": "Automated Refill Threshold Trigger Test",
                    "description": "Simulate low liquid level (< 15%) and verify push notification arrives.",
                    "expected_outcome": "Push alert arrives with refill action button.",
                    "estimated_duration": "15 minutes",
                    "is_required": True,
                    "order": 2,
                },
            ],
            "screening_questions": [
                {
                    "id": "sq-b1",
                    "prompt": "What mobile operating system do you primarily use?",
                    "question_type": "single_choice",
                    "is_required": True,
                    "options": ["iOS (iPhone)", "Android", "Both"],
                },
            ],
            "reward_type": REWARD_TYPE_PERK,
            "reward_amount": None,
            "reward_currency": None,
            "reward_description": "Free Bloomly Gen-2 Smart Dispenser Hardware Kit + 1 Year Complimentary Soap Refill Subscription.",
            "reward_eligibility": "Complete BLE pairing and push notification verification.",
            "max_testers": 30,
            "deadline": now + timedelta(days=15),
            "start_date": now - timedelta(days=2),
            "end_date": now + timedelta(days=28),
        },
        {
            "startup": startups_by_slug["finmate-wealth"],
            "title": "FinMate Tax Optimizer Beta: 44ADA Presumptive Tax Calculation Verification",
            "slug": "finmate-tax-optimizer-beta",
            "summary": "Validating multi-bank statement parsing, GST credit reconciliation, and quarterly advance tax schedules.",
            "description": "Calling tech freelancers, consultants, and developers! Help us test FinMate's tax optimization engine. Verify bank statement OCR and automated Section 44ADA 50% deduction calculations.",
            "product_type": "Web App",
            "product_url": "https://app.finmate.io/beta",
            "access_instructions": "Log in with test credentials provided upon application acceptance. Use sample PDF bank statements available in test resources.",
            "testing_tasks": [
                {
                    "id": "task-fin-1",
                    "title": "Multi-Page Bank Statement PDF Upload & OCR Parsing",
                    "description": "Upload a sample PDF statement and check extracted transaction count.",
                    "expected_outcome": "100% extraction accuracy matching summary net totals.",
                    "estimated_duration": "15 minutes",
                    "is_required": True,
                    "order": 1,
                },
                {
                    "id": "task-fin-2",
                    "title": "Section 44ADA Advance Tax Breakdown Generation",
                    "description": "Generate quarterly tax schedule and check rounding calculations.",
                    "expected_outcome": "Advance tax breakdown table displays Q1, Q2, Q3, Q4 with exact surcharge rules.",
                    "estimated_duration": "20 minutes",
                    "is_required": True,
                    "order": 2,
                },
            ],
            "screening_questions": [
                {
                    "id": "sq-f1",
                    "prompt": "Are you familiar with Indian income tax filing (ITR-4 / Section 44ADA)?",
                    "question_type": "boolean",
                    "is_required": True,
                    "options": ["Yes", "No"],
                },
            ],
            "reward_type": REWARD_TYPE_MONETARY,
            "reward_amount": 50.0,
            "reward_currency": "USD",
            "reward_description": "$50 direct UPI / Bank transfer + Lifetime Free Pro Account.",
            "reward_eligibility": "Complete tax calculation workflow and review report.",
            "max_testers": 20,
            "deadline": now + timedelta(days=25),
            "start_date": now - timedelta(days=4),
            "end_date": now + timedelta(days=30),
        },
        {
            "startup": startups_by_slug["studygenie-ai"],
            "title": "StudyGenie Voice Tutor Beta: Socratic Audio Interaction Benchmark",
            "slug": "studygenie-voice-tutor-beta",
            "summary": "Evaluating voice latency, Indian English accent speech recognition, and step-by-step calculus hints.",
            "description": "StudyGenie is testing our bidirectional low-latency audio engine. Testers ask high school math questions and evaluate speech comprehension across diverse regional accents.",
            "product_type": "Mobile App",
            "product_url": "https://beta.studygenie.ai",
            "access_instructions": "Install the Android APK from our beta portal. Requires microphone permissions and headphones.",
            "testing_tasks": [
                {
                    "id": "task-sg-1",
                    "title": "Voice Query Latency & Accent Comprehension Test",
                    "description": "Ask 5 complex integration problems with conversational interruptions.",
                    "expected_outcome": "AI responds within 600ms without hallucinating mathematical equations.",
                    "estimated_duration": "20 minutes",
                    "is_required": True,
                    "order": 1,
                },
            ],
            "screening_questions": [
                {
                    "id": "sq-s1",
                    "prompt": "Do you have an Android device running Android 12 or newer?",
                    "question_type": "boolean",
                    "is_required": True,
                    "options": ["Yes", "No"],
                },
            ],
            "reward_type": REWARD_TYPE_MONETARY,
            "reward_amount": 60.0,
            "reward_currency": "USD",
            "reward_description": "$60 USD stipend upon completion of the voice test recording matrix.",
            "reward_eligibility": "Complete voice recording tests with provided audio clips.",
            "max_testers": 40,
            "deadline": now + timedelta(days=18),
            "start_date": now - timedelta(days=3),
            "end_date": now + timedelta(days=22),
        },
        {
            "startup": startups_by_slug["femmecare-health"],
            "title": "FemmeCare CycleSync Beta: HealthKit & Biomarker Calibration",
            "slug": "femmecare-cyclesync-beta",
            "summary": "Validating Apple Health & Health Connect background sync, daily symptom logging, and predictive insights.",
            "description": "FemmeCare is inviting beta testers to evaluate our cycle synchronization mobile app. Test daily symptom questionnaires, continuous resting heart rate correlations, and secure HIPAA encryption.",
            "product_type": "Mobile App",
            "product_url": "https://femmecare.health/join-beta",
            "access_instructions": "Download from iOS TestFlight or Google Play Beta. Use invitation code: FEMME-PILOT-2026.",
            "testing_tasks": [
                {
                    "id": "task-fc-1",
                    "title": "Apple Health / Health Connect Background Authorization",
                    "description": "Authorize read access for Resting Heart Rate and Sleep metrics.",
                    "expected_outcome": "Syncs last 30 days of data in background in under 10 seconds.",
                    "estimated_duration": "10 minutes",
                    "is_required": True,
                    "order": 1,
                },
                {
                    "id": "task-fc-2",
                    "title": "Interactive Cycle Prediction & Nutrition Plan Generation",
                    "description": "Log 3 consecutive days of symptom markers and verify personalized meal recommendations.",
                    "expected_outcome": "Custom phase recommendations update dynamically.",
                    "estimated_duration": "15 minutes",
                    "is_required": True,
                    "order": 2,
                },
            ],
            "screening_questions": [
                {
                    "id": "sq-fc1",
                    "prompt": "Do you use a smartwatch or fitness tracker (Apple Watch, Fitbit, Garmin)?",
                    "question_type": "single_choice",
                    "is_required": True,
                    "options": ["Apple Watch", "Fitbit", "Garmin", "Other Smartwatch", "None"],
                },
            ],
            "reward_type": REWARD_TYPE_MONETARY,
            "reward_amount": 100.0,
            "reward_currency": "USD",
            "reward_description": "$100 USD stipend + Free 1-Year Premium Health Consultation Membership.",
            "reward_eligibility": "Must log at least 3 test days of telemetry.",
            "max_testers": 25,
            "deadline": now + timedelta(days=30),
            "start_date": now - timedelta(days=1),
            "end_date": now + timedelta(days=35),
        },
    ]

    campaigns_by_slug = {}
    for cdata in campaigns_data:
        camp = db.query(Campaign).filter(
            Campaign.startup_id == cdata["startup"].id,
            Campaign.slug == cdata["slug"]
        ).first()

        if not camp:
            camp = Campaign(
                startup_id=cdata["startup"].id,
                title=cdata["title"],
                slug=cdata["slug"],
                summary=cdata["summary"],
                description=cdata["description"],
                product_type=cdata["product_type"],
                product_url=cdata["product_url"],
                access_instructions=cdata["access_instructions"],
                testing_tasks=cdata["testing_tasks"],
                screening_questions=cdata["screening_questions"],
                target_audience={"experience": "Intermediate / Advanced", "regions": ["India", "Global"]},
                max_testers=cdata["max_testers"],
                reward_type=cdata["reward_type"],
                reward_amount=cdata["reward_amount"],
                reward_currency=cdata["reward_currency"],
                reward_description=cdata["reward_description"],
                reward_eligibility=cdata["reward_eligibility"],
                application_deadline=cdata["deadline"],
                testing_start_date=cdata["start_date"],
                testing_end_date=cdata["end_date"],
                status=CAMPAIGN_STATUS_PUBLISHED,
                published_at=cdata["start_date"],
                created_at=cdata["start_date"] - timedelta(days=2),
            )
            db.add(camp)
            db.flush()
            print(f"  Created campaign: {camp.title[:50]}...")
        else:
            camp.status = CAMPAIGN_STATUS_PUBLISHED
            camp.testing_tasks = cdata["testing_tasks"]
            camp.screening_questions = cdata["screening_questions"]
            camp.reward_type = cdata["reward_type"]
            camp.reward_amount = cdata["reward_amount"]
            camp.reward_currency = cdata["reward_currency"]
            camp.reward_description = cdata["reward_description"]
            camp.access_instructions = cdata["access_instructions"]
            db.flush()

        campaigns_by_slug[cdata["slug"]] = camp

    # =========================================================================
    # 4. CAMPAIGN APPLICATIONS
    # =========================================================================
    priya_tester = users_by_email["tester@trylo.io"]
    rohan_tester = users_by_email["rohan.tester@trylo.io"]
    sneha_tester = users_by_email["sneha.tester@trylo.io"]

    nexus_camp = campaigns_by_slug["nexus-copilot-beta-pr-review"]
    bloom_camp = campaigns_by_slug["bloomly-smart-dispenser-beta"]
    fin_camp = campaigns_by_slug["finmate-tax-optimizer-beta"]
    study_camp = campaigns_by_slug["studygenie-voice-tutor-beta"]
    femme_camp = campaigns_by_slug["femmecare-cyclesync-beta"]

    apps_to_create = [
        # Priya (Accepted for Nexus, Accepted for Bloomly, Pending for FinMate)
        {
            "campaign": nexus_camp,
            "tester": priya_tester,
            "status": APPLICATION_STATUS_ACCEPTED,
            "answers": {"sq-1": "5+ years", "sq-2": "Yes"},
            "motivation": "Excited to benchmark automated CVE scanning and multi-file code review latency against our production pipelines.",
            "ats_score": 94,
        },
        {
            "campaign": bloom_camp,
            "tester": priya_tester,
            "status": APPLICATION_STATUS_ACCEPTED,
            "answers": {"sq-b1": "Both"},
            "motivation": "I have multiple IoT test rigs and would love to validate the BLE pairing reliability.",
            "ats_score": 94,
        },
        {
            "campaign": fin_camp,
            "tester": priya_tester,
            "status": APPLICATION_STATUS_PENDING,
            "answers": {"sq-f1": "Yes"},
            "motivation": "Freelance consultant interested in validating Section 44ADA 50% presumptive calculation edge cases.",
            "ats_score": 94,
        },
        # Rohan (Pending for StudyGenie, Accepted for FemmeCare)
        {
            "campaign": study_camp,
            "tester": rohan_tester,
            "status": APPLICATION_STATUS_PENDING,
            "answers": {"sq-s1": "Yes"},
            "motivation": "Experienced in testing WebRTC and streaming speech-to-text models on Linux & Android.",
            "ats_score": 88,
        },
        {
            "campaign": femme_camp,
            "tester": rohan_tester,
            "status": APPLICATION_STATUS_ACCEPTED,
            "answers": {"sq-fc1": "Apple Watch"},
            "motivation": "Interested in benchmarking HealthKit background authorization and REST API synchronization.",
            "ats_score": 88,
        },
    ]

    for adata in apps_to_create:
        app = db.query(CampaignApplication).filter(
            CampaignApplication.campaign_id == adata["campaign"].id,
            CampaignApplication.tester_id == adata["tester"].id,
        ).first()

        if not app:
            app = CampaignApplication(
                campaign_id=adata["campaign"].id,
                tester_id=adata["tester"].id,
                status=adata["status"],
                screening_answers=adata["answers"],
                motivation=adata["motivation"],
                ats_score_at_application=adata.get("ats_score", 90),
                created_at=now - timedelta(days=3),
            )
            db.add(app)
            db.flush()
            print(f"  Created application: {adata['tester'].email} -> {adata['campaign'].title[:35]} ({adata['status']})")
        else:
            app.status = adata["status"]
            app.ats_score_at_application = adata.get("ats_score", 90)
            db.flush()

    # =========================================================================
    # 5. TASK PROGRESS
    # =========================================================================
    task_progress_data = [
        {
            "campaign": nexus_camp,
            "tester": priya_tester,
            "task_id": "task-nexus-1",
            "status": TASK_PROGRESS_COMPLETED,
            "note": "Verified GitHub App webhook handshake across Chrome 124 and Firefox 125. Latency averaged 310ms. Session cookie stored with Secure and SameSite=Lax.",
            "proof_url": "https://loom.com/share/nexus-task-1-proof-verified",
            "completed_at": now - timedelta(days=2),
        },
        {
            "campaign": nexus_camp,
            "tester": priya_tester,
            "task_id": "task-nexus-2",
            "status": TASK_PROGRESS_IN_PROGRESS,
            "note": "Testing intentional CVE injection payload with 500-line sample repository.",
            "proof_url": None,
            "completed_at": None,
        },
        {
            "campaign": nexus_camp,
            "tester": priya_tester,
            "task_id": "task-nexus-3",
            "status": TASK_PROGRESS_NOT_STARTED,
            "note": None,
            "proof_url": None,
            "completed_at": None,
        },
    ]

    for tp in task_progress_data:
        progress = db.query(CampaignTaskProgress).filter(
            CampaignTaskProgress.campaign_id == tp["campaign"].id,
            CampaignTaskProgress.task_id == tp["task_id"],
            CampaignTaskProgress.tester_id == tp["tester"].id,
        ).first()

        if not progress:
            progress = CampaignTaskProgress(
                campaign_id=tp["campaign"].id,
                task_id=tp["task_id"],
                tester_id=tp["tester"].id,
                status=tp["status"],
                completion_note=tp["note"],
                proof_url=tp.get("proof_url"),
                completed_at=tp["completed_at"],
                created_at=now - timedelta(days=2),
            )
            db.add(progress)
            db.flush()
        else:
            progress.status = tp["status"]
            progress.completion_note = tp["note"]
            progress.proof_url = tp.get("proof_url")
            progress.completed_at = tp["completed_at"]
            db.flush()

    # =========================================================================
    # 6. FEEDBACK & BUG SUBMISSIONS
    # =========================================================================
    feedback_data = [
        {
            "campaign": nexus_camp,
            "tester": priya_tester,
            "task_id": "task-nexus-2",
            "type": FEEDBACK_TYPE_BUG,
            "title": "Auth token race condition on concurrent webhook trigger",
            "description": "When multiple git push webhooks fire concurrently in a monorepo, the session token drops and raises 401 Unauthorized in background consumer.",
            "expected": "Background webhook consumer should reuse valid JWT token without uncoordinated expiry refresh.",
            "actual": "Second webhook request invalidated first token, causing failed review generation on secondary PR commits.",
            "reproduction": "1. Open test monorepo with 3 packages.\n2. Push 2 simultaneous commits to distinct branches.\n3. Check backend consumer logs for HTTP 401.",
            "severity": SEVERITY_HIGH,
            "status": FEEDBACK_STATUS_IN_REVIEW,
            "device_info": {"os": "macOS Sonoma 14.4", "browser": "Chrome 124.0", "viewport": "2560x1440"},
            "attachments": ["https://trylo.dev/attachments/bug-104-trace.png", "https://trylo.dev/attachments/bug-104-logs.txt"],
            "internal_notes": [
                {
                    "author": users_by_email["founder@trylo.io"],
                    "body": "Aarav: Investigated with engineering. Redis lock for session refresh was missing expiration safeguard. Preparing patch for v1.0.4.",
                }
            ],
            "history": [
                {
                    "actor": priya_tester,
                    "prev": "submitted",
                    "new": "in_review",
                    "reason": "Founder accepted report for triaging and active reproduction.",
                }
            ]
        },
        {
            "campaign": bloom_camp,
            "tester": priya_tester,
            "task_id": "task-bloom-1",
            "type": FEEDBACK_TYPE_GENERAL,
            "title": "Remarkably smooth Bluetooth Low Energy pairing UX",
            "description": "Tested pairing on Android 14 (Pixel 8 Pro) and iOS 17 (iPhone 15 Pro). Handshake took < 3 seconds on both devices. Very impressed with the animated pairing feedback.",
            "expected": "Fast and deterministic pairing without dropped packets.",
            "actual": "Successfully paired within 2.8 seconds on both platforms.",
            "reproduction": None,
            "severity": None,
            "status": FEEDBACK_STATUS_RESOLVED,
            "device_info": {"os": "Android 14 & iOS 17.4", "devices": ["Pixel 8 Pro", "iPhone 15 Pro"]},
            "attachments": ["https://trylo.dev/attachments/bloomly-pairing-success.jpg"],
            "internal_notes": [],
            "history": []
        }
    ]

    for fb in feedback_data:
        existing_fb = db.query(FeedbackSubmission).filter(
            FeedbackSubmission.campaign_id == fb["campaign"].id,
            FeedbackSubmission.tester_id == fb["tester"].id,
            FeedbackSubmission.title == fb["title"],
        ).first()

        if not existing_fb:
            sub = FeedbackSubmission(
                campaign_id=fb["campaign"].id,
                tester_id=fb["tester"].id,
                task_id=fb["task_id"],
                feedback_type=fb["type"],
                title=fb["title"],
                description=fb["description"],
                expected_behavior=fb["expected"],
                actual_behavior=fb["actual"],
                reproduction_steps=fb["reproduction"],
                severity=fb["severity"],
                status=fb["status"],
                device_info=fb.get("device_info"),
                attachments=fb.get("attachments", []),
                created_at=now - timedelta(days=1),
            )
            db.add(sub)
            db.flush()

            for note in fb.get("internal_notes", []):
                inote = FeedbackInternalNote(
                    feedback_id=sub.id,
                    author_id=note["author"].id,
                    body=note["body"],
                    created_at=now - timedelta(hours=12),
                )
                db.add(inote)

            for hist in fb.get("history", []):
                shist = FeedbackStatusHistory(
                    feedback_id=sub.id,
                    actor_id=hist["actor"].id,
                    previous_status=hist["prev"],
                    new_status=hist["new"],
                    reason=hist.get("reason"),
                    created_at=now - timedelta(hours=10),
                )
                db.add(shist)

            db.flush()
            print(f"  Created feedback: {sub.title} ({sub.status})")

    # =========================================================================
    # 7. TESTER CREDIBILITY (RESUME, CERTS, REVIEWS, ENDORSEMENTS)
    # =========================================================================
    # Tester Resume for Priya Patel
    resume = db.query(TesterResume).filter(TesterResume.tester_id == priya_tester.id).first()
    latex_sample = r"""\documentclass[10pt, letterpaper]{article}
\usepackage[utf8]{inputenc}
\usepackage{geometry}
\geometry{letterpaper, margin=0.75in}
\begin{document}
\noindent{\Huge \textbf{Priya Patel}}\\
\noindent Senior QA Automation \& Security Engineer | Mumbai, India\\
\noindent Email: priya.patel@trylo.io | LinkedIn: linkedin.com/in/priya-patel-qa-pro

\section*{Professional Summary}
Over 6 years of proven experience architecting automated regression pipelines, performing security assessments, and conducting performance benchmarks for cloud-native web applications.

\section*{Key Technical Skills}
\begin{itemize}
    \item \textbf{Automation Frameworks:} Playwright, Cypress, Selenium, Appium
    \item \textbf{API \& Security:} Postman, REST/GraphQL, Burp Suite, OWASP Top 10
    \item \textbf{Performance:} k6, Apache JMeter, Lighthouse
    \item \textbf{CI/CD \& Cloud:} GitHub Actions, Docker, AWS DevOps
\end{itemize}

\section*{Certifications}
\begin{itemize}
    \item ISTQB Certified Tester Advanced Level - Test Automation Engineer
    \item AWS Certified Solutions Architect - Associate
\end{itemize}
\end{document}"""

    if not resume:
        resume = TesterResume(
            tester_id=priya_tester.id,
            resume_url="/documents/Priya_Patel_Senior_QA_Automation_Attested.pdf",
            file_name="Priya_Patel_Senior_QA_Automation_Attested.pdf",
            github_url="https://github.com/priyapatel-qa",
            portfolio_url="https://priyapatel.dev",
            bug_bounty_url="https://hackerone.com/priyapatel",
            specializations=["Automated Testing (Playwright/Cypress/Selenium)", "API & Backend Testing (Postman/REST/GraphQL)", "Security & Vulnerability Assessment"],
            ats_score=94,
            ats_breakdown={"skills_match": 95, "formatting_clarity": 92, "experience_impact": 96},
            ats_feedback=["High keyword alignment with QA Automation", "Valid LaTeX document structure with semantic hierarchy"],
            latex_source=latex_sample,
            is_latex_verified=True,
            created_at=now - timedelta(days=30),
        )
        db.add(resume)
        db.flush()
        print("  Created TesterResume with ATS 94/100 and LaTeX verification for Priya Patel.")
    else:
        resume.ats_score = 94
        resume.is_latex_verified = True
        resume.latex_source = latex_sample
        db.flush()

    # Certifications
    certs = [
        {
            "tester": priya_tester,
            "name": "ISTQB Certified Tester Advanced Level - Test Automation Engineer",
            "org": "International Software Testing Qualifications Board (ISTQB)",
            "cred_id": "ISTQB-ADV-2023-88914",
            "cred_url": "https://istqb.org/verify/ISTQB-ADV-2023-88914",
            "issue_date": date(2023, 4, 15),
            "status": CERT_STATUS_VERIFIED,
        },
        {
            "tester": priya_tester,
            "name": "AWS Certified Solutions Architect - Associate",
            "org": "Amazon Web Services",
            "cred_id": "AWS-PSA-99201",
            "cred_url": "https://aws.amazon.com/verification/AWS-PSA-99201",
            "issue_date": date(2022, 11, 10),
            "status": CERT_STATUS_VERIFIED,
        },
    ]

    for c in certs:
        existing_c = db.query(TesterCertification).filter(
            TesterCertification.tester_id == c["tester"].id,
            TesterCertification.name == c["name"]
        ).first()
        if not existing_c:
            cert_obj = TesterCertification(
                tester_id=c["tester"].id,
                name=c["name"],
                issuing_organization=c["org"],
                credential_id=c["cred_id"],
                credential_url=c["cred_url"],
                issue_date=c["issue_date"],
                verification_status=c["status"],
                created_at=now - timedelta(days=20),
            )
            db.add(cert_obj)
            db.flush()

    # Employer Reviews
    aarav_founder = users_by_email["founder@trylo.io"]
    priya_founder = users_by_email["priya.founder@trylo.io"]

    reviews_data = [
        {
            "tester": priya_tester,
            "reviewer": aarav_founder,
            "campaign": nexus_camp,
            "reviewer_name": "Aarav Sharma",
            "reviewer_title": "Founder & CEO",
            "company_name": "Nexus AI Labs",
            "rating": 5,
            "thoroughness": 5,
            "responsiveness": 5,
            "bug_quality": 5,
            "scope": "Auth token concurrency & multi-file webhook benchmarks",
            "text": "Priya caught a critical race condition in our webhook authorization flow before we launched publicly. Her bug report had precise curl reproduction scripts and network traces. Top-tier QA!",
            "is_verified": True,
        },
        {
            "tester": priya_tester,
            "reviewer": priya_founder,
            "campaign": bloom_camp,
            "reviewer_name": "Priya Sengupta",
            "reviewer_title": "Co-founder & Head of Product",
            "company_name": "Bloomly",
            "rating": 5,
            "thoroughness": 5,
            "responsiveness": 5,
            "bug_quality": 5,
            "scope": "BLE mobile pairing & telemetry validation",
            "text": "Tested BLE handshake across both iOS and Android with exceptional attention to detail. Fast communication and proactive edge-case testing.",
            "is_verified": True,
        },
    ]

    for rev in reviews_data:
        existing_rev = db.query(TesterEmployerReview).filter(
            TesterEmployerReview.tester_id == rev["tester"].id,
            TesterEmployerReview.reviewer_id == rev["reviewer"].id,
        ).first()

        if not existing_rev:
            review_obj = TesterEmployerReview(
                tester_id=rev["tester"].id,
                reviewer_id=rev["reviewer"].id,
                campaign_id=rev["campaign"].id,
                reviewer_name=rev["reviewer_name"],
                reviewer_title=rev["reviewer_title"],
                company_name=rev["company_name"],
                overall_rating=rev["rating"],
                thoroughness_rating=rev["thoroughness"],
                responsiveness_rating=rev["responsiveness"],
                bug_report_quality_rating=rev["bug_quality"],
                project_scope=rev["scope"],
                review_text=rev["text"],
                is_verified=rev["is_verified"],
                created_at=now - timedelta(days=10),
            )
            db.add(review_obj)
            db.flush()

    # Skill Endorsements
    endorsements_data = [
        {"tester": priya_tester, "endorser": aarav_founder, "skill": "Security & Penetration Testing", "note": "Identified subtle concurrency vulnerabilities in webhook pipeline."},
        {"tester": priya_tester, "endorser": priya_founder, "skill": "Automated Testing", "note": "Flawless regression test setup and structured validation."},
    ]

    for end in endorsements_data:
        existing_end = db.query(TesterEndorsement).filter(
            TesterEndorsement.tester_id == end["tester"].id,
            TesterEndorsement.endorser_id == end["endorser"].id,
            TesterEndorsement.skill_name == end["skill"],
        ).first()

        if not existing_end:
            e_obj = TesterEndorsement(
                tester_id=end["tester"].id,
                endorser_id=end["endorser"].id,
                skill_name=end["skill"],
                endorsement_note=end["note"],
                created_at=now - timedelta(days=8),
            )
            db.add(e_obj)
            db.flush()

    db.commit()
    db.close()
    print("[Seeding] Master database seeding completed with 100% integrity!")


if __name__ == "__main__":
    db_file = CANONICAL_DB_FILE
    run_sqlite_migrations(db_file)
    seed_master_data()

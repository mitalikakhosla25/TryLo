"""Seed script for TryLo platform demonstration.
Creates:
- Demo Founder (founder@trylo.io / Password123!)
- Verified Startup (Nexus AI Labs) with Anti-Shell verification
- Published Beta Testing Campaign
- Demo Top-Rated Tester (tester@trylo.io / Password123!)
- Resume, Certifications, Endorsements, and Employer Reviews
- Demo Campaign Application
"""

import uuid
from datetime import datetime, timezone, timedelta
from app.db.session import get_session_factory
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.profile import FounderProfile, TesterProfile
from app.models.startup import Startup
from app.models.campaign import Campaign
from app.models.application import CampaignApplication
from app.models.startup_verification import StartupVerification
from app.models.tester_verification import (
    TesterResume,
    TesterCertification,
    TesterEndorsement,
    TesterEmployerReview,
)

def seed():
    session_factory = get_session_factory()
    if not session_factory:
        print("Failed to get session factory")
        return

    with session_factory() as db:
        # Check if already seeded
        existing_founder = db.query(User).filter(User.email == "founder@trylo.io").first()
        if existing_founder:
            print("Demo accounts already present.")
            return

        now = datetime.now(timezone.utc)

        # 1. Create Demo Founder
        founder_id = uuid.uuid4()
        founder_user = User(
            id=founder_id,
            email="founder@trylo.io",
            password_hash=hash_password("Password123!"),
            full_name="Aarav Sharma",
            role=UserRole.FOUNDER.value,
            is_active=True,
            created_at=now,
        )
        db.add(founder_user)

        founder_profile = FounderProfile(
            user_id=founder_id,
            startup_name="Nexus AI Labs",
            professional_title="Co-Founder & CTO",
            linkedin_url="https://linkedin.com/in/aaravsharma-founder",
            industry="Developer Tools / AI",
            company_stage="Growth",
            website_url="https://nexusai.io",
            city="Bengaluru",
            country="India",
        )
        db.add(founder_profile)

        # 2. Create Verified Startup
        startup_id = uuid.uuid4()
        startup = Startup(
            id=startup_id,
            owner_id=founder_id,
            name="Nexus AI Labs",
            slug="nexus-ai-labs",
            tagline="Autonomous developer intelligence and AI code security reviews",
            description="Autonomous developer intelligence and AI code security reviews for high-growth tech teams.",
            website_url="https://nexusai.io",
            industry="Developer Tools / AI",
            company_stage="Growth",
            city="Bengaluru",
            country="India",
            founded_year=2023,
            created_at=now,
        )
        db.add(startup)
        db.flush()

        # 3. Create Anti-Shell Startup Verification Record
        verification = StartupVerification(
            id=uuid.uuid4(),
            startup_id=startup_id,
            legal_entity_name="Nexus AI Technologies Private Limited",
            registration_type="Private Limited (Pvt Ltd)",
            registration_number="U72900KA2023PTC178942",
            tax_identifier="29ABCDE1234F1Z5",
            document_url="https://mca.gov.in/verify/cin/U72900KA2023PTC178942",
            document_name="Certificate_of_Incorporation_MCA.pdf",
            corporate_email="founder@nexusai.io",
            is_corporate_email_verified=True,
            verification_status="verified",
            verified_at=now,
            created_at=now - timedelta(days=20),
            updated_at=now,
        )
        db.add(verification)

        # 4. Create Published Campaign
        campaign_id = uuid.uuid4()
        campaign = Campaign(
            id=campaign_id,
            startup_id=startup_id,
            title="Nexus Copilot Beta: Autonomous Pull Request Code Review Assistant",
            slug="nexus-copilot-beta-pr-review",
            summary="Test our newest AI code security reviewer on GitHub and GitLab pull requests.",
            description="We are inviting experienced developers and QA security testers to stress-test Nexus Copilot on edge-case pull requests, evaluate accuracy of detected CVE vulnerabilities, and review UI/UX response latency.",
            product_type="Web App & GitHub App",
            product_url="https://beta.nexusai.io",
            testing_tasks=[
                {"id": "task-1", "title": "Connect test GitHub repository and trigger automated PR analysis"},
                {"id": "task-2", "title": "Attempt to push intentional SQL injection and verify CVE detection flags"},
                {"id": "task-3", "title": "Submit speed and responsiveness feedback for multi-file PR reviews (>500 lines)"},
            ],
            target_audience={
                "skills": ["UI/UX", "Automated Testing", "Security Testing"],
                "experience_levels": ["Intermediate", "Advanced"],
                "devices": ["macOS", "Linux", "Windows"],
            },
            screening_questions=[
                {"id": "q1", "question": "How many years of automated testing or security QA experience do you have?", "required": True},
                {"id": "q2", "question": "Which CI/CD tools do you use regularly?", "required": False},
            ],
            max_testers=25,
            application_deadline=now + timedelta(days=14),
            testing_start_date=now - timedelta(days=1),
            testing_end_date=now + timedelta(days=21),
            reward_type="monetary",
            reward_amount=75.0,
            reward_currency="USD",
            reward_description="$75 direct payout via Stripe/Wise upon completing all 3 review tasks with detailed feedback.",
            reward_eligibility="Open to Tier 2+ testers with verified QA certifications or previous founder endorsements.",
            status="published",
            published_at=now - timedelta(days=2),
            created_at=now - timedelta(days=3),
        )
        db.add(campaign)

        # 5. Create Demo Vetted Tester
        tester_id = uuid.uuid4()
        tester_user = User(
            id=tester_id,
            email="tester@trylo.io",
            password_hash=hash_password("Password123!"),
            full_name="Priya Patel",
            role=UserRole.TESTER.value,
            is_active=True,
            created_at=now,
        )
        db.add(tester_user)

        tester_profile = TesterProfile(
            user_id=tester_id,
            bio="Lead QA Automation Engineer & Security Analyst with 6+ years experience testing fintech, SaaS, and AI developer platforms.",
            skills=["UI/UX", "Automated Testing", "Security Testing", "Performance Testing", "Frontend Development"],
            interests=["Developer Tools", "Artificial Intelligence", "FinTech", "Productivity"],
            experience_level="Advanced",
            devices=["macOS", "Linux", "Android", "iOS"],
            city="Bengaluru",
            country="India",
            linkedin_url="https://linkedin.com/in/priya-patel-qa",
        )
        db.add(tester_profile)
        db.flush()

        # 6. Create Tester Resume
        resume = TesterResume(
            id=uuid.uuid4(),
            tester_id=tester_id,
            resume_url="https://assets.trylo.io/resumes/priya_patel_qa_senior.pdf",
            file_name="Priya_Patel_Senior_QA_Automation_CV.pdf",
            portfolio_url="https://priyapatel.dev",
            github_url="https://github.com/priyapatel-qa",
            bug_bounty_url="https://hackerone.com/priyapatel",
            specializations=["Security & Vulnerability", "Automation & CI/CD", "API Testing"],
            created_at=now - timedelta(days=60),
            updated_at=now,
        )
        db.add(resume)

        # 7. Create Tester Certifications
        cert1 = TesterCertification(
            id=uuid.uuid4(),
            tester_id=tester_id,
            name="ISTQB Certified Tester Advanced Level - Test Automation Engineer",
            issuing_organization="International Software Testing Qualifications Board (ISTQB)",
            credential_id="ISTQB-CTAL-TAE-2023-8821",
            credential_url="https://istqb.org/verify/ISTQB-CTAL-TAE-2023-8821",
            verification_status="verified",
            created_at=now - timedelta(days=300),
        )
        cert2 = TesterCertification(
            id=uuid.uuid4(),
            tester_id=tester_id,
            name="AWS Certified Security - Specialty",
            issuing_organization="Amazon Web Services",
            credential_id="AWS-SEC-SPEC-99120",
            credential_url="https://aws.amazon.com/verification/AWS-SEC-SPEC-99120",
            verification_status="verified",
            created_at=now - timedelta(days=150),
        )
        db.add_all([cert1, cert2])

        # 8. Create Tester Endorsements
        endorse1 = TesterEndorsement(
            id=uuid.uuid4(),
            tester_id=tester_id,
            endorser_id=founder_id,
            skill_name="Security Testing",
            endorsement_note="Uncovered race conditions and auth token edge-cases with remarkable precision.",
            created_at=now - timedelta(days=40),
        )
        endorse2 = TesterEndorsement(
            id=uuid.uuid4(),
            tester_id=tester_id,
            endorser_id=founder_id,
            skill_name="Automated Testing",
            endorsement_note="Authored production-ready Playwright tests that we integrated into CI/CD directly.",
            created_at=now - timedelta(days=45),
        )
        db.add_all([endorse1, endorse2])

        # 9. Create Past Employer / Founder Reviews
        review1 = TesterEmployerReview(
            id=uuid.uuid4(),
            tester_id=tester_id,
            reviewer_id=founder_id,
            campaign_id=campaign_id,
            reviewer_name="Aarav Sharma",
            reviewer_title="CTO",
            company_name="Nexus AI Labs",
            overall_rating=5,
            thoroughness_rating=5,
            responsiveness_rating=5,
            bug_report_quality_rating=5,
            review_text="Priya is exceptional. Her bug reports include reproducible curl commands, console error traces, and exact network payload dumps. She discovered 3 subtle concurrency issues before our product launch.",
            project_scope="Nexus AI Core Engine Alpha",
            is_verified=True,
            created_at=now - timedelta(days=15),
        )
        review2 = TesterEmployerReview(
            id=uuid.uuid4(),
            tester_id=tester_id,
            reviewer_id=None,
            campaign_id=None,
            reviewer_name="Sarah Jenkins",
            reviewer_title="VP of Engineering",
            company_name="HyperScale Cloud",
            overall_rating=5,
            thoroughness_rating=5,
            responsiveness_rating=4,
            bug_report_quality_rating=5,
            review_text="One of the most rigorous and disciplined beta testers we have partnered with. Uncovered edge-case auth token leakage during intermittent network drops.",
            project_scope="HyperScale Gateway Beta",
            is_verified=True,
            created_at=now - timedelta(days=50),
        )
        db.add_all([review1, review2])

        # 10. Create Application from Tester to Campaign
        application = CampaignApplication(
            id=uuid.uuid4(),
            campaign_id=campaign_id,
            tester_id=tester_id,
            status="pending",
            screening_answers={
                "q1": "6 years in test automation & web security",
                "q2": "GitHub Actions, GitLab CI, Docker, Kubernetes",
            },
            motivation="I have extensive experience testing developer tools and static code analysis pipelines. Excited to stress test Nexus Copilot's edge-case detection accuracy!",
            created_at=now - timedelta(hours=12),
            updated_at=now - timedelta(hours=12),
        )
        db.add(application)

        db.commit()
        print("Demo data seeded successfully:")
        print("  - Founder: founder@trylo.io / Password123!")
        print("  - Tester:  tester@trylo.io  / Password123!")
        print("  - Startup: Nexus AI Labs (Verified with MCA CIN & Corporate Email)")
        print("  - Campaign: Nexus Copilot Beta")
        print("  - Tester Tier: Tier 3 (Top-Rated Vetted, 5.0 Star Rating, 2 Certifications)")

if __name__ == "__main__":
    seed()

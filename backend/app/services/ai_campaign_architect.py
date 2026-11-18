"""TryLo AI Campaign Architect Service.

Generates complete, production-ready testing campaign configurations from a single
product prompt or URL, including structured testing tasks, target audience criteria,
screening questions, and access instructions.
"""

from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import uuid
import json

from app.services.llm_gateway import is_gemini_configured, generate_text_with_gemini


def architect_campaign_from_prompt(
    prompt: str,
    product_url: Optional[str] = None,
    startup_name: Optional[str] = None,
) -> Dict[str, Any]:
    """Generate a complete 4-step campaign draft configuration using AI."""
    clean_prompt = (prompt or "").strip()
    s_name = (startup_name or "Startup Product").strip()
    p_url = (product_url or "https://app.example.com").strip()

    # Try Gemini 1.5 Flash if available
    if is_gemini_configured() and clean_prompt:
        llm_result = _generate_gemini_campaign(clean_prompt, p_url, s_name)
        if llm_result:
            return llm_result

    # Offline Heuristic Generator
    return _generate_heuristic_campaign(clean_prompt, p_url, s_name)


def _generate_heuristic_campaign(
    clean_prompt: str,
    product_url: str,
    startup_name: str,
) -> Dict[str, Any]:
    """Deterministic domain-heuristic campaign architect."""
    text_lower = clean_prompt.lower()

    # Detect domain archetype
    is_ecommerce = any(w in text_lower for w in ["shop", "store", "cart", "product", "checkout", "ecommerce", "subscription", "retail"])
    is_fintech = any(w in text_lower for w in ["finance", "payment", "bank", "invest", "crypto", "expense", "wallet", "invoice", "money"])
    is_devtool = any(w in text_lower for w in ["api", "sdk", "developer", "terminal", "cli", "code", "webhook", "cloud", "database"])
    is_health = any(w in text_lower for w in ["health", "fitness", "doctor", "telehealth", "patient", "medical", "workout"])

    if is_ecommerce:
        prod_type = "Web App"
        title = f"{startup_name}: Storefront & Subscription Checkout Beta"
        summary = "Test product discovery, cart adjustments, promo code application, and recurring subscription checkout."
        description = (
            f"Welcome to the {startup_name} beta test! We are testing our customer storefront experience.\n\n"
            "Our primary focus is verifying that users can easily filter product catalogs, customize item quantities, "
            "apply checkout promotions, and complete transactions without interface stall or validation errors."
        )
        tasks = [
            {
                "id": f"task-{uuid.uuid4().hex[:6]}",
                "title": "Explore Product Catalog & Filter by Category",
                "description": "Browse the main catalog, apply at least 2 filter facets, and select a product.",
                "is_required": True,
                "order": 1,
            },
            {
                "id": f"task-{uuid.uuid4().hex[:6]}",
                "title": "Add Items to Cart & Test Promo Code",
                "description": "Add 2 different products to your cart. Attempt to apply discount code 'TRYLO20'.",
                "is_required": True,
                "order": 2,
            },
            {
                "id": f"task-{uuid.uuid4().hex[:6]}",
                "title": "Complete Sandbox Payment Checkout",
                "description": "Proceed to checkout using provided test card credentials. Observe payment confirmation page.",
                "is_required": True,
                "order": 3,
            },
            {
                "id": f"task-{uuid.uuid4().hex[:6]}",
                "title": "Account Order History & Tracking Inspection",
                "description": "Navigate to customer account settings and verify your test order displays with correct totals.",
                "is_required": False,
                "order": 4,
            },
        ]
        screening_questions = [
            {
                "id": f"sq-{uuid.uuid4().hex[:6]}",
                "prompt": "How frequently do you make online purchases on independent e-commerce sites?",
                "question_type": "single_choice",
                "is_required": True,
                "options": ["Weekly", "Monthly", "Rarely", "Never"],
            },
            {
                "id": f"sq-{uuid.uuid4().hex[:6]}",
                "prompt": "Have you ever experienced checkout bugs or unexpected card declines on Shopify or WooCommerce?",
                "question_type": "text",
                "is_required": True,
                "options": [],
            },
            {
                "id": f"sq-{uuid.uuid4().hex[:6]}",
                "prompt": "Will you test this storefront on both desktop and mobile viewports?",
                "question_type": "boolean",
                "is_required": True,
                "options": [],
            },
        ]
        skills = ["UI/UX Feedback", "E-commerce Testing", "Mobile App Testing"]
        interests = ["E-commerce", "Productivity"]
        devices = ["Web Browser", "iOS", "Android"]

    elif is_fintech:
        prod_type = "Web App"
        title = f"{startup_name}: Financial Dashboard & Transaction Flow"
        summary = "Audit transaction logging, account linking, expense tagging, and export telemetry."
        description = (
            f"Help us pressure-test {startup_name}'s transaction tracking and account reconciliation flows.\n\n"
            "We want to verify precision in numbers, clear validation messages for edge cases, and snappy chart rendering."
        )
        tasks = [
            {
                "id": f"task-{uuid.uuid4().hex[:6]}",
                "title": "Authenticate & Connect Sandbox Account",
                "description": "Log in using the provided test account and initiate the sandbox account connection flow.",
                "is_required": True,
                "order": 1,
            },
            {
                "id": f"task-{uuid.uuid4().hex[:6]}",
                "title": "Categorize & Tag 3 Transactions",
                "description": "Locate transactions in the ledger table, apply custom tags, and test search filtering.",
                "is_required": True,
                "order": 2,
            },
            {
                "id": f"task-{uuid.uuid4().hex[:6]}",
                "title": "Generate & Export Monthly Analytics CSV",
                "description": "Navigate to the analytics view, adjust the date range picker, and export the summary report.",
                "is_required": True,
                "order": 3,
            },
        ]
        screening_questions = [
            {
                "id": f"sq-{uuid.uuid4().hex[:6]}",
                "prompt": "Do you use personal or business expense tracking software regularly?",
                "question_type": "single_choice",
                "is_required": True,
                "options": ["Daily", "Weekly", "Occasionally", "Never"],
            },
            {
                "id": f"sq-{uuid.uuid4().hex[:6]}",
                "prompt": "What OS and browser will you be using for testing?",
                "question_type": "text",
                "is_required": True,
                "options": [],
            },
        ]
        skills = ["QA Testing", "Fintech Testing", "Performance Testing"]
        interests = ["Fintech", "Productivity"]
        devices = ["Web Browser", "Mac", "Windows"]

    elif is_devtool:
        prod_type = "API / Developer Tool"
        title = f"{startup_name}: Developer API & Integration Sandbox"
        summary = "Test developer onboarding, API key generation, documentation clarity, and sandbox webhook dispatch."
        description = (
            f"We are inviting developers and technical testers to explore {startup_name}.\n\n"
            "Verify documentation examples, generate sandbox API keys, dispatch test requests, and evaluate error responses."
        )
        tasks = [
            {
                "id": f"task-{uuid.uuid4().hex[:6]}",
                "title": "Generate Developer API Key in Portal",
                "description": "Log into the developer portal, create a scoped API key, and test revocation.",
                "is_required": True,
                "order": 1,
            },
            {
                "id": f"task-{uuid.uuid4().hex[:6]}",
                "title": "Execute Quickstart Endpoint via Curl or Postman",
                "description": "Run the quickstart curl command from the docs. Verify response payload schema.",
                "is_required": True,
                "order": 2,
            },
            {
                "id": f"task-{uuid.uuid4().hex[:6]}",
                "title": "Simulate Error Payload & Inspect Status Codes",
                "description": "Send an invalid request body and confirm that the API returns clean 400 validation error objects.",
                "is_required": True,
                "order": 3,
            },
        ]
        screening_questions = [
            {
                "id": f"sq-{uuid.uuid4().hex[:6]}",
                "prompt": "How comfortable are you with REST APIs, Postman, and Curl command lines?",
                "question_type": "single_choice",
                "is_required": True,
                "options": ["Advanced / Daily Developer", "Intermediate", "Beginner", "Non-technical"],
            },
            {
                "id": f"sq-{uuid.uuid4().hex[:6]}",
                "prompt": "What programming languages do you build backends with?",
                "question_type": "text",
                "is_required": True,
                "options": [],
            },
        ]
        skills = ["API Testing", "Python", "JavaScript/TypeScript", "QA Testing"]
        interests = ["Developer Tools", "AI / Machine Learning"]
        devices = ["Linux", "Mac", "Windows"]

    else:
        prod_type = "Web App"
        title = f"{startup_name}: Comprehensive Usability & Core Workflow Beta"
        summary = f"Test the end-to-end user experience of {startup_name}, from onboarding to core feature execution."
        description = (
            f"Welcome to the {startup_name} testing program! We are validating core functionality, user intuition, "
            "and edge-case stability before opening public signups.\n\n"
            "Please follow the structured tasks below and record any UI friction, unhandled errors, or confusing UX."
        )
        tasks = [
            {
                "id": f"task-{uuid.uuid4().hex[:6]}",
                "title": "Account Creation & Guided Onboarding",
                "description": "Register a new test account and complete the initial setup wizard.",
                "is_required": True,
                "order": 1,
            },
            {
                "id": f"task-{uuid.uuid4().hex[:6]}",
                "title": "Execute Primary Workflow Action",
                "description": "Interact with the main product feature. Note any responsiveness delays or UI glitches.",
                "is_required": True,
                "order": 2,
            },
            {
                "id": f"task-{uuid.uuid4().hex[:6]}",
                "title": "Settings, Profile & Notification Customization",
                "description": "Modify user profile settings, toggle preferences, and verify persistent state on refresh.",
                "is_required": False,
                "order": 3,
            },
        ]
        screening_questions = [
            {
                "id": f"sq-{uuid.uuid4().hex[:6]}",
                "prompt": "Which primary device and operating system will you use to conduct your test?",
                "question_type": "single_choice",
                "is_required": True,
                "options": ["Desktop (Chrome/Firefox/Safari)", "Mobile iOS", "Mobile Android", "Tablet/iPad"],
            },
            {
                "id": f"sq-{uuid.uuid4().hex[:6]}",
                "prompt": "Do you agree to record a 2-minute video walkthrough if you encounter a blocker bug?",
                "question_type": "boolean",
                "is_required": True,
                "options": [],
            },
        ]
        skills = ["UI/UX Feedback", "QA Testing"]
        interests = ["Productivity", "Social"]
        devices = ["Web Browser", "iOS", "Android"]

    access_instructions = (
        f"1. Access the test build at: {product_url}\n"
        "2. Sandbox Credentials:\n"
        "   - Email: beta-tester@trylo.io\n"
        "   - Password: TestPassword2026!\n"
        "3. If prompted for an invite code, enter: 'TRYLO-BETA-ACCESS'\n"
        "4. Note: Do not use real personal credit cards. All payments are running in test mode."
    )

    return {
        "title": title,
        "summary": summary,
        "description": description,
        "product_type": prod_type,
        "product_url": product_url,
        "access_instructions": access_instructions,
        "testing_tasks": tasks,
        "screening_questions": screening_questions,
        "target_audience": {
            "skills": skills,
            "interests": interests,
            "experience_level": "Intermediate",
            "devices": devices,
            "countries": ["India", "United States", "Global"],
            "notes": "Testers who provide detailed reproduction steps and screen recordings will be prioritized for reward bounties.",
        },
        "max_testers": 25,
        "reward_type": "monetary",
        "reward_amount": 25,
        "reward_currency": "$",
        "reward_description": "$25 completion bounty for approved feedback reports",
        "engine_used": "TryLo Local Campaign Architect Engine",
        "architected_at": datetime.now(timezone.utc),
    }


def _generate_gemini_campaign(
    prompt: str,
    product_url: str,
    startup_name: str,
) -> Optional[Dict[str, Any]]:
    """Generate campaign configuration using Gemini 1.5 Flash."""
    llm_prompt = f"""You are the TryLo AI Campaign Architect. Create a complete, highly structured beta testing campaign for this product:

Product/Startup: {startup_name}
Target URL: {product_url}
Product Pitch/Concept: {prompt}

Output strictly valid JSON with no markdown backticks, conforming to:
{{
  "title": "<Concise campaign title>",
  "summary": "<1-2 sentence pitch for testers>",
  "description": "<Detailed markdown campaign instructions>",
  "product_type": "Web App" | "iOS App" | "Android App" | "API / Developer Tool" | "Desktop App",
  "access_instructions": "<Step-by-step access instructions with sandbox credentials>",
  "testing_tasks": [
    {{"id": "task-1", "title": "<task 1 title>", "description": "<step by step instructions>", "is_required": true, "order": 1}},
    {{"id": "task-2", "title": "<task 2 title>", "description": "<step by step instructions>", "is_required": true, "order": 2}},
    {{"id": "task-3", "title": "<task 3 title>", "description": "<step by step instructions>", "is_required": true, "order": 3}}
  ],
  "screening_questions": [
    {{"id": "sq-1", "prompt": "<question prompt>", "question_type": "single_choice", "is_required": true, "options": ["Option A", "Option B"]}},
    {{"id": "sq-2", "prompt": "<question prompt>", "question_type": "text", "is_required": true, "options": []}}
  ],
  "target_audience": {{
    "skills": ["UI/UX Feedback", "QA Testing"],
    "interests": ["Productivity"],
    "experience_level": "Intermediate",
    "devices": ["Web Browser"],
    "countries": ["India", "Global"],
    "notes": "<Tester instructions>"
  }},
  "max_testers": 25,
  "reward_type": "monetary",
  "reward_amount": 20,
  "reward_currency": "$"
}}"""

    system_instruction = "You are a product management and QA automation expert generating testing campaigns. Return only raw valid JSON."
    response = generate_text_with_gemini(llm_prompt, system_instruction=system_instruction)
    if not response:
        return None

    try:
        # Strip code fences if present
        clean_json = response.strip()
        if clean_json.startswith("```"):
            clean_json = clean_json.split("\n", 1)[1]
            if clean_json.endswith("```"):
                clean_json = clean_json.rsplit("```", 1)[0]

        data = json.loads(clean_json.strip())
        data["product_url"] = product_url
        data["engine_used"] = "Google Gemini 1.5 Flash (Campaign Architect)"
        data["architected_at"] = datetime.now(timezone.utc)
        return data
    except Exception:
        return None

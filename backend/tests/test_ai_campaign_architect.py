"""Tests for TryLo AI Campaign Architect Service."""

import pytest
from app.services.ai_campaign_architect import architect_campaign_from_prompt


def test_architect_campaign_heuristic_ecommerce():
    prompt = "We built a multi-currency Shopify alternative store with shopping cart and checkout promotions."
    res = architect_campaign_from_prompt(
        prompt=prompt,
        product_url="https://store.example.com",
        startup_name="ShopWave",
    )
    assert "ShopWave" in res["title"]
    assert res["product_type"] == "Web App"
    assert len(res["testing_tasks"]) >= 3
    assert any("cart" in t["title"].lower() or "checkout" in t["title"].lower() for t in res["testing_tasks"])
    assert len(res["screening_questions"]) >= 2
    assert "E-commerce Testing" in res["target_audience"]["skills"]
    assert res["reward_amount"] == 25


def test_architect_campaign_heuristic_devtool():
    prompt = "High performance terminal CLI and developer API for edge database queries."
    res = architect_campaign_from_prompt(
        prompt=prompt,
        product_url="https://api.devpulse.io",
        startup_name="DevPulse",
    )
    assert "DevPulse" in res["title"]
    assert "API / Developer Tool" in res["product_type"]
    assert any("api" in t["title"].lower() or "curl" in t["description"].lower() for t in res["testing_tasks"])
    assert "API Testing" in res["target_audience"]["skills"]


def test_architect_campaign_heuristic_fintech():
    prompt = "Personal expense and bank ledger sync with monthly budget tracking."
    res = architect_campaign_from_prompt(
        prompt=prompt,
        product_url="https://wallet.example.com",
        startup_name="LedgerMint",
    )
    assert "LedgerMint" in res["title"]
    assert any("transaction" in t["title"].lower() or "account" in t["title"].lower() for t in res["testing_tasks"])


def test_architect_campaign_heuristic_generic():
    prompt = "A collaborative video annotation tool for remote design teams."
    res = architect_campaign_from_prompt(
        prompt=prompt,
        product_url="https://annotate.team",
        startup_name="TeamAnnotate",
    )
    assert "TeamAnnotate" in res["title"]
    assert len(res["testing_tasks"]) >= 3
    assert "TryLo Local Campaign Architect Engine" in res["engine_used"]


def test_architect_campaign_gemini_mock(monkeypatch):
    from app.services import ai_campaign_architect

    monkeypatch.setattr(ai_campaign_architect, "is_gemini_configured", lambda: True)
    mock_json = """{
      "title": "SuperApp: AI Onboarding Sprints",
      "summary": "Validate intelligent user flows and automated suggestions.",
      "description": "Comprehensive evaluation of SuperApp beta release.",
      "product_type": "Web App",
      "access_instructions": "Access via app.superapp.io with code GEMINI-BETA",
      "testing_tasks": [
        {"id": "task-1", "title": "Run AI onboarding", "description": "Complete setup", "is_required": true, "order": 1}
      ],
      "screening_questions": [
        {"id": "sq-1", "prompt": "Have you used AI tools?", "question_type": "boolean", "is_required": true, "options": []}
      ],
      "target_audience": {
        "skills": ["UI/UX Feedback"],
        "interests": ["AI"],
        "experience_level": "Intermediate",
        "devices": ["Web Browser"],
        "countries": ["Global"],
        "notes": "Provide video walkthroughs"
      },
      "max_testers": 20,
      "reward_type": "monetary",
      "reward_amount": 30,
      "reward_currency": "$"
    }"""
    monkeypatch.setattr(ai_campaign_architect, "generate_text_with_gemini", lambda *args, **kwargs: mock_json)

    res = architect_campaign_from_prompt(
        prompt="Smart AI workspace",
        product_url="https://app.superapp.io",
        startup_name="SuperApp",
    )
    assert res["title"] == "SuperApp: AI Onboarding Sprints"
    assert "Google Gemini 1.5 Flash" in res["engine_used"]
    assert res["reward_amount"] == 30

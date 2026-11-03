import sys
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token

client = TestClient(app)

# 1. Login Founder
login_res = client.post("/api/auth/login", data={"username": "founder@trylo.io", "password": "Password123!"})
assert login_res.status_code == 200, f"Founder login failed: {login_res.text}"
founder_token = login_res.json()["access_token"]
founder_headers = {"Authorization": f"Bearer {founder_token}"}

# Get Founder Startups
st_res = client.get("/api/startups/my", headers=founder_headers)
assert st_res.status_code == 200, f"Get startups failed: {st_res.text}"
startups = st_res.json()
assert len(startups) > 0, "No startups found"
startup_id = startups[0]["id"]

# Verify Startup Verification Endpoint
v_res = client.get(f"/api/startups/{startup_id}/verification", headers=founder_headers)
assert v_res.status_code == 200, f"Get verification failed: {v_res.text}"
v_data = v_res.json()
print("=== [API TEST 1] FOUNDER BUSINESS VERIFICATION PASSED ===")
print(f"  Startup ID: {startup_id}")
print(f"  Status: {v_data['verification_status']}")
print(f"  Legal Name: {v_data['legal_entity_name']}")
print(f"  CIN: {v_data['registration_number']}")
print(f"  Document Name: {v_data['document_name']}")
print(f"  Document URL: {v_data['document_url']}")
assert v_data["verification_status"] == "verified"
assert v_data["document_url"] == "/documents/Nexus_AI_Labs_MCA_Incorporation_Attested.pdf"

# 2. Login Tester
t_login = client.post("/api/auth/login", data={"username": "tester@trylo.io", "password": "Password123!"})
assert t_login.status_code == 200, f"Tester login failed: {t_login.text}"
tester_token = t_login.json()["access_token"]
tester_headers = {"Authorization": f"Bearer {tester_token}"}

# Verify Tester Overview Endpoint
t_res = client.get("/api/testers/me/overview", headers=tester_headers)
assert t_res.status_code == 200, f"Tester overview failed: {t_res.text}"
t_data = t_res.json()
print("\n=== [API TEST 2] TESTER CREDIBILITY & ATTESTATIONS PASSED ===")
print(f"  Tester ID: {t_data['tester_id']}")
print(f"  Tier: {t_data['verification_tier']} ({t_data['tier_label']})")
print(f"  Has Resume: {t_data['has_resume']}")
print(f"  Attested Resume URL: {t_data['resume']['resume_url']}")
print(f"  Certifications Count: {t_data['certifications_count']}")
for c in t_data['certifications']:
    print(f"    - {c['name']} -> {c['credential_url']} [{c['verification_status']}]")
print(f"  Reviews Count: {t_data['reviews_count']} (Average Rating: {t_data['average_rating']})")
assert t_data["verification_tier"] == 3
assert t_data["has_resume"] is True
assert len(t_data["certifications"]) >= 2
assert t_data["reviews_count"] >= 3

# 3. Founder audits Tester via Public Endpoint
audit_res = client.get(f"/api/testers/{t_data['tester_id']}/overview", headers=founder_headers)
assert audit_res.status_code == 200, f"Founder audit failed: {audit_res.text}"
audit_data = audit_res.json()
print("\n=== [API TEST 3] FOUNDER AUDIT OF TESTER CREDENTIALS PASSED ===")
print(f"  Audited Tester Tier: {audit_data['verification_tier']}")
print(f"  Audited Resume: {audit_data['resume']['file_name']}")
print(f"  Endorsements: {audit_data['endorsements_count']}")
print("  All API verification contract tests passed successfully!")


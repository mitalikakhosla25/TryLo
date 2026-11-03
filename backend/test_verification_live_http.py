import json
import urllib.request
import urllib.parse

BASE_URL = "http://127.0.0.1:8000"

def post_json(url, data=None, headers=None):
    headers = headers or {}
    encoded = json.dumps(data).encode("utf-8") if data is not None else b""
    headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=encoded, headers=headers, method="POST")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def post_form(url, form_data):
    encoded = urllib.parse.urlencode(form_data).encode("utf-8")
    req = urllib.request.Request(url, data=encoded, headers={"Content-Type": "application/x-www-form-urlencoded"}, method="POST")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def get_json(url, headers=None):
    headers = headers or {}
    req = urllib.request.Request(url, headers=headers, method="GET")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

print("=== RUNNING LIVE HTTP API CONTRACT VERIFICATION ===")

# 1. Login Founder
founder_auth = post_form(f"{BASE_URL}/api/auth/login", {"username": "founder@trylo.io", "password": "Password123!"})
founder_token = founder_auth["access_token"]
founder_headers = {"Authorization": f"Bearer {founder_token}"}
print("1. Founder authenticated via live JWT.")

# Get Founder Startups
startups = get_json(f"{BASE_URL}/api/startups/my", headers=founder_headers)
startup_id = startups[0]["id"]
print(f"   Founder Startup: {startups[0]['name']} (ID: {startup_id})")

# 2. Get Startup Verification
v_data = get_json(f"{BASE_URL}/api/startups/{startup_id}/verification", headers=founder_headers)
print("2. Founder Startup Verification Live Status:")
print(f"   Status:            {v_data['verification_status']}")
print(f"   Legal Entity:      {v_data['legal_entity_name']}")
print(f"   Registration Type: {v_data['registration_type']}")
print(f"   CIN Number:        {v_data['registration_number']}")
print(f"   GSTIN Identifier:  {v_data['tax_identifier']}")
print(f"   Corporate Email:   {v_data['corporate_email']} (Domain Verified: {v_data['is_corporate_email_verified']})")
print(f"   Attested Document: {v_data['document_name']}")
print(f"   Document URL:      {v_data['document_url']}")
assert v_data["verification_status"] == "verified", f"Expected verified, got {v_data['verification_status']}"
assert v_data["document_name"] == "Nexus_AI_Labs_MCA_Incorporation_Attested.pdf"

# 3. Login Tester
tester_auth = post_form(f"{BASE_URL}/api/auth/login", {"username": "tester@trylo.io", "password": "Password123!"})
tester_token = tester_auth["access_token"]
tester_headers = {"Authorization": f"Bearer {tester_token}"}
print("\n3. Tester authenticated via live JWT.")

# 4. Get Tester Verification Overview (Authenticated 'me')
t_data = get_json(f"{BASE_URL}/api/testers/me/overview", headers=tester_headers)
print("4. Tester Credibility Hub Live Overview:")
print(f"   Verification Tier:    {t_data['verification_tier']} ({t_data['tier_label']})")
print(f"   Has Resume:           {t_data['has_resume']}")
print(f"   Attested Resume:      {t_data['resume']['file_name']}")
print(f"   Resume URL:           {t_data['resume']['resume_url']}")
print(f"   Certifications Count: {t_data['certifications_count']}")
for idx, c in enumerate(t_data['certifications'], 1):
    print(f"     [{idx}] {c['name']} (Org: {c['issuing_organization']})")
    print(f"         ID: {c['credential_id']} | Attested Proof: {c['credential_url']} [{c['verification_status']}]")
print(f"   Employer Reviews:     {t_data['reviews_count']} verified reviews (Average Rating: {t_data['average_rating']} stars)")
for idx, r in enumerate(t_data['reviews'], 1):
    print(f"     [{idx}] {r['reviewer_name']} ({r['company_name']}) - {r['overall_rating']} stars: \"{r['review_text']}\"")
print(f"   Skill Endorsements:   {t_data['endorsements_count']}")
for idx, e in enumerate(t_data['endorsements'], 1):
    print(f"     [{idx}] {e['skill_name']} endorsed by {e['endorser_name']}")

assert t_data["verification_tier"] == 3
assert t_data["has_resume"] is True
assert len(t_data["certifications"]) >= 2
assert t_data["reviews_count"] >= 3

# 5. Founder screens/audits Tester via Public Verification Endpoint
tester_id = t_data["tester_id"]
audit_data = get_json(f"{BASE_URL}/api/testers/{tester_id}/overview", headers=founder_headers)
print(f"\n5. Founder Auditing Tester Public Credentials (ID: {tester_id}):")
print(f"   Audited Tier:         {audit_data['verification_tier']} ({audit_data['tier_label']})")
print(f"   Audited Resume File:  {audit_data['resume']['file_name']}")
print(f"   Audited Certificates: {audit_data['certifications_count']} verified")
print(f"   Audited Rating:       {audit_data['average_rating']} stars across {audit_data['reviews_count']} reviews")
assert audit_data["verification_tier"] == 3

print("\n=== ALL LIVE HTTP VERIFICATION TESTS PASSED SUCCESSFULLY! ===")


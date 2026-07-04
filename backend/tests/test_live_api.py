"""Live API integration tests — verifies all endpoints are working."""
import urllib.request
import json
import sys

BASE = "http://localhost:8000"

def get(path):
    r = urllib.request.urlopen(BASE + path, timeout=10)
    return json.loads(r.read())

def post(path, data):
    payload = json.dumps(data).encode()
    req = urllib.request.Request(
        BASE + path, data=payload,
        headers={"Content-Type": "application/json"}
    )
    r = urllib.request.urlopen(req, timeout=15)
    return json.loads(r.read())

def patch(path, data):
    payload = json.dumps(data).encode()
    req = urllib.request.Request(
        BASE + path, data=payload,
        headers={"Content-Type": "application/json"},
        method="PATCH"
    )
    r = urllib.request.urlopen(req, timeout=10)
    return json.loads(r.read())

def run_tests():
    failures = []

    # T1: Health
    print("T1: Health endpoint...", end=" ")
    try:
        h = get("/api/health")
        assert h["status"] == "healthy", f"Expected healthy, got {h}"
        print("PASS ✓")
    except Exception as e:
        print(f"FAIL ✗ — {e}")
        failures.append("T1 Health")

    # T2: States
    print("T2: States endpoint...", end=" ")
    try:
        states = get("/api/locations/states")
        assert len(states) >= 28, f"Expected 28+ states, got {len(states)}"
        assert states[0]["code"], "State missing code"
        print(f"PASS ✓ ({len(states)} states)")
    except Exception as e:
        print(f"FAIL ✗ — {e}")
        failures.append("T2 States")

    # T3: Districts
    print("T3: Districts endpoint...", end=" ")
    try:
        districts = get("/api/locations/districts/UP")
        assert len(districts) > 0, "No districts for UP"
        print(f"PASS ✓ ({len(districts)} districts for UP)")
    except Exception as e:
        print(f"FAIL ✗ — {e}")
        failures.append("T3 Districts")

    # T4: Schemes list
    print("T4: Schemes listing...", end=" ")
    try:
        res = get("/api/schemes?page=1&page_size=5")
        assert res["total"] > 0, "No schemes in DB"
        assert len(res["schemes"]) > 0, "Empty schemes list"
        print(f"PASS ✓ ({res['total']} total schemes)")
    except Exception as e:
        print(f"FAIL ✗ — {e}")
        failures.append("T4 Schemes")

    # T5: Categories
    print("T5: Categories...", end=" ")
    try:
        cats = get("/api/schemes/categories")
        assert len(cats) >= 9, f"Expected 9 categories, got {len(cats)}"
        names = [c["name"] for c in cats]
        print(f"PASS ✓ ({names})")
    except Exception as e:
        print(f"FAIL ✗ — {e}")
        failures.append("T5 Categories")

    # T6: Scheme detail
    print("T6: Scheme detail by slug...", end=" ")
    try:
        schemes = get("/api/schemes?page=1&page_size=1")
        slug = schemes["schemes"][0]["slug"]
        detail = get(f"/api/schemes/{slug}")
        assert detail["slug"] == slug, "Slug mismatch"
        assert "eligibility_rules_summary" in detail, "Missing eligibility rules"
        print(f"PASS ✓ (slug: {slug})")
    except Exception as e:
        print(f"FAIL ✗ — {e}")
        failures.append("T6 Scheme detail")

    # T7: Eligibility check
    print("T7: Eligibility check (farmer, OBC, UP, ₹1.2L)...", end=" ")
    try:
        result = post("/api/eligibility/check", {
            "age": 35, "gender": "male", "state": "UP",
            "occupation": "farmer", "annual_income": 120000,
            "category": "obc", "disability": False, "is_student": False,
            "is_farmer": True, "is_woman": False, "is_senior_citizen": False,
            "is_bpl": False, "land_holding_hectares": 1.5, "language": "en"
        })
        assert result["total_schemes_checked"] > 0, "No schemes checked"
        assert result["eligible_count"] >= 0, "Invalid eligible count"
        print(f"PASS ✓ ({result['eligible_count']}/{result['total_schemes_checked']} eligible)")
        if result["schemes"]:
            top = result["schemes"][0]
            print(f"       Top match: {top['name']} ({round(top['match_score']*100)}% confidence)")
    except Exception as e:
        print(f"FAIL ✗ — {e}")
        failures.append("T7 Eligibility")

    # T8: Chat endpoint
    print("T8: Chat endpoint...", end=" ")
    try:
        chat = post("/api/chat", {
            "message": "What is PM-KISAN scheme?",
            "language": "en"
        })
        assert chat["response"], "Empty chat response"
        assert chat["session_id"], "Missing session ID"
        print(f"PASS ✓ (session: {chat['session_id'][:8]}...)")
    except Exception as e:
        print(f"FAIL ✗ — {e}")
        failures.append("T8 Chat")

    # T9: Scheme status PATCH
    print("T9: Admin — PATCH scheme status...", end=" ")
    try:
        schemes = get("/api/schemes?page=1&page_size=1")
        scheme_id = schemes["schemes"][0]["id"]
        original_status = schemes["schemes"][0]["is_active"]
        # Toggle off
        resp = patch(f"/api/schemes/{scheme_id}/status", {"is_active": not original_status})
        assert resp["is_active"] == (not original_status), "Status not updated"
        # Toggle back
        patch(f"/api/schemes/{scheme_id}/status", {"is_active": original_status})
        print("PASS ✓ (toggle works + reverted)")
    except Exception as e:
        print(f"FAIL ✗ — {e}")
        failures.append("T9 Admin PATCH")

    # T10: Search
    print("T10: Search schemes...", end=" ")
    try:
        res = get("/api/schemes?search=KISAN&page=1&page_size=10")
        print(f"PASS ✓ ({res['total']} results for 'KISAN')")
    except Exception as e:
        print(f"FAIL ✗ — {e}")
        failures.append("T10 Search")

    print("\n" + "="*50)
    if failures:
        print(f"FAILED {len(failures)} test(s): {failures}")
        sys.exit(1)
    else:
        print(f"ALL 10 TESTS PASSED ✓")

if __name__ == "__main__":
    run_tests()


import pytest
from app.schemas.eligibility import EligibilityRequest
from app.services.eligibility_engine import eligibility_engine
from app.models.scheme import EligibilityRule

def test_profile_summary_generation():
    profile = EligibilityRequest(
        age=25,
        gender="female",
        state="UP",
        district="Lucknow",
        occupation="farmer",
        annual_income=50000.0,
        category="obc",
        disability=False,
        is_student=False,
        is_farmer=True,
        is_woman=True,
        is_senior_citizen=False,
        is_bpl=True,
        land_holding_hectares=1.2,
        language="en"
    )
    summary = eligibility_engine._build_profile_summary(profile)
    assert "25 year old female" in summary
    assert "from UP" in summary
    assert "annual income: ₹50,000" in summary
    assert "farmer" in summary
    assert "BPL" in summary
    assert "land: 1.2 hectares" in summary

def test_evaluate_rule_age():
    rule = EligibilityRule(
        rule_type="age",
        operator="between",
        value={"min": 18, "max": 40},
        is_mandatory=True
    )
    
    profile_ok = EligibilityRequest(
        age=25, gender="male", state="UP", occupation="farmer",
        annual_income=50000, category="general"
    )
    assert eligibility_engine.evaluate_rule(rule, profile_ok) is True

    profile_too_young = EligibilityRequest(
        age=15, gender="male", state="UP", occupation="farmer",
        annual_income=50000, category="general"
    )
    assert eligibility_engine.evaluate_rule(rule, profile_too_young) is False

def test_evaluate_rule_income():
    rule = EligibilityRule(
        rule_type="income",
        operator="lte",
        value=200000,
        is_mandatory=True
    )
    
    profile_ok = EligibilityRequest(
        age=25, gender="male", state="UP", occupation="farmer",
        annual_income=150000, category="general"
    )
    assert eligibility_engine.evaluate_rule(rule, profile_ok) is True

    profile_too_rich = EligibilityRequest(
        age=25, gender="male", state="UP", occupation="farmer",
        annual_income=250000, category="general"
    )
    assert eligibility_engine.evaluate_rule(rule, profile_too_rich) is False

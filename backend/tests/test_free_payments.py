"""Automated Unit Tests for TryLo 100% Free Payment & NPCI UPI Protocol Engine."""

import uuid
from app.services.free_payment_service import FreePaymentService, KNOWN_BANK_PSPS
from app.schemas.free_payment import (
    VpaValidationRequest,
    UpiIntentCreateRequest,
    VerifyUtrDepositRequest,
    SandboxPaymentRequest,
)
from app.api.free_payments import get_free_gateway_info, validate_vpa


def test_free_gateway_info():
    info = get_free_gateway_info()
    assert "NPCI" in info.provider
    assert "0%" in info.merchant_discount_rate
    assert "₹0.00" in info.cost_per_transaction
    assert info.supported_banks_count > 40
    assert "Google Pay" in info.supported_methods
    assert "PhonePe" in info.supported_methods


def test_vpa_validation_known_banks():
    # 1. HDFC on Google Pay
    res_hdfc = FreePaymentService.validate_vpa("founder@okhdfcbank")
    assert res_hdfc["is_valid"] is True
    assert res_hdfc["bank"] == "HDFC Bank"
    assert res_hdfc["app"] == "Google Pay"
    assert res_hdfc["npci_verified"] is True

    # 2. SBI on Google Pay
    res_sbi = FreePaymentService.validate_vpa("tester@oksbi")
    assert res_sbi["is_valid"] is True
    assert res_sbi["bank"] == "State Bank of India"
    assert res_sbi["app"] == "Google Pay"

    # 3. YES Bank on PhonePe
    res_phonepe = FreePaymentService.validate_vpa("qa.lead@ybl")
    assert res_phonepe["is_valid"] is True
    assert res_phonepe["bank"] == "YES Bank"
    assert res_phonepe["app"] == "PhonePe"

    # 4. Paytm
    res_paytm = FreePaymentService.validate_vpa("beta.tester@paytm")
    assert res_paytm["is_valid"] is True
    assert res_paytm["app"] == "Paytm"

    # 5. ICICI
    res_icici = FreePaymentService.validate_vpa("founder@okicici")
    assert res_icici["is_valid"] is True
    assert res_icici["bank"] == "ICICI Bank"

    # 6. TryLo Escrow handle
    res_trylo = FreePaymentService.validate_vpa("vault@oktrylo")
    assert res_trylo["is_valid"] is True
    assert res_trylo["bank"] == "TryLo Escrow Reserve"


def test_vpa_validation_invalid_and_generic():
    # Invalid without handle
    res_bad1 = FreePaymentService.validate_vpa("invalid-vpa")
    assert res_bad1["is_valid"] is False
    assert "error" in res_bad1

    # Empty string
    res_bad2 = FreePaymentService.validate_vpa("")
    assert res_bad2["is_valid"] is False

    # Generic valid format
    res_generic = FreePaymentService.validate_vpa("user@somebank")
    assert res_generic["is_valid"] is True
    assert res_generic["handle"] == "somebank"


def test_upi_intent_uri_generation():
    intent = FreePaymentService.generate_upi_intent_uri(
        amount=7500.50,
        campaign_title="AI Beta Launch",
        transaction_ref="TRYLO-TEST-1234",
    )
    uri = intent["upi_uri"]
    assert uri.startswith("upi://pay?")
    assert "pa=trylo.escrow@okhdfcbank" in uri
    assert "am=7500.50" in uri
    assert "cu=INR" in uri
    assert "tr=TRYLO-TEST-1234" in uri
    assert intent["cost"] == "₹0.00 (Zero MDR • 100% Free UPI)"


def test_utr_syntax_validation():
    # Valid 12-digit numeric UTR
    ok, err = FreePaymentService.verify_utr_format("428134587851")
    assert ok is True
    assert err is None

    # Invalid short UTR
    ok_short, err_short = FreePaymentService.verify_utr_format("12345")
    assert ok_short is False
    assert "12 numeric digits" in err_short

    # Invalid alphanumeric UTR
    ok_alpha, err_alpha = FreePaymentService.verify_utr_format("42813458ABCD")
    assert ok_alpha is False
    assert "12 numeric digits" in err_alpha


def test_receipt_certificate_generation():
    cert = FreePaymentService.generate_receipt_certificate(
        transaction_ref="UTR-428134587851",
        utr_number="428134587851",
        amount=5000.0,
        campaign_title="FinTrust Testing",
        payer="founder@okhdfcbank",
    )
    assert cert["verified"] is True
    assert cert["certificate_id"].startswith("CERT-")
    assert len(cert["sha256_hash"]) == 64
    assert "NPCI" in cert["standard"]

"""Pydantic Schemas for TryLo 100% Free Payment API."""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class VpaValidationRequest(BaseModel):
    vpa: str = Field(..., description="UPI Virtual Payment Address (e.g. tester@okhdfcbank)")


class VpaValidationResponse(BaseModel):
    is_valid: bool
    vpa: str
    username: Optional[str] = None
    handle: Optional[str] = None
    bank: Optional[str] = None
    app: Optional[str] = None
    category: Optional[str] = None
    npci_verified: bool = False
    message: str


class UpiIntentCreateRequest(BaseModel):
    campaign_id: str = Field(..., description="Target Campaign UUID")
    amount: float = Field(..., gt=0, description="Escrow deposit amount in INR")
    note: Optional[str] = Field(None, description="Optional custom transaction note")


class UpiIntentResponse(BaseModel):
    upi_uri: str
    payee_vpa: str
    payee_name: str
    amount: float
    currency: str
    transaction_reference: str
    note: str
    generated_at: str
    cost: str


class VerifyUtrDepositRequest(BaseModel):
    campaign_id: str = Field(..., description="Target Campaign UUID")
    utr_number: str = Field(..., min_length=12, max_length=12, description="12-digit NPCI Bank UTR")
    amount: float = Field(..., gt=0, description="Amount deposited")
    payer_vpa: Optional[str] = Field(None, description="Payer's UPI ID for receipt")
    transaction_reference: Optional[str] = Field(None, description="Generated transaction reference")


class VerifyUtrDepositResponse(BaseModel):
    success: bool
    message: str
    campaign_id: str
    total_funded: float
    remaining_balance: float
    status: str
    utr_number: str
    deposit_reference: str
    receipt_certificate: Dict[str, Any]


class SandboxPaymentRequest(BaseModel):
    campaign_id: str = Field(..., description="Target Campaign UUID")
    amount: float = Field(..., gt=0, description="Amount to deposit in sandbox")
    simulated_method: str = Field("UPI_SIMULATED", description="Simulated method: UPI_SIMULATED or CARD_TEST")
    test_vpa_or_card: Optional[str] = Field("founder@okhdfcbank", description="Simulated identifier")


class FreeGatewayInfoResponse(BaseModel):
    provider: str
    cost_per_transaction: str
    merchant_discount_rate: str
    supported_methods: list[str]
    npci_protocol: str
    settlement_type: str
    supported_banks_count: int

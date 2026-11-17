"""TryLo Escrow Vault and Simulated UPI Payout Pydantic Schemas."""

from datetime import datetime
from typing import List, Optional
import re
from pydantic import BaseModel, ConfigDict, Field, field_validator


UPI_REGEX = re.compile(r"^[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z0-9.\-_]{2,49}$")


def validate_upi_format(v: str) -> str:
    cleaned = v.strip().lower()
    if not UPI_REGEX.match(cleaned):
        raise ValueError("Invalid UPI ID format. Must match username@bank (e.g. alex@okhdfcbank).")
    return cleaned


class EscrowResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    campaign_id: str
    currency: str = "INR"
    total_funded: float
    disbursed_amount: float
    remaining_balance: float
    status: str
    deposit_reference: Optional[str] = None
    funded_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class FundEscrowRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Amount in INR to deposit and lock into campaign escrow.")
    payment_method: str = Field(default="simulated_upi", description="Payment method: simulated_upi, card, netbanking.")
    simulated_account: Optional[str] = Field(default=None, description="Optional bank account or card identifier.")


class DisbursePayoutRequest(BaseModel):
    tester_id: str = Field(..., description="Target tester user UUID.")
    amount: float = Field(..., gt=0, description="Disbursement bounty amount in INR.")
    upi_id: Optional[str] = Field(default=None, description="Tester UPI ID (e.g. user@okhdfcbank). If empty, uses tester profile default.")
    milestone_type: str = Field(default="task_completion", description="Reason: task_completion, bug_bounty, or campaign_reward.")
    task_progress_id: Optional[str] = None
    feedback_id: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("upi_id")
    @classmethod
    def check_upi(cls, v: Optional[str]) -> Optional[str]:
        if v:
            return validate_upi_format(v)
        return None


class PayoutResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    campaign_id: str
    campaign_title: Optional[str] = None
    startup_name: Optional[str] = None
    tester_id: str
    tester_name: Optional[str] = None
    amount: float
    currency: str = "INR"
    upi_id: str
    reference_id: str
    utr_number: str
    status: str
    milestone_type: str
    notes: Optional[str] = None
    disbursed_at: datetime
    created_at: datetime


class TesterEarningsOverviewResponse(BaseModel):
    lifetime_earnings: float
    completed_payouts_count: int
    saved_upi_id: Optional[str] = None
    payouts: List[PayoutResponse]


class FounderEscrowOverviewResponse(BaseModel):
    total_escrow_funded: float
    total_escrow_disbursed: float
    total_escrow_remaining: float
    active_escrow_campaigns_count: int
    recent_disbursements: List[PayoutResponse]


class UpdateUpiRequest(BaseModel):
    upi_id: str = Field(..., description="Valid UPI VPA address (e.g. tester@okhdfcbank).")

    @field_validator("upi_id")
    @classmethod
    def check_upi(cls, v: str) -> str:
        return validate_upi_format(v)

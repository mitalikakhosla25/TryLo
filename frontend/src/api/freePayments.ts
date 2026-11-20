/**
 * TryLo 100% Free Payment & NPCI UPI API Module
 * Zero Gateway Fees | Zero MDR | Open NPCI Protocol
 */

import { apiClient } from './client';

export interface FreeGatewayInfoResponse {
  provider: string;
  cost_per_transaction: string;
  merchant_discount_rate: string;
  supported_methods: string[];
  npci_protocol: string;
  settlement_type: string;
  supported_banks_count: number;
}

export interface VpaValidationResponse {
  is_valid: boolean;
  vpa: string;
  username?: string | null;
  handle?: string | null;
  bank?: string | null;
  app?: string | null;
  category?: string | null;
  npci_verified: boolean;
  message: string;
}

export interface UpiIntentResponse {
  upi_uri: string;
  payee_vpa: string;
  payee_name: string;
  amount: number;
  currency: string;
  transaction_reference: string;
  note: string;
  generated_at: string;
  cost: string;
}

export interface VerifyUtrDepositResponse {
  success: boolean;
  message: string;
  campaign_id: string;
  total_funded: number;
  remaining_balance: number;
  status: string;
  utr_number: string;
  deposit_reference: string;
  receipt_certificate: {
    certificate_id: string;
    sha256_hash: string;
    timestamp: string;
    standard: string;
    verified: boolean;
  };
}

/**
 * Get 100% Free Payment Gateway specifications.
 */
export async function getFreeGatewayInfo(): Promise<FreeGatewayInfoResponse> {
  return apiClient<FreeGatewayInfoResponse>('/api/payments/free/info', {
    method: 'GET',
  });
}

/**
 * Validate a UPI ID (VPA) in real-time across 50+ Indian bank PSPs.
 */
export async function validateUpiVpa(vpa: string): Promise<VpaValidationResponse> {
  return apiClient<VpaValidationResponse>('/api/payments/free/validate-vpa', {
    method: 'POST',
    body: JSON.stringify({ vpa }),
  });
}

/**
 * Generate official NPCI UPI Deep Link and dynamic QR payload for escrow funding.
 */
export async function createUpiIntent(payload: {
  campaign_id: string;
  amount: number;
  note?: string;
}): Promise<UpiIntentResponse> {
  return apiClient<UpiIntentResponse>('/api/payments/free/create-upi-intent', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Verify 12-digit NPCI Bank UTR and lock funds into escrow vault (Zero MDR).
 */
export async function verifyUtrAndFund(payload: {
  campaign_id: string;
  utr_number: string;
  amount: number;
  payer_vpa?: string;
  transaction_reference?: string;
}): Promise<VerifyUtrDepositResponse> {
  return apiClient<VerifyUtrDepositResponse>('/api/payments/free/verify-utr-and-fund', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Free Developer Sandbox Deposit for instant testing.
 */
export async function simulateSandboxPayment(payload: {
  campaign_id: string;
  amount: number;
  simulated_method?: string;
  test_vpa_or_card?: string;
}): Promise<VerifyUtrDepositResponse> {
  return apiClient<VerifyUtrDepositResponse>('/api/payments/free/simulate-sandbox-payment', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

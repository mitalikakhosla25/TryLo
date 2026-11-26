import React, { useState } from 'react';
import {
  ShieldCheck,
  Coins,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Copy,
  Check,
  BarChart3,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  Receipt,
  Download,
  Smartphone,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  useCampaignEscrow,
  useFundCampaignEscrow,
  useDisbursePayout,
  useCampaignEscrowAnalytics,
} from '../../context/usePayouts';
import { useQueryClient } from '@tanstack/react-query';
import { useCampaignApplications } from '../../context/useApplications';
import { downloadCampaignPayoutsCsv, type PayoutResponse } from '../../api/payouts';
import {
  verifyUtrAndFund,
  simulateSandboxPayment,
} from '../../api/freePayments';
import { UpiQrCode } from '../ui/UpiQrCode';
import { DonutChart, BarVelocityChart } from '../ui/ChartWidgets';

interface EscrowVaultModalProps {
  campaignId: string;
  campaignTitle: string;
  campaignSlug?: string;
  rewardAmount?: number | null;
  onClose: () => void;
}

export const EscrowVaultModal: React.FC<EscrowVaultModalProps> = ({
  campaignId,
  campaignTitle,
  campaignSlug = 'campaign',
  rewardAmount = 0,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'actions' | 'analytics' | 'report'>('actions');

  const queryClient = useQueryClient();
  const { data: escrow, isLoading: isLoadingEscrow } = useCampaignEscrow(campaignId);
  const { data: analytics, isLoading: isLoadingAnalytics } = useCampaignEscrowAnalytics(campaignId);
  const { mutateAsync: _fundEscrow } = useFundCampaignEscrow(campaignId);
  const { mutateAsync: disburse, isPending: isDisbursing } = useDisbursePayout(campaignId);
  const { data: appData, isLoading: isLoadingApps } = useCampaignApplications(campaignId, { status: 'accepted' });

  // Deposit Form State
  const [depositAmount, setDepositAmount] = useState<number>(rewardAmount ? rewardAmount * 5 : 5000);
  const [depositMode, setDepositMode] = useState<'upi_direct' | 'sandbox'>('upi_direct');
  const [utrInput, setUtrInput] = useState<string>('');
  const [payerVpaInput, setPayerVpaInput] = useState<string>('');
  const [isVerifyingUtr, setIsVerifyingUtr] = useState<boolean>(false);
  const [receiptCert, setReceiptCert] = useState<{ certificate_id: string; sha256_hash: string } | null>(null);
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  // Dynamic NPCI UPI URI string
  const payeeVpa = 'trylo.escrow@okhdfcbank';
  const payeeName = 'TryLo Trust Escrow Vault';
  const sanitizedTitle = (campaignTitle || 'Campaign Escrow').replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 24);
  const upiIntentUri = `upi://pay?pa=${payeeVpa}&pn=${encodeURIComponent(payeeName)}&am=${depositAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(sanitizedTitle)}&mc=5411`;

  // Disbursal Form State
  const [selectedTesterId, setSelectedTesterId] = useState<string>('');
  const [payoutAmount, setPayoutAmount] = useState<number>(rewardAmount || 1000);
  const [milestoneType, setMilestoneType] = useState<string>('task_completion');
  const [customUpi, setCustomUpi] = useState<string>('');
  const [disbursalNote, setDisbursalNote] = useState<string>('');
  const [lastPayout, setLastPayout] = useState<PayoutResponse | null>(null);
  const [disburseError, setDisburseError] = useState<string | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<boolean>(false);
  const [isExportingCsv, setIsExportingCsv] = useState<boolean>(false);
  const [csvExportSuccess, setCsvExportSuccess] = useState<string | null>(null);

  const acceptedTesters = appData?.items || [];

  const handleVerifyUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError(null);
    setDepositSuccess(null);
    setReceiptCert(null);

    const cleanUtr = utrInput.trim();
    if (!cleanUtr || cleanUtr.length !== 12 || !/^\d+$/.test(cleanUtr)) {
      setDepositError('NPCI UTR must be exactly 12 numeric digits (from GPay / PhonePe / Paytm receipt).');
      return;
    }
    if (depositAmount <= 0) {
      setDepositError('Deposit amount must be greater than 0.');
      return;
    }

    try {
      setIsVerifyingUtr(true);
      const res = await verifyUtrAndFund({
        campaign_id: campaignId,
        utr_number: cleanUtr,
        amount: depositAmount,
        payer_vpa: payerVpaInput.trim() || undefined,
      });
      setDepositSuccess(res.message);
      setReceiptCert(res.receipt_certificate);
      setUtrInput('');
      // Invalidate escrow queries
      queryClient.invalidateQueries({ queryKey: ['campaign-escrow', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-escrow-analytics', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['founder-escrow-overview'] });
    } catch (err: unknown) {
      setDepositError(err instanceof Error ? err.message : 'Failed to verify UTR and fund escrow.');
    } finally {
      setIsVerifyingUtr(false);
    }
  };

  const handleSandboxDeposit = async () => {
    setDepositError(null);
    setDepositSuccess(null);
    setReceiptCert(null);

    if (depositAmount <= 0) {
      setDepositError('Deposit amount must be greater than 0.');
      return;
    }

    try {
      setIsVerifyingUtr(true);
      const res = await simulateSandboxPayment({
        campaign_id: campaignId,
        amount: depositAmount,
        simulated_method: 'UPI_SIMULATED',
        test_vpa_or_card: 'founder@okhdfcbank',
      });
      setDepositSuccess(res.message);
      setReceiptCert(res.receipt_certificate);
      queryClient.invalidateQueries({ queryKey: ['campaign-escrow', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-escrow-analytics', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['founder-escrow-overview'] });
    } catch (err: unknown) {
      setDepositError(err instanceof Error ? err.message : 'Sandbox deposit failed.');
    } finally {
      setIsVerifyingUtr(false);
    }
  };

  const handleDisburse = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisburseError(null);
    setLastPayout(null);

    if (!selectedTesterId) {
      setDisburseError('Please select an accepted tester.');
      return;
    }
    if (payoutAmount <= 0) {
      setDisburseError('Payout amount must be greater than 0.');
      return;
    }

    try {
      const res = await disburse({
        tester_id: selectedTesterId,
        amount: payoutAmount,
        upi_id: customUpi.trim() || undefined,
        milestone_type: milestoneType,
        notes: disbursalNote.trim() || undefined,
      });
      setLastPayout(res);
      setDisbursalNote('');
    } catch (err: unknown) {
      setDisburseError(err instanceof Error ? err.message : 'Disbursal failed. Check escrow balance.');
    }
  };

  const copyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(true);
    setTimeout(() => setCopiedUtr(false), 2000);
  };

  const handleDownloadCsv = async () => {
    try {
      setIsExportingCsv(true);
      setCsvExportSuccess(null);
      await downloadCampaignPayoutsCsv(campaignId, campaignSlug);
      setCsvExportSuccess('Financial CSV audit ledger downloaded successfully.');
      setTimeout(() => setCsvExportSuccess(null), 3500);
    } catch {
      setDisburseError('Failed to download CSV ledger.');
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Prepare chart data for Escrow Capital Allocation
  const escrowAllocationData = [
    {
      label: 'Disbursed to Testers',
      value: escrow?.disbursed_amount || 0,
      color: '#087C80',
    },
    {
      label: 'Liquid Balance in Vault',
      value: escrow?.remaining_balance || 0,
      color: '#10B981',
    },
  ];

  // Prepare chart data for Milestone Breakdown
  const milestoneData = [
    {
      label: 'Task Completions',
      value: analytics?.milestone_breakdown?.task_completion?.amount || 0,
      color: '#087C80',
    },
    {
      label: 'Bug Bounties',
      value: analytics?.milestone_breakdown?.bug_bounty?.amount || 0,
      color: '#EF4444',
    },
    {
      label: 'Campaign Rewards',
      value: analytics?.milestone_breakdown?.campaign_reward?.amount || 0,
      color: '#F59E0B',
    },
  ];

  // Prepare velocity chart data
  const velocityBarData =
    analytics?.daily_velocity && analytics.daily_velocity.length > 0
      ? analytics.daily_velocity.map((v) => ({
          label: v.date.slice(5), // MM-DD
          value: v.amount,
          sublabel: `${v.count} payouts`,
          color: '#087C80',
        }))
      : [
          { label: 'Today', value: escrow?.disbursed_amount || 0, sublabel: 'Disbursed', color: '#087C80' },
        ];

  return (
    <div className="fixed inset-0 z-50 bg-[#102A35]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#DCE7E3] shadow-2xl max-w-4xl w-full p-5 sm:p-7 space-y-6 my-6 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#DCE7E3] pb-4 shrink-0">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[11px] font-bold bg-[#E6F4F1] text-[#07545A]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>TryLo Trust Escrow & Payout Engine • Version 2</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#102A35]">
              Campaign Financial Management
            </h2>
            <p className="text-xs text-[#52656B] max-w-xl truncate">
              {campaignTitle}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadCsv}
              disabled={isExportingCsv}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F6F5ED] hover:bg-[#EFEFE5] text-[#102A35] border border-[#DCE7E3] transition-colors"
              title="Export Payouts CSV"
            >
              <Download className="h-3.5 w-3.5 text-[#087C80]" />
              <span>{isExportingCsv ? 'Exporting...' : 'Export CSV'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-[#52656B] hover:text-[#102A35] hover:bg-[#F6F5ED] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-b border-[#DCE7E3] pb-2 shrink-0">
          <button
            onClick={() => setActiveTab('actions')}
            className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'actions'
                ? 'bg-[#07545A] text-white shadow-xs'
                : 'text-[#52656B] hover:text-[#102A35] hover:bg-[#F6F5ED]'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            <span>Actions & Disbursal</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-[#07545A] text-white shadow-xs'
                : 'text-[#52656B] hover:text-[#102A35] hover:bg-[#F6F5ED]'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Financial Analytics & Charts</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'report'
                ? 'bg-[#07545A] text-white shadow-xs'
                : 'text-[#52656B] hover:text-[#102A35] hover:bg-[#F6F5ED]'
            }`}
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>Executive Audit Report</span>
          </button>
        </div>

        {csvExportSuccess && (
          <div className="p-3 rounded-xl bg-[#E6F4F1] border border-[#BCE1D8] text-[#07545A] text-xs flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{csvExportSuccess}</span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="overflow-y-auto space-y-6 flex-1 pr-1">
          {/* Top Escrow Balance Metrics (Visible across all tabs) */}
          {isLoadingEscrow ? (
            <div className="py-6 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#087C80]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-[#F6F5ED]/60 border border-[#DCE7E3] space-y-1">
                <span className="text-[11px] font-bold text-[#52656B]">Total Vault Funded</span>
                <p className="text-xl sm:text-2xl font-extrabold text-[#102A35]">
                  ₹{(escrow?.total_funded || 0).toLocaleString()}
                </p>
                <p className="text-[10px] text-[#52656B] capitalize">Status: {escrow?.status || 'unfunded'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#E6F4F1]/60 border border-[#BCE1D8] space-y-1">
                <span className="text-[11px] font-bold text-[#07545A]">Available Liquidity</span>
                <p className="text-xl sm:text-2xl font-extrabold text-[#07545A]">
                  ₹{(escrow?.remaining_balance || 0).toLocaleString()}
                </p>
                <p className="text-[10px] text-[#07545A]/80">Instant payout liquidity</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F6F5ED]/60 border border-[#DCE7E3] space-y-1">
                <span className="text-[11px] font-bold text-[#52656B]">Disbursed to Testers</span>
                <p className="text-xl sm:text-2xl font-extrabold text-[#102A35]">
                  ₹{(escrow?.disbursed_amount || 0).toLocaleString()}
                </p>
                <p className="text-[10px] text-[#52656B]">Verified milestones</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F6F5ED]/60 border border-[#DCE7E3] space-y-1">
                <span className="text-[11px] font-bold text-[#52656B]">Vault Burn Rate</span>
                <p className="text-xl sm:text-2xl font-extrabold text-[#087C80]">
                  {analytics?.burn_rate_pct ?? (escrow?.total_funded ? Math.round(((escrow.disbursed_amount) / escrow.total_funded) * 100) : 0)}%
                </p>
                <p className="text-[10px] text-[#52656B]">Capital utilization</p>
              </div>
            </div>
          )}

          {/* TAB 1: ACTIONS & DISBURSAL */}
          {activeTab === 'actions' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Section 1: Fund Escrow (100% Free UPI & Developer Sandbox) */}
              <div className="bg-[#FAFAFA] rounded-2xl p-5 border border-[#DCE7E3] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm font-bold text-[#102A35]">
                    <Coins className="h-4 w-4 text-[#087C80]" />
                    <span>Deposit / Top-up Escrow Vault</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    100% Free • 0% MDR
                  </span>
                </div>
                <p className="text-xs text-[#52656B]">
                  Lock bounty funds into TryLo trust escrow via direct NPCI UPI protocol. Zero payment gateway fees, zero transaction commission.
                </p>

                {depositSuccess && (
                  <div className="p-3 rounded-xl bg-[#E6F4F1] border border-[#BCE1D8] text-[#07545A] text-xs space-y-1">
                    <div className="flex items-center space-x-2 font-bold">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>{depositSuccess}</span>
                    </div>
                    {receiptCert && (
                      <p className="text-[10px] font-mono opacity-80 pl-6 truncate">
                        Audit Cert: {receiptCert.certificate_id}
                      </p>
                    )}
                  </div>
                )}
                {depositError && (
                  <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C] text-xs flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{depositError}</span>
                  </div>
                )}

                {/* Payment Mode Selector */}
                <div className="grid grid-cols-2 gap-2 bg-[#F6F5ED] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setDepositMode('upi_direct')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                      depositMode === 'upi_direct'
                        ? 'bg-white text-[#07545A] shadow-xs'
                        : 'text-[#52656B] hover:text-[#102A35]'
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>Direct NPCI UPI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositMode('sandbox')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                      depositMode === 'sandbox'
                        ? 'bg-white text-[#07545A] shadow-xs'
                        : 'text-[#52656B] hover:text-[#102A35]'
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Free Sandbox</span>
                  </button>
                </div>

                {/* Amount Input & Preset Chips */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-[#102A35]">
                    Deposit Amount (₹ INR)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-[#52656B]">₹</span>
                    <input
                      type="number"
                      min="100"
                      step="100"
                      value={depositAmount || ''}
                      onChange={(e) => setDepositAmount(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-[#DCE7E3] rounded-xl text-xs text-[#102A35] focus:outline-none focus:ring-2 focus:ring-[#087C80]/30"
                      placeholder="Enter amount"
                      required
                    />
                  </div>

                  {/* Preset Chips */}
                  <div className="flex gap-2">
                    {[1000, 5000, 10000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDepositAmount(amt)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white border border-[#DCE7E3] hover:border-[#087C80] text-[#102A35] transition-colors cursor-pointer"
                      >
                        +₹{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* MODE 1: DIRECT NPCI UPI QR & INTENT */}
                {depositMode === 'upi_direct' && (
                  <div className="space-y-4 pt-2 border-t border-[#DCE7E3]/60">
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-2xl border border-[#DCE7E3]">
                      <UpiQrCode value={upiIntentUri} size={130} />
                      <div className="space-y-2 text-center sm:text-left flex-1">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-[#52656B] uppercase tracking-wider">
                            Scan with Any UPI App
                          </span>
                          <p className="text-xs font-bold text-[#102A35]">
                            GPay, PhonePe, Paytm, BHIM, Cred
                          </p>
                          <p className="text-[11px] font-mono text-[#07545A]">
                            {payeeVpa}
                          </p>
                        </div>

                        <a
                          href={upiIntentUri}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Pay ₹{depositAmount.toLocaleString()} in UPI App</span>
                        </a>
                      </div>
                    </div>

                    {/* Step 2: Confirm 12-Digit UTR */}
                    <form onSubmit={handleVerifyUtr} className="space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-[#102A35] mb-1">
                          Confirm NPCI 12-Digit Bank UTR Number
                        </label>
                        <input
                          type="text"
                          maxLength={12}
                          value={utrInput}
                          onChange={(e) => setUtrInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 428134587851 (from payment receipt)"
                          className="w-full px-3 py-2 bg-white border border-[#DCE7E3] rounded-xl text-xs font-mono text-[#102A35] focus:outline-none focus:ring-2 focus:ring-[#087C80]/30"
                          required
                        />
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={payerVpaInput}
                          onChange={(e) => setPayerVpaInput(e.target.value)}
                          placeholder="Your UPI ID (optional, e.g. name@okhdfcbank)"
                          className="flex-1 px-3 py-1.5 bg-white border border-[#DCE7E3] rounded-xl text-xs text-[#102A35] focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={isVerifyingUtr || utrInput.length !== 12}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#07545A] hover:bg-[#087C80] disabled:opacity-50 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-sm shrink-0"
                        >
                          {isVerifyingUtr ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          <span>Verify & Credit Vault</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* MODE 2: FREE DEVELOPER SANDBOX */}
                {depositMode === 'sandbox' && (
                  <div className="space-y-3 pt-2 border-t border-[#DCE7E3]/60">
                    <div className="p-3 rounded-xl bg-[#E6F4F1] border border-[#BCE1D8] space-y-1 text-xs text-[#07545A]">
                      <p className="font-bold flex items-center space-x-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Developer Test Sandbox (Zero Cost)</span>
                      </p>
                      <p className="text-[11px] opacity-80">
                        Simulates instant NPCI settlement, generates an attested 12-digit UTR, and credits the campaign vault immediately for testing.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSandboxDeposit}
                      disabled={isVerifyingUtr || depositAmount <= 0}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#07545A] hover:bg-[#087C80] transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
                    >
                      {isVerifyingUtr ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Coins className="h-4 w-4" />
                      )}
                      <span>1-Click Deposit ₹{(depositAmount || 0).toLocaleString()} (Sandbox)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Section 2: Disburse Payout */}
              <div className="bg-[#FAFAFA] rounded-2xl p-5 border border-[#DCE7E3] space-y-4">
                <div className="flex items-center space-x-2 text-sm font-bold text-[#102A35]">
                  <Send className="h-4 w-4 text-[#087C80]" />
                  <span>Instant UPI Disbursal to Tester</span>
                </div>
                <p className="text-xs text-[#52656B]">
                  Reward accepted testers instantly via NPCI simulated UPI rails for verified task proofs or bug finds.
                </p>

                {disburseError && (
                  <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C] text-xs flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{disburseError}</span>
                  </div>
                )}

                {lastPayout && (
                  <div className="p-3.5 rounded-xl bg-[#E6F4F1] border border-[#BCE1D8] space-y-1.5 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-[#07545A]">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>UPI Disbursal Successful!</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#07545A] bg-white px-2 py-0.5 rounded-full border border-[#BCE1D8]">
                        ₹{lastPayout.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#102A35] space-y-0.5">
                      <p><span className="text-[#52656B]">To VPA:</span> {lastPayout.upi_id}</p>
                      <p className="flex items-center space-x-1.5">
                        <span className="text-[#52656B]">NPCI UTR:</span>
                        <span className="font-mono font-bold">{lastPayout.utr_number}</span>
                        <button
                          type="button"
                          onClick={() => copyUtr(lastPayout.utr_number)}
                          className="p-1 hover:bg-[#BCE1D8] rounded transition-colors text-[#07545A]"
                          title="Copy UTR"
                        >
                          {copiedUtr ? <Check className="h-3 w-3 text-green-700" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </p>
                      <p className="text-[10px] text-[#52656B]">Ref: {lastPayout.reference_id}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleDisburse} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#102A35] mb-1">
                      Select Accepted Tester
                    </label>
                    {isLoadingApps ? (
                      <div className="p-2 text-xs text-[#52656B]">Loading accepted testers...</div>
                    ) : acceptedTesters.length === 0 ? (
                      <p className="text-[11px] text-[#9A4200] bg-[#FEF3C7] p-2 rounded-xl">
                        No accepted testers on this campaign yet. Accept applicants first.
                      </p>
                    ) : (
                      <select
                        value={selectedTesterId}
                        onChange={(e) => setSelectedTesterId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#DCE7E3] rounded-xl text-xs text-[#102A35] focus:outline-none focus:ring-2 focus:ring-[#087C80]/30"
                        required
                      >
                        <option value="">-- Choose Accepted Tester --</option>
                        {acceptedTesters.map((item) => (
                          <option key={item.id} value={item.tester_id}>
                            {item.tester?.full_name || 'Tester'} ({item.tester_id.slice(0, 8)})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-[#102A35] mb-1">
                        Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="10"
                        step="50"
                        value={payoutAmount || ''}
                        onChange={(e) => setPayoutAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-[#DCE7E3] rounded-xl text-xs text-[#102A35] focus:outline-none focus:ring-2 focus:ring-[#087C80]/30"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#102A35] mb-1">
                        Milestone Reason
                      </label>
                      <select
                        value={milestoneType}
                        onChange={(e) => setMilestoneType(e.target.value)}
                        className="w-full px-2 py-2 bg-white border border-[#DCE7E3] rounded-xl text-xs text-[#102A35] focus:outline-none focus:ring-2 focus:ring-[#087C80]/30"
                      >
                        <option value="task_completion">Task Completion</option>
                        <option value="bug_bounty">Critical/High Bug Bounty</option>
                        <option value="campaign_reward">Campaign Full Completion</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#102A35] mb-1">
                      Recipient UPI ID (Optional Override)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. karan@okhdfcbank (or defaults to profile)"
                      value={customUpi}
                      onChange={(e) => setCustomUpi(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#DCE7E3] rounded-xl text-xs text-[#102A35] focus:outline-none focus:ring-2 focus:ring-[#087C80]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#102A35] mb-1">
                      Internal Note / Reference
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Approved UI checkout bug report"
                      value={disbursalNote}
                      onChange={(e) => setDisbursalNote(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#DCE7E3] rounded-xl text-xs text-[#102A35] focus:outline-none focus:ring-2 focus:ring-[#087C80]/30"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={
                      isDisbursing ||
                      !selectedTesterId ||
                      payoutAmount <= 0 ||
                      (escrow?.remaining_balance || 0) < payoutAmount
                    }
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#087C80] hover:bg-[#07545A] transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
                  >
                    {isDisbursing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span>Disburse ₹{(payoutAmount || 0).toLocaleString()} via UPI</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: FINANCIAL ANALYTICS & CHARTS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-in fade-in">
              {isLoadingAnalytics ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-[#087C80]" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Donut Chart 1: Capital Allocation */}
                    <div className="bg-[#FAFAFA] rounded-2xl p-5 border border-[#DCE7E3] space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-[#102A35]">
                          Escrow Capital Allocation
                        </h3>
                        <p className="text-xs text-[#52656B]">
                          Disbursed bounties versus current liquid reserves.
                        </p>
                      </div>

                      <DonutChart
                        data={escrowAllocationData}
                        centerLabel="Funded"
                        centerValue={`₹${(escrow?.total_funded || 0).toLocaleString()}`}
                      />
                    </div>

                    {/* Donut Chart 2: Milestone Breakdown */}
                    <div className="bg-[#FAFAFA] rounded-2xl p-5 border border-[#DCE7E3] space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-[#102A35]">
                          Payouts by Milestone Type
                        </h3>
                        <p className="text-xs text-[#52656B]">
                          Categorical disbursement distribution across tester milestones.
                        </p>
                      </div>

                      <DonutChart
                        data={milestoneData}
                        centerLabel="Disbursed"
                        centerValue={`₹${(analytics?.disbursed_amount || escrow?.disbursed_amount || 0).toLocaleString()}`}
                      />
                    </div>
                  </div>

                  {/* Velocity Bar Chart */}
                  <div className="bg-[#FAFAFA] rounded-2xl p-5 border border-[#DCE7E3] space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-[#102A35]">
                          Disbursement Velocity Timeline
                        </h3>
                        <p className="text-xs text-[#52656B]">
                          Daily capital outflow to verified beta testers.
                        </p>
                      </div>
                      <div className="text-xs font-bold text-[#07545A] bg-[#E6F4F1] px-3 py-1 rounded-full border border-[#BCE1D8]">
                        Total Disbursed: ₹{(analytics?.disbursed_amount || escrow?.disbursed_amount || 0).toLocaleString()}
                      </div>
                    </div>

                    <BarVelocityChart data={velocityBarData} valuePrefix="₹" height={160} />
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: EXECUTIVE AUDIT REPORT */}
          {activeTab === 'report' && (
            <div className="space-y-5 animate-in fade-in" id="printable-escrow-audit-report">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3]">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-[#102A35]">Executive Settlement Audit Report</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F4F1] text-[#07545A] border border-[#BCE1D8]">
                      NPCI Simulated Rails
                    </span>
                  </div>
                  <p className="text-xs text-[#52656B]">
                    Formal audit record of all escrow locks and instantaneous UPI disbursements.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDownloadCsv}
                    disabled={isExportingCsv}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#07545A] hover:bg-[#087C80] text-white transition-all shadow-xs"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    <span>{isExportingCsv ? 'Exporting...' : 'Export CSV'}</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-[#EFEFE5] text-[#102A35] border border-[#DCE7E3] transition-colors"
                  >
                    <Printer className="h-3.5 w-3.5 text-[#52656B]" />
                    <span>Print PDF</span>
                  </button>
                </div>
              </div>

              {/* Transactions Ledger Table */}
              <div className="border border-[#DCE7E3] rounded-2xl overflow-hidden bg-white shadow-xs">
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#F6F5ED] text-[#52656B] font-bold border-b border-[#DCE7E3] sticky top-0">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Recipient VPA</th>
                        <th className="py-2.5 px-3">Milestone</th>
                        <th className="py-2.5 px-3">Simulated UTR</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE7E3]">
                      {!analytics?.payouts || analytics.payouts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-[#52656B]">
                            No disbursements recorded for this campaign yet.
                          </td>
                        </tr>
                      ) : (
                        analytics.payouts.map((p) => (
                          <tr key={p.id} className="hover:bg-[#F6F5ED]/40 transition-colors">
                            <td className="py-2.5 px-3 text-[#52656B] whitespace-nowrap">
                              {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-[#102A35]">
                              {p.upi_id}
                            </td>
                            <td className="py-2.5 px-3 text-[#52656B] capitalize">
                              {p.milestone_type.replace('_', ' ')}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-[#07545A]">
                              {p.utr_number}
                            </td>
                            <td className="py-2.5 px-3 text-right font-extrabold text-[#102A35]">
                              ₹{p.amount.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F4F1] text-[#07545A] border border-[#BCE1D8]">
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 flex items-center justify-between border-t border-[#DCE7E3] shrink-0 text-xs text-[#52656B]">
          <div className="flex items-center space-x-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-[#087C80]" />
            <span>TryLo High-Trust Escrow Vault Engine</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-semibold bg-[#F6F5ED] hover:bg-[#EBE9DF] text-[#102A35] transition-colors cursor-pointer"
          >
            Close Vault
          </button>
        </div>
      </div>
    </div>
  );
};

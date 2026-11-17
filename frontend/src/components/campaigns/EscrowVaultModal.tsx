import React, { useState } from 'react';
import {
  ShieldCheck,
  Coins,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  CreditCard,
  Copy,
  Check,
} from 'lucide-react';
import {
  useCampaignEscrow,
  useFundCampaignEscrow,
  useDisbursePayout,
} from '../../context/usePayouts';
import { useCampaignApplications } from '../../context/useApplications';
import type { PayoutResponse } from '../../api/payouts';

interface EscrowVaultModalProps {
  campaignId: string;
  campaignTitle: string;
  rewardAmount?: number | null;
  onClose: () => void;
}

export const EscrowVaultModal: React.FC<EscrowVaultModalProps> = ({
  campaignId,
  campaignTitle,
  rewardAmount = 0,
  onClose,
}) => {
  const { data: escrow, isLoading: isLoadingEscrow } = useCampaignEscrow(campaignId);
  const { mutateAsync: fundEscrow, isPending: isFunding } = useFundCampaignEscrow(campaignId);
  const { mutateAsync: disburse, isPending: isDisbursing } = useDisbursePayout(campaignId);
  const { data: appData, isLoading: isLoadingApps } = useCampaignApplications(campaignId, { status: 'accepted' });

  // Deposit Form State
  const [depositAmount, setDepositAmount] = useState<number>(rewardAmount ? rewardAmount * 5 : 5000);
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  // Disbursal Form State
  const [selectedTesterId, setSelectedTesterId] = useState<string>('');
  const [payoutAmount, setPayoutAmount] = useState<number>(rewardAmount || 1000);
  const [milestoneType, setMilestoneType] = useState<string>('task_completion');
  const [customUpi, setCustomUpi] = useState<string>('');
  const [disbursalNote, setDisbursalNote] = useState<string>('');
  const [lastPayout, setLastPayout] = useState<PayoutResponse | null>(null);
  const [disburseError, setDisburseError] = useState<string | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<boolean>(false);

  const acceptedTesters = appData?.items || [];

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError(null);
    setDepositSuccess(null);

    if (depositAmount <= 0) {
      setDepositError('Deposit amount must be greater than 0.');
      return;
    }

    try {
      const updated = await fundEscrow({
        amount: depositAmount,
        payment_method: 'simulated_upi',
      });
      setDepositSuccess(`₹${depositAmount.toLocaleString()} locked into escrow! Ref: ${updated.deposit_reference || 'N/A'}`);
      setDepositAmount(0);
    } catch (err: unknown) {
      setDepositError(err instanceof Error ? err.message : 'Failed to deposit into escrow.');
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

  return (
    <div className="fixed inset-0 z-50 bg-[#102A35]/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-[#DCE7E3] shadow-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 my-8 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#DCE7E3] pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[11px] font-bold bg-[#E6F4F1] text-[#07545A]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>TryLo Trust Escrow Vault</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#102A35]">
              Campaign Escrow & UPI Disbursal
            </h2>
            <p className="text-xs text-[#52656B] max-w-xl truncate">
              {campaignTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#52656B] hover:text-[#102A35] hover:bg-[#F6F5ED] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Escrow Balance Metrics */}
        {isLoadingEscrow ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#087C80]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-[#F6F5ED]/60 border border-[#DCE7E3] space-y-1">
              <span className="text-[11px] font-bold text-[#52656B]">Total Vault Funded</span>
              <p className="text-xl sm:text-2xl font-extrabold text-[#102A35]">
                ₹{(escrow?.total_funded || 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-[#52656B] capitalize">Status: {escrow?.status || 'unfunded'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#E6F4F1]/60 border border-[#BCE1D8] space-y-1">
              <span className="text-[11px] font-bold text-[#07545A]">Available to Disburse</span>
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
          </div>
        )}

        {/* Tabbed Content Sections: Deposit & Disburse */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Section 1: Fund Escrow */}
          <div className="bg-[#FAFAFA] rounded-2xl p-5 border border-[#DCE7E3] space-y-4">
            <div className="flex items-center space-x-2 text-sm font-bold text-[#102A35]">
              <Coins className="h-4 w-4 text-[#087C80]" />
              <span>Deposit / Top-up Escrow Vault</span>
            </div>
            <p className="text-xs text-[#52656B]">
              Lock bounty funds into TryLo trust escrow. Funds are reserved exclusively for accepted testers.
            </p>

            {depositSuccess && (
              <div className="p-3 rounded-xl bg-[#E6F4F1] border border-[#BCE1D8] text-[#07545A] text-xs flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{depositSuccess}</span>
              </div>
            )}
            {depositError && (
              <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C] text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{depositError}</span>
              </div>
            )}

            <form onSubmit={handleFund} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#102A35] mb-1">
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
              </div>

              {/* Quick Preset Chips */}
              <div className="flex gap-2">
                {[1000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white border border-[#DCE7E3] hover:border-[#087C80] text-[#102A35] transition-colors"
                  >
                    +₹{amt.toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-[#DCE7E3] flex items-center space-x-2 text-[11px] text-[#52656B]">
                <CreditCard className="h-3.5 w-3.5 text-[#087C80]" />
                <span>Simulated Mode: Sandbox Netbanking / UPI</span>
              </div>

              <button
                type="submit"
                disabled={isFunding || depositAmount <= 0}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#07545A] hover:bg-[#087C80] transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
              >
                {isFunding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coins className="h-4 w-4" />}
                <span>Lock ₹{(depositAmount || 0).toLocaleString()} in Escrow</span>
              </button>
            </form>
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

        {/* Footer */}
        <div className="pt-2 flex justify-end border-t border-[#DCE7E3]">
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

import React, { useState } from 'react';
import {
  Coins,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Loader2,
  X,
  Edit2,
} from 'lucide-react';
import { useTesterEarnings, useUpdateTesterUpi } from '../../context/usePayouts';

interface TesterEarningsModalProps {
  onClose: () => void;
}

export const TesterEarningsModal: React.FC<TesterEarningsModalProps> = ({ onClose }) => {
  const { data: earnings, isLoading } = useTesterEarnings();
  const { mutateAsync: updateUpi, isPending: isUpdatingUpi } = useUpdateTesterUpi();

  const [isEditingUpi, setIsEditingUpi] = useState<boolean>(false);
  const [newUpi, setNewUpi] = useState<string>('');
  const [upiSuccess, setUpiSuccess] = useState<string | null>(null);
  const [upiError, setUpiError] = useState<string | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  const handleUpdateUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpiError(null);
    setUpiSuccess(null);

    const trimmed = newUpi.trim().toLowerCase();
    if (!trimmed.includes('@') || trimmed.length < 5) {
      setUpiError('Invalid UPI ID. Format must be username@bank (e.g. user@okhdfcbank).');
      return;
    }

    try {
      await updateUpi({ upi_id: trimmed });
      setUpiSuccess('Primary UPI ID updated successfully!');
      setIsEditingUpi(false);
      setNewUpi('');
    } catch (err: unknown) {
      setUpiError(err instanceof Error ? err.message : 'Failed to update UPI ID.');
    }
  };

  const copyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#102A35]/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-[#DCE7E3] shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 my-8 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#DCE7E3] pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#E6F4F1] text-[#07545A]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verified NPCI UPI Rails</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#102A35]">
              Tester Earnings & Payout Vault
            </h2>
            <p className="text-xs text-[#52656B]">
              Real-time ledger of rewards disbursed to your verified UPI ID for completed testing milestones.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#52656B] hover:text-[#102A35] hover:bg-[#F6F5ED] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Lifetime Earnings & UPI Badge */}
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#087C80]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Balance Card */}
            <div className="p-5 rounded-2xl bg-[#E6F4F1] border border-[#BCE1D8] space-y-2">
              <span className="text-xs font-bold text-[#07545A] uppercase tracking-wider">
                Lifetime Disbursed Rewards
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#07545A]">
                  ₹{(earnings?.lifetime_earnings || 0).toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-[#087C80]">INR</span>
              </div>
              <p className="text-[11px] text-[#07545A]/80">
                {earnings?.completed_payouts_count || 0} successfully settled transactions
              </p>
            </div>

            {/* UPI VPA Card */}
            <div className="p-5 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#52656B] uppercase tracking-wider">
                  Primary Payout UPI
                </span>
                {!isEditingUpi && (
                  <button
                    onClick={() => {
                      setNewUpi(earnings?.saved_upi_id || '');
                      setIsEditingUpi(true);
                    }}
                    className="inline-flex items-center space-x-1 text-[11px] font-bold text-[#087C80] hover:text-[#07545A]"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Change</span>
                  </button>
                )}
              </div>

              {!isEditingUpi ? (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-[#102A35] font-mono">
                    {earnings?.saved_upi_id || 'tester@okhdfcbank'}
                  </p>
                  <p className="text-[11px] text-[#52656B]">
                    Instant payouts auto-route to this VPA upon approval.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleUpdateUpi} className="space-y-2">
                  <input
                    type="text"
                    value={newUpi}
                    onChange={(e) => setNewUpi(e.target.value)}
                    placeholder="e.g. yourname@okhdfcbank"
                    className="w-full px-3 py-1.5 bg-white border border-[#DCE7E3] rounded-xl text-xs text-[#102A35] focus:outline-none focus:ring-2 focus:ring-[#087C80]/30 font-mono"
                    required
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isUpdatingUpi}
                      className="px-3 py-1 rounded-lg text-[11px] font-bold bg-[#07545A] text-white hover:bg-[#087C80] transition-colors"
                    >
                      {isUpdatingUpi ? 'Saving...' : 'Save UPI'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingUpi(false)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-[#DCE7E3] text-[#52656B]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {upiSuccess && (
          <div className="p-3 rounded-xl bg-[#E6F4F1] border border-[#BCE1D8] text-[#07545A] text-xs flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{upiSuccess}</span>
          </div>
        )}
        {upiError && (
          <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C] text-xs flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{upiError}</span>
          </div>
        )}

        {/* Payout History Ledger */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#102A35]">
              Disbursal Ledger & NPCI Receipts
            </h3>
            <span className="text-[11px] text-[#52656B]">
              {earnings?.payouts.length || 0} Transactions
            </span>
          </div>

          {!earnings || earnings.payouts.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-[#F6F5ED]/60 border border-[#DCE7E3] space-y-2">
              <Coins className="h-8 w-8 text-[#52656B]/60 mx-auto" />
              <p className="text-xs font-semibold text-[#102A35]">No Payouts Yet</p>
              <p className="text-[11px] text-[#52656B]">
                Complete test tasks or report high-severity bugs to receive instant UPI rewards.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#DCE7E3] border border-[#DCE7E3] rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
              {earnings.payouts.map((p) => (
                <div key={p.id} className="p-3.5 bg-white hover:bg-[#F6F5ED]/40 transition-colors flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-[#102A35]">
                        {p.campaign_title || 'Beta Campaign'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E6F4F1] text-[#07545A] capitalize">
                        {p.milestone_type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] text-[#52656B]">
                      <span>{new Date(p.disbursed_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="font-mono">UTR: {p.utr_number}</span>
                      <button
                        onClick={() => copyUtr(p.utr_number)}
                        className="text-[#087C80] hover:text-[#07545A] p-0.5"
                        title="Copy UTR Number"
                      >
                        {copiedUtr === p.utr_number ? (
                          <Check className="h-3 w-3 text-green-700" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-extrabold text-[#07545A] text-sm">
                      +₹{p.amount.toLocaleString()}
                    </p>
                    <span className="inline-flex items-center space-x-1 text-[10px] text-green-700 font-bold">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Settled</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end border-t border-[#DCE7E3]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-semibold bg-[#F6F5ED] hover:bg-[#EBE9DF] text-[#102A35] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

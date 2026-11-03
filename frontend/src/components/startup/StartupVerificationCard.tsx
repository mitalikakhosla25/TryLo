import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Building2,
  FileCheck,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Eye,
  Download,
  X,
} from 'lucide-react';
import {
  getStartupVerification,
  submitStartupVerification,
  reviewStartupVerification,
  REGISTRATION_TYPES,
  type StartupVerification,
} from '../../api/verification';
import { StartupVerificationBadge } from '../ui/VerificationBadge';

interface StartupVerificationCardProps {
  startupId: string;
  startupName?: string;
  onVerificationUpdated?: (verification: StartupVerification) => void;
}

export const StartupVerificationCard: React.FC<StartupVerificationCardProps> = ({
  startupId,
  startupName: _startupName,
  onVerificationUpdated,
}) => {
  const [verification, setVerification] = useState<StartupVerification | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

  // Form fields
  const [legalName, setLegalName] = useState<string>('');
  const [regType, setRegType] = useState<string>(REGISTRATION_TYPES[0]);
  const [regNumber, setRegNumber] = useState<string>('');
  const [taxId, setTaxId] = useState<string>('');
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [corporateEmail, setCorporateEmail] = useState<string>('');

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const data = await getStartupVerification(startupId);
      setVerification(data);
      setLegalName(data.legal_entity_name || '');
      setRegType(data.registration_type || REGISTRATION_TYPES[0]);
      setRegNumber(data.registration_number || '');
      setTaxId(data.tax_identifier || '');
      setDocumentUrl(data.document_url || '');
      setCorporateEmail(data.corporate_email || '');
      if (onVerificationUpdated) onVerificationUpdated(data);
    } catch {
      // 404 indicates not yet submitted
      setVerification(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (startupId) {
      fetchStatus();
    }
  }, [startupId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!legalName.trim() || legalName.trim().length < 2) {
      setErrorMsg('Legal Entity Name must be at least 2 characters.');
      return;
    }
    if (!regNumber.trim() || regNumber.trim().length < 2) {
      setErrorMsg('Registration Number (CIN, GSTIN, EIN) is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await submitStartupVerification(startupId, {
        legal_entity_name: legalName.trim(),
        registration_type: regType,
        registration_number: regNumber.trim(),
        tax_identifier: taxId.trim() || undefined,
        document_url: documentUrl.trim() || undefined,
        corporate_email: corporateEmail.trim() || undefined,
      });
      setVerification(updated);
      setShowForm(false);
      setSuccessMsg('Business registration proof submitted for review!');
      if (onVerificationUpdated) onVerificationUpdated(updated);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit verification proof.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateApproval = async () => {
    if (!verification) return;
    setIsSubmitting(true);
    try {
      const reviewed = await reviewStartupVerification(startupId, {
        verification_status: 'verified',
      });
      setVerification(reviewed);
      setSuccessMsg('Startup business identity verified successfully!');
      if (onVerificationUpdated) onVerificationUpdated(reviewed);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification update failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#DCE7E3] p-6 sm:p-8 space-y-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE7E3]">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-2xl bg-[#D7EFEB] text-[#07545A] flex items-center justify-center">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#102A35]">Business Legitimacy & Anti-Shell Verification</h3>
              <StartupVerificationBadge
                status={verification?.verification_status || 'unverified'}
                isVerified={verification?.verification_status === 'verified'}
              />
            </div>
            <p className="text-xs text-[#52656B] mt-0.5">
              Verified businesses display the TryLo trust badge to protect testers from fraudulent campaigns.
            </p>
          </div>
        </div>

        {verification?.verification_status !== 'verified' && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold bg-[#087C80] hover:bg-[#07545A] text-white transition-colors"
          >
            {verification ? 'Update Proof Documents' : 'Submit Business Proof'}
          </button>
        )}
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-[#E6F7F0] border border-[#B6EDD5] flex items-center gap-2 text-xs text-[#0E7C57] font-medium animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-[#FEE2E2] border border-[#FECACA] flex items-center gap-2 text-xs text-[#B91C1C] font-medium animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Verification State Banner */}
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 text-[#087C80] animate-spin" />
        </div>
      ) : verification?.verification_status === 'verified' ? (
        <div className="p-5 rounded-2xl bg-[#E6F7F0]/60 border border-[#B6EDD5] space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0E7C57]">
              <ShieldCheck className="h-4 w-4" />
              <span>Verified Entity: {verification.legal_entity_name}</span>
            </div>
            <span className="text-[11px] text-[#52656B]">
              Verified on {new Date(verification.verified_at || verification.updated_at).toLocaleDateString()}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="bg-white/80 p-2.5 rounded-xl border border-[#B6EDD5]/50">
              <span className="text-[#7E939B] block text-[10px] uppercase font-bold tracking-wider">Registration</span>
              <span className="font-semibold text-[#102A35]">{verification.registration_type}</span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-[#B6EDD5]/50">
              <span className="text-[#7E939B] block text-[10px] uppercase font-bold tracking-wider">Number (CIN/EIN)</span>
              <span className="font-semibold text-[#102A35] font-mono">{verification.registration_number}</span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-[#B6EDD5]/50">
              <span className="text-[#7E939B] block text-[10px] uppercase font-bold tracking-wider">Corporate Domain</span>
              <span className="font-semibold text-[#102A35]">{verification.corporate_email || 'Verified'}</span>
            </div>
          </div>
          {verification.document_url && (
            <div className="pt-2 p-3.5 bg-white rounded-2xl border border-[#B6EDD5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#E6F7F0] text-[#0E7C57] flex items-center justify-center shrink-0">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-bold text-[#102A35] block text-xs">
                    Original Certificate of Incorporation (Form INC-11)
                  </span>
                  <span className="text-[11px] text-[#52656B] font-mono block">
                    {verification.document_url.split('/').pop()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setPreviewDocUrl(verification.document_url || null)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#07545A] hover:bg-[#087C80] text-white transition-colors shadow-2xs cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>View Original</span>
                </button>
                <a
                  href={verification.document_url}
                  download
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#F6F5ED] hover:bg-stone-200 text-[#102A35] border border-[#DCE7E3] transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          )}
        </div>
      ) : verification?.verification_status === 'pending' ? (
        <div className="p-5 rounded-2xl bg-[#FEF3C7]/60 border border-[#FDE68A] space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#9A4200]">
              <Clock className="h-4 w-4" />
              <span>Pending Compliance Review for {verification.legal_entity_name}</span>
            </div>
          </div>
          <p className="text-xs text-[#9A4200]">
            Your business credentials and registration documents (Reg #{verification.registration_number}) are submitted.
            Our team verifies documentation against ministry records to prevent shell entities.
          </p>

          {verification.document_url && (
            <div className="p-3 bg-white rounded-xl border border-[#FDE68A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <FileCheck className="h-4 w-4 text-[#9A4200]" />
                <span className="font-mono text-[11px] text-[#102A35]">
                  {verification.document_url.split('/').pop()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewDocUrl(verification.document_url || null)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#07545A] text-white hover:bg-[#087C80] transition-colors cursor-pointer"
                >
                  <Eye className="h-3 w-3" />
                  <span>View Original</span>
                </button>
                <a
                  href={verification.document_url}
                  download
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F6F5ED] hover:bg-stone-200 text-[#102A35] border border-[#DCE7E3] transition-colors"
                >
                  <Download className="h-3 w-3" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          )}
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleSimulateApproval}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0E7C57] text-white hover:bg-[#07545A] transition-colors"
            >
              {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
              <span>Simulate Admin Approval (Dev Mode)</span>
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="text-xs font-semibold text-[#9A4200] hover:underline"
            >
              Edit Details
            </button>
          </div>
        </div>
      ) : verification?.verification_status === 'rejected' ? (
        <div className="p-5 rounded-2xl bg-[#FEE2E2]/60 border border-[#FECACA] space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#B91C1C]">
            <ShieldAlert className="h-4 w-4" />
            <span>Verification Rejected</span>
          </div>
          <p className="text-xs text-[#B91C1C]">
            Reason: {verification.rejection_reason || 'The provided registration document could not be verified.'}
          </p>
          <p className="text-[11px] text-[#52656B]">
            Campaign publishing is suspended for unverified or rejected entities. Please submit updated valid legal documentation.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#B91C1C] text-white hover:bg-[#991B1B]"
          >
            Resubmit Business Proof
          </button>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-[#EFEFE5]/60 border border-[#DCE7E3] space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#52656B]">
            <HelpCircle className="h-4 w-4 text-[#087C80]" />
            <span>No business verification proof submitted yet</span>
          </div>
          <p className="text-xs text-[#52656B]">
            To build trust with top-tier testers and comply with platform security standards, provide your company registration number (CIN/GSTIN/EIN) and incorporation proof.
          </p>
        </div>
      )}

      {/* Submission Form Modal/Panel */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-[#FDFCFA] border border-[#DCE7E3] space-y-4">
          <h4 className="text-sm font-bold text-[#102A35]">Submit Business Registration Proof</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#102A35] mb-1">
                Legal Registered Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="e.g. Acme Technologies Private Limited"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCE7E3] bg-white focus:outline-none focus:border-[#087C80]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#102A35] mb-1">
                Business Structure / Entity Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={regType}
                onChange={(e) => setRegType(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCE7E3] bg-white focus:outline-none focus:border-[#087C80]"
              >
                {REGISTRATION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#102A35] mb-1">
                Government Registration Number (CIN / GSTIN / EIN) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                placeholder="e.g. U72200KA2024PTC123456"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCE7E3] bg-white focus:outline-none focus:border-[#087C80] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#102A35] mb-1">
                Tax Identifier (PAN / VAT / TIN) (Optional)
              </label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="e.g. AAACA1234A"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCE7E3] bg-white focus:outline-none focus:border-[#087C80] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#102A35] mb-1">
                Incorporation Certificate / Proof Document URL
              </label>
              <input
                type="url"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                placeholder="https://drive.google.com/... or https://domain.com/cert.pdf"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCE7E3] bg-white focus:outline-none focus:border-[#087C80]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#102A35] mb-1">
                Corporate Domain Email Address
              </label>
              <input
                type="email"
                value={corporateEmail}
                onChange={(e) => setCorporateEmail(e.target.value)}
                placeholder="e.g. founder@acmebeta.com"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCE7E3] bg-white focus:outline-none focus:border-[#087C80]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#DCE7E3]">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#52656B] hover:bg-[#EFEFE5] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-[#087C80] text-white hover:bg-[#07545A] shadow-xs transition-colors"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Submit for Verification</span>
            </button>
          </div>
        </form>
      )}
      {/* Original Document Inline Preview Modal */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE7E3]">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#E6F7F0] text-[#0E7C57] flex items-center justify-center">
                  <FileCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#102A35]">
                    Original Uploaded Certificate &bull; Business Proof
                  </h3>
                  <span className="text-[11px] text-[#52656B] font-mono">
                    {previewDocUrl.split('/').pop()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDocUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F6F5ED] hover:bg-stone-200 text-[#102A35] transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open in Tab</span>
                </a>
                <a
                  href={previewDocUrl}
                  download
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#07545A] hover:bg-[#087C80] text-white transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Original</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDocUrl(null)}
                  className="p-1.5 rounded-xl text-[#52656B] hover:bg-[#F6F5ED] transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 w-full min-h-[500px] rounded-2xl overflow-hidden border border-[#DCE7E3] bg-[#525659]">
              <iframe
                src={previewDocUrl}
                title="Original Document Preview"
                className="w-full h-full min-h-[500px] border-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


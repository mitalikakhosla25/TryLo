import React, { useState, useEffect } from 'react';
import {
  Award,
  Star,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  Trash2,
  ThumbsUp,
  Briefcase,
  Loader2,
  Code2,
  Globe,
  Eye,
  Download,
  X,
  FileCode,
  Sparkles,
  Upload,
  Copy,
  Check,
} from 'lucide-react';
import {
  getMyVerificationOverview,
  getTesterVerificationOverview,
  updateTesterResume,
  addTesterCertification,
  deleteTesterCertification,
  endorseTesterSkill,
  createTesterReview,
  previewAtsScore,
  TESTER_SPECIALIZATIONS,
  type TesterVerificationOverview,
  type AtsScorePreviewResponse,
} from '../../api/verification';
import { TesterTierBadge } from '../ui/VerificationBadge';

interface TesterCredibilityHubProps {
  testerId?: string; // If omitted, manages current authenticated tester ('me')
  isOwner?: boolean; // If true, allows editing resume and adding certs
  onUpdated?: () => void;
}

export const TesterCredibilityHub: React.FC<TesterCredibilityHubProps> = ({
  testerId,
  isOwner = true,
  onUpdated,
}) => {
  const [overview, setOverview] = useState<TesterVerificationOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'resume' | 'certificates' | 'endorsements' | 'reviews'>('resume');

  // Modals & sub-forms
  const [showResumeModal, setShowResumeModal] = useState<boolean>(false);
  const [showCertModal, setShowCertModal] = useState<boolean>(false);
  const [showEndorseModal, setShowEndorseModal] = useState<boolean>(false);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocTitle, setPreviewDocTitle] = useState<string>('Original Attested Document');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Resume form state
  const [resumeUrl, setResumeUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [githubUrl, setGithubUrl] = useState<string>('');
  const [portfolioUrl, setPortfolioUrl] = useState<string>('');
  const [bugBountyUrl, setBugBountyUrl] = useState<string>('');
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [latexSource, setLatexSource] = useState<string>('');
  const [atsPreview, setAtsPreview] = useState<AtsScorePreviewResponse | null>(null);
  const [isAnalyzingAts, setIsAnalyzingAts] = useState<boolean>(false);
  const [atsAnalysisError, setAtsAnalysisError] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'code'>('file');
  const [previewLatexCode, setPreviewLatexCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Cert form state
  const [certName, setCertName] = useState<string>('');
  const [issuingOrg, setIssuingOrg] = useState<string>('');
  const [credentialId, setCredentialId] = useState<string>('');
  const [credentialUrl, setCredentialUrl] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>('');

  // Endorse form state
  const [endorseSkill, setEndorseSkill] = useState<string>('');
  const [endorseNote, setEndorseNote] = useState<string>('');

  // Review form state
  const [revName, setRevName] = useState<string>('');
  const [revTitle, setRevTitle] = useState<string>('');
  const [revCompany, setRevCompany] = useState<string>('');
  const [revRating, setRevRating] = useState<number>(5);
  const [revScope, setRevScope] = useState<string>('');
  const [revText, setRevText] = useState<string>('');

  const fetchOverview = async () => {
    setIsLoading(true);
    try {
      const data = testerId
        ? await getTesterVerificationOverview(testerId)
        : await getMyVerificationOverview();
      setOverview(data);

      if (data.resume) {
        setResumeUrl(data.resume.resume_url || '');
        setFileName(data.resume.file_name || '');
        setGithubUrl(data.resume.github_url || '');
        setPortfolioUrl(data.resume.portfolio_url || '');
        setBugBountyUrl(data.resume.bug_bounty_url || '');
        setSpecializations(data.resume.specializations || []);
        setLatexSource(data.resume.latex_source || '');
      }
    } catch (err: any) {
      setMsg({ text: err.message || 'Failed to load verification overview.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [testerId]);

  const handleAnalyzeAts = async (sourceToAnalyze?: string) => {
    const src = sourceToAnalyze || latexSource;
    if (!src || !src.trim()) {
      setAtsAnalysisError('Please provide LaTeX source code or upload a .tex file before analyzing.');
      return;
    }
    setIsAnalyzingAts(true);
    setAtsAnalysisError(null);
    try {
      const res = await previewAtsScore(src);
      setAtsPreview(res);
    } catch (err: any) {
      setAtsAnalysisError(err.message || 'LaTeX resume parsing error. Ensure \\documentclass and \\begin{document} are present.');
      setAtsPreview(null);
    } finally {
      setIsAnalyzingAts(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.tex')) {
      setAtsAnalysisError('Invalid file type: Only LaTeX source files (.tex) are accepted.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      setLatexSource(text);
      setAtsAnalysisError(null);
      handleAnalyzeAts(text);
    };
    reader.readAsText(file);
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadLatex = (source: string, name: string) => {
    const blob = new Blob([source], { type: 'text/x-tex;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name.toLowerCase().endsWith('.tex') ? name : `${name}.tex`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveResume = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMsg(null);
    setAtsAnalysisError(null);

    if (!latexSource.trim() && (!overview?.resume?.is_latex_verified)) {
      setAtsAnalysisError('A valid LaTeX resume (.tex) is required to calculate your ATS Score and complete verification.');
      setActionLoading(false);
      return;
    }

    try {
      await updateTesterResume({
        resume_url: resumeUrl.trim() || undefined,
        file_name: fileName.trim() || (latexSource ? 'resume.tex' : undefined),
        github_url: githubUrl.trim() || undefined,
        portfolio_url: portfolioUrl.trim() || undefined,
        bug_bounty_url: bugBountyUrl.trim() || undefined,
        specializations,
        latex_source: latexSource.trim() || undefined,
      });
      setShowResumeModal(false);
      setMsg({ text: 'LaTeX Resume and ATS score updated successfully!', type: 'success' });
      fetchOverview();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setAtsAnalysisError(err.message || 'Failed to save resume.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCert = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMsg(null);
    try {
      await addTesterCertification({
        name: certName.trim(),
        issuing_organization: issuingOrg.trim(),
        credential_id: credentialId.trim() || undefined,
        credential_url: credentialUrl.trim() || undefined,
        issue_date: issueDate || undefined,
      });
      setShowCertModal(false);
      setCertName('');
      setIssuingOrg('');
      setCredentialId('');
      setCredentialUrl('');
      setIssueDate('');
      setMsg({ text: 'Experience certificate added successfully!', type: 'success' });
      fetchOverview();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setMsg({ text: err.message || 'Failed to add certificate.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCert = async (certId: string) => {
    if (!window.confirm('Are you sure you want to delete this certificate?')) return;
    try {
      await deleteTesterCertification(certId);
      setMsg({ text: 'Certificate deleted.', type: 'success' });
      fetchOverview();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setMsg({ text: err.message || 'Failed to delete certificate.', type: 'error' });
    }
  };

  const handleEndorse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testerId) return;
    setActionLoading(true);
    setMsg(null);
    try {
      await endorseTesterSkill(testerId, {
        skill_name: endorseSkill.trim(),
        endorsement_note: endorseNote.trim() || undefined,
      });
      setShowEndorseModal(false);
      setEndorseSkill('');
      setEndorseNote('');
      setMsg({ text: 'Skill endorsement submitted!', type: 'success' });
      fetchOverview();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setMsg({ text: err.message || 'Endorsement failed.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testerId) return;
    setActionLoading(true);
    setMsg(null);
    try {
      await createTesterReview(testerId, {
        reviewer_name: revName.trim(),
        reviewer_title: revTitle.trim() || undefined,
        company_name: revCompany.trim(),
        overall_rating: revRating,
        project_scope: revScope.trim() || undefined,
        review_text: revText.trim(),
      });
      setShowReviewModal(false);
      setRevName('');
      setRevTitle('');
      setRevCompany('');
      setRevRating(5);
      setRevScope('');
      setRevText('');
      setMsg({ text: 'Performance rating & feedback posted!', type: 'success' });
      fetchOverview();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setMsg({ text: err.message || 'Review submission failed.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSpecialization = (spec: string) => {
    if (specializations.includes(spec)) {
      setSpecializations(specializations.filter((s) => s !== spec));
    } else {
      setSpecializations([...specializations, spec]);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-[#DCE7E3] p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-[#087C80] animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-[#DCE7E3] p-6 sm:p-8 space-y-6 shadow-xs">
      {/* Credibility Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#DCE7E3]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-[#102A35]">Verified Tester Credibility Hub</h3>
            <TesterTierBadge
              tier={overview?.verification_tier || 1}
              rating={overview?.average_rating}
              reviewsCount={overview?.reviews_count}
              size="md"
            />
          </div>
          <p className="text-xs text-[#52656B]">
            {overview?.tier_label} • {overview?.certifications_count || 0} Certificates •{' '}
            {overview?.endorsements_count || 0} Endorsements • {overview?.reviews_count || 0} Employer Reviews
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isOwner && (
            <>
              <button
                onClick={() => setShowEndorseModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#EFEFE5] hover:bg-[#DCE7E3] text-[#102A35] transition-colors"
              >
                <ThumbsUp className="h-3.5 w-3.5 text-[#087C80]" />
                <span>Endorse Skill</span>
              </button>
              <button
                onClick={() => setShowReviewModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#087C80] hover:bg-[#07545A] text-white transition-colors"
              >
                <Star className="h-3.5 w-3.5" />
                <span>Rate & Review</span>
              </button>
            </>
          )}
          {isOwner && activeTab === 'certificates' && (
            <button
              onClick={() => setShowCertModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#087C80] hover:bg-[#07545A] text-white transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Certificate</span>
            </button>
          )}
          {isOwner && activeTab === 'resume' && (
            <button
              onClick={() => setShowResumeModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#087C80] hover:bg-[#07545A] text-white transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>{overview?.has_resume ? 'Edit Resume' : 'Add Resume & Portfolio'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Alert Messages */}
      {msg && (
        <div
          className={`p-3.5 rounded-2xl flex items-center gap-2 text-xs font-medium animate-in fade-in ${
            msg.type === 'success'
              ? 'bg-[#E6F7F0] border border-[#B6EDD5] text-[#0E7C57]'
              : 'bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C]'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-1 border-b border-[#DCE7E3]">
        <button
          onClick={() => setActiveTab('resume')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'resume'
              ? 'border-[#087C80] text-[#087C80]'
              : 'border-transparent text-[#52656B] hover:text-[#102A35]'
          }`}
        >
          Resume & Portfolio
        </button>
        <button
          onClick={() => setActiveTab('certificates')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'certificates'
              ? 'border-[#087C80] text-[#087C80]'
              : 'border-transparent text-[#52656B] hover:text-[#102A35]'
          }`}
        >
          Certificates ({overview?.certifications_count || 0})
        </button>
        <button
          onClick={() => setActiveTab('endorsements')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'endorsements'
              ? 'border-[#087C80] text-[#087C80]'
              : 'border-transparent text-[#52656B] hover:text-[#102A35]'
          }`}
        >
          Endorsements ({overview?.endorsements_count || 0})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'reviews'
              ? 'border-[#087C80] text-[#087C80]'
              : 'border-transparent text-[#52656B] hover:text-[#102A35]'
          }`}
        >
          Employer Reviews ({overview?.reviews_count || 0})
        </button>
      </div>

      {/* Tab 1: Resume & Portfolio */}
      {/* Tab 1: Resume & Portfolio */}
      {activeTab === 'resume' && (
        <div className="space-y-5">
          {/* ATS Score & LaTeX Verification Banner */}
          {overview?.resume?.is_latex_verified && overview.resume.ats_score !== undefined && overview.resume.ats_score !== null ? (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#07545A] to-[#102A35] text-white shadow-lg space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#2DD4BF] text-[#07545A]">
                      LaTeX Verified ATS Score
                    </span>
                    <span className="text-xs text-white/70">Automated QA Technical Evaluation</span>
                  </div>
                  <h4 className="text-lg font-extrabold tracking-tight">Applicant Tracking System (ATS) Rating</h4>
                  <p className="text-xs text-white/80">
                    Calculated from compiled LaTeX resume source code. Startups and founders filter applicants by this score.
                  </p>
                </div>

                {/* Big Score Display */}
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs px-5 py-3 rounded-2xl border border-white/15 self-start sm:self-center">
                  <div className="text-center">
                    <span className="text-3xl font-black text-[#2DD4BF] tracking-tight">
                      {overview.resume.ats_score}
                    </span>
                    <span className="text-xs text-white/60 font-semibold">/100</span>
                    <div className="text-[10px] font-bold text-white/90 uppercase tracking-wider">
                      {overview.resume.ats_score >= 90
                        ? 'Elite (Top 5%)'
                        : overview.resume.ats_score >= 80
                        ? 'Strong Candidate'
                        : overview.resume.ats_score >= 70
                        ? 'Qualified QA'
                        : 'Needs Optimization'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Category Breakdown Progress Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/80 font-medium">LaTeX Structure</span>
                    <span className="font-bold text-[#2DD4BF]">
                      {overview.resume.ats_breakdown?.structure ?? 24} / 25
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div
                      className="bg-[#2DD4BF] h-1.5 rounded-full"
                      style={{ width: `${((overview.resume.ats_breakdown?.structure ?? 24) / 25) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/80 font-medium">QA Keywords</span>
                    <span className="font-bold text-[#2DD4BF]">
                      {overview.resume.ats_breakdown?.keywords ?? 32} / 35
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div
                      className="bg-[#2DD4BF] h-1.5 rounded-full"
                      style={{ width: `${((overview.resume.ats_breakdown?.keywords ?? 32) / 35) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/80 font-medium">Metrics & Impact</span>
                    <span className="font-bold text-[#2DD4BF]">
                      {overview.resume.ats_breakdown?.metrics ?? 16} / 20
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div
                      className="bg-[#2DD4BF] h-1.5 rounded-full"
                      style={{ width: `${((overview.resume.ats_breakdown?.metrics ?? 16) / 20) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/80 font-medium">Readability</span>
                    <span className="font-bold text-[#2DD4BF]">
                      {overview.resume.ats_breakdown?.readability ?? 18} / 20
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div
                      className="bg-[#2DD4BF] h-1.5 rounded-full"
                      style={{ width: `${((overview.resume.ats_breakdown?.readability ?? 18) / 20) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Feedback bullets */}
              {overview.resume.ats_feedback && overview.resume.ats_feedback.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider block">
                    ATS Optimization Diagnostics:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {overview.resume.ats_feedback.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-white/90 bg-white/5 p-2 rounded-xl">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#2DD4BF] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                {overview.resume.latex_source && (
                  <button
                    type="button"
                    onClick={() => setPreviewLatexCode(overview.resume?.latex_source || null)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#2DD4BF] hover:bg-[#20b8a4] text-[#07545A] transition-colors cursor-pointer"
                  >
                    <FileCode className="h-3.5 w-3.5" />
                    <span>View LaTeX Source Code</span>
                  </button>
                )}
                {overview.resume.latex_source && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadLatex(
                        overview.resume!.latex_source!,
                        overview.resume!.file_name || 'tester_resume.tex'
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/15"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download .tex File</span>
                  </button>
                )}
                {overview.resume.resume_url && (
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewDocTitle(overview.resume?.file_name || 'Original Resume / CV');
                      setPreviewDocUrl(overview.resume?.resume_url || null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/15"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View Document</span>
                  </button>
                )}
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setShowResumeModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-[#102A35] hover:bg-stone-100 transition-colors cursor-pointer ml-auto"
                  >
                    <FileText className="h-3.5 w-3.5 text-[#07545A]" />
                    <span>Update LaTeX Resume</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-[#F6F5ED] border border-dashed border-[#DCE7E3] text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-[#D7EFEB] text-[#07545A] flex items-center justify-center mx-auto">
                <FileCode className="h-6 w-6" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="text-sm font-bold text-[#102A35]">
                  Strict LaTeX Resume Upload & ATS Score Required
                </h4>
                <p className="text-xs text-[#52656B] leading-relaxed">
                  TryLo only accepts <strong>LaTeX-based resumes (.tex)</strong>. Uploading your LaTeX document automatically calculates your ATS Score across QA keywords, architecture, action verbs, and readability, enabling founders to filter and discover your profile.
                </p>
              </div>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setShowResumeModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#07545A] hover:bg-[#087C80] text-white transition-colors shadow-xs"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload LaTeX Resume (.tex)</span>
                </button>
              )}
            </div>
          )}

          {/* Original Resume Document Bar (if uploaded) */}
          {overview?.resume?.resume_url && (
            <div className="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-[#D7EFEB] text-[#07545A] flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#102A35]">
                    {overview.resume.file_name || 'Verified Resume Document'}
                  </h4>
                  <span className="text-[11px] text-[#52656B]">
                    Updated on {new Date(overview.resume.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewDocTitle(overview.resume?.file_name || 'Original Resume / CV');
                    setPreviewDocUrl(overview.resume?.resume_url || null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#07545A] hover:bg-[#087C80] text-white transition-colors shadow-2xs cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>View Original</span>
                </button>
                <a
                  href={overview.resume.resume_url}
                  download
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#DCE7E3] text-[#102A35] hover:bg-[#F6F5ED] transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          )}

          {/* Links & Specializations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-[#DCE7E3] space-y-3">
              <h5 className="text-xs font-bold text-[#102A35] uppercase tracking-wider">Professional Profiles</h5>
              <div className="space-y-2 text-xs">
                {overview?.resume?.github_url && (
                  <a
                    href={overview.resume.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-[#087C80] hover:underline"
                  >
                    <Code2 className="h-3.5 w-3.5 text-[#102A35]" />
                    <span>GitHub: {overview.resume.github_url.replace('https://github.com/', '')}</span>
                  </a>
                )}
                {overview?.resume?.portfolio_url && (
                  <a
                    href={overview.resume.portfolio_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-[#087C80] hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5 text-[#087C80]" />
                    <span>Portfolio / Blog</span>
                  </a>
                )}
                {overview?.resume?.bug_bounty_url && (
                  <a
                    href={overview.resume.bug_bounty_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-[#087C80] hover:underline"
                  >
                    <Award className="h-3.5 w-3.5 text-amber-600" />
                    <span>Bug Bounty / QA Profile</span>
                  </a>
                )}
                {!overview?.resume?.github_url && !overview?.resume?.portfolio_url && !overview?.resume?.bug_bounty_url && (
                  <p className="text-[11px] text-[#52656B] italic">No portfolio links provided.</p>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#DCE7E3] space-y-3">
              <h5 className="text-xs font-bold text-[#102A35] uppercase tracking-wider">Testing Specializations</h5>
              <div className="flex flex-wrap gap-1.5">
                {overview?.resume?.specializations && overview.resume.specializations.length > 0 ? (
                  overview.resume.specializations.map((spec) => (
                    <span
                      key={spec}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#D7EFEB] text-[#07545A]"
                    >
                      {spec}
                    </span>
                  ))
                ) : (
                  <p className="text-[11px] text-[#52656B] italic">No specializations tagged.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Certificates */}
      {activeTab === 'certificates' && (
        <div className="space-y-3">
          {overview?.certifications && overview.certifications.length > 0 ? (
            overview.certifications.map((cert) => (
              <div
                key={cert.id}
                className="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-[#087C80]" />
                    <h5 className="text-xs font-bold text-[#102A35]">{cert.name}</h5>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E6F7F0] text-[#0E7C57] border border-[#B6EDD5]">
                      Verified Credential
                    </span>
                  </div>
                  <p className="text-[11px] text-[#52656B]">
                    Issued by <strong>{cert.issuing_organization}</strong>
                    {cert.credential_id && ` • ID: ${cert.credential_id}`}
                    {cert.issue_date && ` • Issued: ${cert.issue_date}`}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {cert.credential_url && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewDocTitle(`${cert.name} (${cert.issuing_organization})`);
                          setPreviewDocUrl(cert.credential_url || null);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#07545A] hover:bg-[#087C80] text-white transition-colors shadow-2xs cursor-pointer"
                      >
                        <Eye className="h-3 w-3" />
                        <span>View Certificate</span>
                      </button>
                      <a
                        href={cert.credential_url}
                        download
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#DCE7E3] text-[#102A35] hover:bg-[#F6F5ED] transition-colors"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download</span>
                      </a>
                    </div>
                  )}
                  {isOwner && (
                    <button
                      onClick={() => handleDeleteCert(cert.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Delete Certificate"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 rounded-2xl bg-[#F6F5ED] border border-dashed border-[#DCE7E3] text-center space-y-2">
              <Award className="h-8 w-8 text-[#7E939B] mx-auto" />
              <p className="text-xs font-semibold text-[#102A35]">No Experience Certificates Added</p>
              <p className="text-[11px] text-[#52656B]">
                Add your ISTQB, AWS, Postman, or university software testing credentials to boost credibility.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Endorsements */}
      {activeTab === 'endorsements' && (
        <div className="space-y-3">
          {overview?.endorsements && overview.endorsements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {overview.endorsements.map((end) => (
                <div key={end.id} className="p-3.5 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#07545A] bg-[#D7EFEB] px-2.5 py-0.5 rounded-md">
                      {end.skill_name}
                    </span>
                    <span className="text-[10px] text-[#52656B]">
                      {new Date(end.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#52656B]">
                    Endorsed by <strong>{end.endorser_name || 'Founder'}</strong>
                  </p>
                  {end.endorsement_note && (
                    <p className="text-xs text-[#102A35] italic bg-white/70 p-2 rounded-lg border border-[#DCE7E3]/60">
                      "{end.endorsement_note}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#F6F5ED] border border-dashed border-[#DCE7E3] text-center space-y-2">
              <ThumbsUp className="h-8 w-8 text-[#7E939B] mx-auto" />
              <p className="text-xs font-semibold text-[#102A35]">No Skill Endorsements Yet</p>
              <p className="text-[11px] text-[#52656B]">
                Founders and fellow testers can endorse your testing competencies as you complete campaigns.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Employer Reviews */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {overview?.reviews && overview.reviews.length > 0 ? (
            overview.reviews.map((rev) => (
              <div key={rev.id} className="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-bold text-[#102A35]">{rev.reviewer_name}</h5>
                      {rev.reviewer_title && (
                        <span className="text-[11px] text-[#52656B]">• {rev.reviewer_title}</span>
                      )}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E6F7F0] text-[#0E7C57] border border-[#B6EDD5]">
                        Verified Employer
                      </span>
                    </div>
                    <p className="text-[11px] text-[#087C80] font-semibold">
                      {rev.company_name} {rev.project_scope && `• Scope: ${rev.project_scope}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3.5 w-3.5 ${
                          star <= rev.overall_rating
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-[#DCE7E3]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-[#102A35] leading-relaxed bg-white/80 p-3 rounded-xl border border-[#DCE7E3]/60 whitespace-pre-line">
                  {rev.review_text}
                </p>

                <div className="flex items-center justify-between text-[10px] text-[#7E939B] pt-1">
                  <span>Rating: {rev.overall_rating}.0 / 5.0</span>
                  <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 rounded-2xl bg-[#F6F5ED] border border-dashed border-[#DCE7E3] text-center space-y-2">
              <Briefcase className="h-8 w-8 text-[#7E939B] mx-auto" />
              <p className="text-xs font-semibold text-[#102A35]">No Employer Reviews Yet</p>
              <p className="text-[11px] text-[#52656B]">
                When founders accept and resolve your bug reports, they can leave verified feedback and 5-star ratings here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Resume Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE7E3]">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#D7EFEB] text-[#07545A] flex items-center justify-center">
                  <FileCode className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#102A35]">
                    Upload LaTeX Resume & Calculate ATS Score
                  </h4>
                  <p className="text-[11px] text-[#52656B]">
                    Strict LaTeX requirement: Only valid .tex documents are parsed and scored.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResumeModal(false)}
                className="p-1.5 rounded-xl text-[#52656B] hover:bg-[#F6F5ED] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Strict LaTeX Notice */}
            <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Strict ATS Requirement: Only LaTeX Resumes (.tex) Accepted</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#78350F]">
                To ensure objective, standardized evaluation across QA frameworks, automation, and quantifiable metrics, TryLo requires resumes in <strong>LaTeX format</strong>. Documents without <code>\documentclass</code> or <code>\begin{'{document}'}</code> will be rejected with HTTP 422.
              </p>
            </div>

            <form onSubmit={handleSaveResume} className="space-y-4">
              {/* Mode Switcher */}
              <div className="flex items-center gap-2 p-1 bg-[#F6F5ED] rounded-xl border border-[#DCE7E3]">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    uploadMode === 'file'
                      ? 'bg-[#07545A] text-white shadow-2xs'
                      : 'text-[#52656B] hover:text-[#102A35]'
                  }`}
                >
                  Upload .tex File
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('code')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    uploadMode === 'code'
                      ? 'bg-[#07545A] text-white shadow-2xs'
                      : 'text-[#52656B] hover:text-[#102A35]'
                  }`}
                >
                  Paste LaTeX Source Code
                </button>
              </div>

              {/* Upload File Input */}
              {uploadMode === 'file' && (
                <div className="p-4 rounded-2xl border-2 border-dashed border-[#DCE7E3] hover:border-[#087C80] bg-[#F6F5ED]/40 text-center space-y-2 transition-colors">
                  <Upload className="h-7 w-7 text-[#07545A] mx-auto" />
                  <p className="text-xs font-bold text-[#102A35]">
                    Select or drop your LaTeX resume file (.tex)
                  </p>
                  <p className="text-[11px] text-[#52656B]">
                    File will be read locally and evaluated by the automated ATS scoring engine.
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#07545A] hover:bg-[#087C80] text-white transition-colors cursor-pointer shadow-xs">
                    <FileCode className="h-3.5 w-3.5" />
                    <span>Browse .tex File</span>
                    <input
                      type="file"
                      accept=".tex"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {latexSource && (
                    <div className="mt-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                      <span className="font-mono text-[11px]">
                        ✓ Loaded: {fileName || 'resume.tex'} ({latexSource.length} chars)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAnalyzeAts()}
                        className="text-[11px] font-bold text-[#07545A] underline cursor-pointer"
                      >
                        Re-calculate Score
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Paste Code Area */}
              {uploadMode === 'code' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-[#102A35]">
                      LaTeX Source Code <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-[#52656B] font-mono">
                      {latexSource.length} characters
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={latexSource}
                    onChange={(e) => {
                      setLatexSource(e.target.value);
                      setAtsAnalysisError(null);
                    }}
                    placeholder={`\\documentclass{article}
\\usepackage{hyperref}
\\begin{document}
\\section{Experience}
\\textbf{Senior QA Engineer} | Playwright, Selenium, CI/CD, k6
\\begin{itemize}
  \\item Automated 250+ end-to-end regression tests reducing release cycle by 40%.
  \\item Engineered API testing pipelines with Postman and GitHub Actions.
\\end{itemize}
\\end{document}`}
                    className="w-full font-mono text-[11px] p-3.5 rounded-xl border border-[#DCE7E3] bg-[#102A35] text-[#2DD4BF] focus:outline-none focus:ring-1 focus:ring-[#2DD4BF] leading-relaxed"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={isAnalyzingAts || !latexSource.trim()}
                      onClick={() => handleAnalyzeAts()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#07545A] hover:bg-[#087C80] text-white transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isAnalyzingAts ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3 text-[#2DD4BF]" />
                      )}
                      <span>Run ATS Score Analysis</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Analysis Error Alert */}
              {atsAnalysisError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">LaTeX ATS Validation Error:</span>
                    <span>{atsAnalysisError}</span>
                  </div>
                </div>
              )}

              {/* Live ATS Preview Card */}
              {atsPreview && (
                <div className="p-4 rounded-2xl bg-[#07545A] text-white space-y-3 shadow-md animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#2DD4BF]">
                        Live ATS Score Analysis
                      </span>
                      <h5 className="text-sm font-black">
                        ATS Score: {atsPreview.ats_score} / 100
                      </h5>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 border border-white/20 text-[#2DD4BF]">
                      {atsPreview.ats_score >= 90
                        ? 'Elite Candidate (Top 5%)'
                        : atsPreview.ats_score >= 80
                        ? 'Strong QA Candidate'
                        : atsPreview.ats_score >= 70
                        ? 'Qualified'
                        : 'Needs Optimization'}
                    </span>
                  </div>

                  {/* Breakdown Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-white/10">
                      <span className="text-white/70 block text-[10px]">Structure</span>
                      <span className="font-bold text-[#2DD4BF]">
                        {atsPreview.breakdown.structure} / 25
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/10">
                      <span className="text-white/70 block text-[10px]">Keywords</span>
                      <span className="font-bold text-[#2DD4BF]">
                        {atsPreview.breakdown.keywords} / 35
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/10">
                      <span className="text-white/70 block text-[10px]">Metrics</span>
                      <span className="font-bold text-[#2DD4BF]">
                        {atsPreview.breakdown.metrics} / 20
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/10">
                      <span className="text-white/70 block text-[10px]">Readability</span>
                      <span className="font-bold text-[#2DD4BF]">
                        {atsPreview.breakdown.readability} / 20
                      </span>
                    </div>
                  </div>

                  {/* Detected Keywords */}
                  {atsPreview.detected_keywords.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-white/70">
                        Keywords Identified ({atsPreview.detected_keywords.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {atsPreview.detected_keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/10 text-white"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feedback */}
                  {atsPreview.feedback.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-white/10">
                      <span className="text-[10px] uppercase font-bold text-white/70">Feedback:</span>
                      <ul className="text-xs space-y-0.5 text-white/90">
                        {atsPreview.feedback.map((f, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <Check className="h-3 w-3 text-[#2DD4BF]" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Standard Metadata Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#DCE7E3]">
                <div>
                  <label className="block text-xs font-semibold text-[#102A35] mb-1">
                    File Label / Name
                  </label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="e.g. Priyapatel_QA_Resume.tex"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCE7E3] bg-white focus:outline-none focus:border-[#087C80]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102A35] mb-1">
                    Compiled Resume PDF Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    placeholder="https://drive.google.com/... or /resume.pdf"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCE7E3] bg-white focus:outline-none focus:border-[#087C80]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#102A35] mb-1">GitHub Profile URL</label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCE7E3] bg-white focus:outline-none focus:border-[#087C80]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102A35] mb-1">Portfolio or Blog URL</label>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://myportfolio.dev"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCE7E3] bg-white focus:outline-none focus:border-[#087C80]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102A35] mb-1.5">
                  Testing Specializations
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-2 border border-[#DCE7E3] rounded-xl bg-[#F6F5ED]/40">
                  {TESTER_SPECIALIZATIONS.map((spec) => (
                    <label
                      key={spec}
                      className="flex items-center space-x-2 text-[11px] text-[#102A35] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={specializations.includes(spec)}
                        onChange={() => toggleSpecialization(spec)}
                        className="rounded border-[#DCE7E3] text-[#087C80] focus:ring-[#087C80]"
                      />
                      <span>{spec}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-[#DCE7E3]">
                <button
                  type="button"
                  onClick={() => setShowResumeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#52656B] hover:bg-[#EFEFE5] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#07545A] text-white hover:bg-[#087C80] shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save & Verify LaTeX Resume</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verified LaTeX Code Viewer Modal */}
      {previewLatexCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE7E3]">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#D7EFEB] text-[#07545A] flex items-center justify-center">
                  <FileCode className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#102A35]">
                    Verified LaTeX Resume Source Code
                  </h3>
                  <span className="text-[11px] text-[#52656B] font-mono">
                    {overview?.resume?.file_name || 'resume.tex'} • {previewLatexCode.length} characters
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyCode(previewLatexCode)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F6F5ED] hover:bg-stone-200 text-[#102A35] transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadLatex(
                      previewLatexCode,
                      overview?.resume?.file_name || 'resume.tex'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#07545A] hover:bg-[#087C80] text-white transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download .tex</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewLatexCode(null)}
                  className="p-1.5 rounded-xl text-[#52656B] hover:bg-[#F6F5ED] transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 w-full min-h-[450px] rounded-2xl overflow-hidden border border-[#DCE7E3] bg-[#102A35] p-4 text-[#2DD4BF] font-mono text-xs overflow-y-auto leading-relaxed select-all">
              <pre className="whitespace-pre-wrap">{previewLatexCode}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Add Certificate Modal */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h4 className="text-sm font-bold text-[#102A35]">Add Experience Certificate</h4>
            <form onSubmit={handleAddCert} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#102A35] mb-1">
                  Certificate Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={certName}
                  onChange={(e) => setCertName(e.target.value)}
                  placeholder="e.g. ISTQB Certified Tester Foundation Level"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCE7E3] bg-white focus:outline-none focus:border-[#087C80]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102A35] mb-1">
                  Issuing Organization <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={issuingOrg}
                  onChange={(e) => setIssuingOrg(e.target.value)}
                  placeholder="e.g. ISTQB / Indian Testing Board, AWS, Coursera"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCE7E3] bg-white focus:outline-none focus:border-[#087C80]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#102A35] mb-1">Credential ID</label>
                  <input
                    type="text"
                    value={credentialId}
                    onChange={(e) => setCredentialId(e.target.value)}
                    placeholder="e.g. CTFL-2024-9182"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCE7E3] bg-white focus:outline-none focus:border-[#087C80] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102A35] mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCE7E3] bg-white focus:outline-none focus:border-[#087C80]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102A35] mb-1">
                  Verification URL / Proof Link
                </label>
                <input
                  type="url"
                  value={credentialUrl}
                  onChange={(e) => setCredentialUrl(e.target.value)}
                  placeholder="https://verify.istqb.org/check/..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCE7E3] bg-white focus:outline-none focus:border-[#087C80]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-[#DCE7E3]">
                <button
                  type="button"
                  onClick={() => setShowCertModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#52656B] hover:bg-[#EFEFE5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold bg-[#087C80] text-white hover:bg-[#07545A]"
                >
                  {actionLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>Add Certificate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Endorse Modal */}
      {showEndorseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h4 className="text-sm font-bold text-[#102A35]">Endorse Tester Skill</h4>
            <form onSubmit={handleEndorse} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#102A35] mb-1">
                  Skill to Endorse <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={endorseSkill}
                  onChange={(e) => setEndorseSkill(e.target.value)}
                  placeholder="e.g. REST API Testing, Cypress, Mobile UI"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCE7E3] bg-white focus:outline-none focus:border-[#087C80]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102A35] mb-1">
                  Testimonial / Note (Optional)
                </label>
                <textarea
                  rows={3}
                  value={endorseNote}
                  onChange={(e) => setEndorseNote(e.target.value)}
                  placeholder="e.g. Demonstrated outstanding attention to detail during our beta cycle."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCE7E3] bg-white focus:outline-none focus:border-[#087C80]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-[#DCE7E3]">
                <button
                  type="button"
                  onClick={() => setShowEndorseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#52656B] hover:bg-[#EFEFE5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold bg-[#087C80] text-white hover:bg-[#07545A]"
                >
                  {actionLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>Submit Endorsement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h4 className="text-sm font-bold text-[#102A35]">Submit Founder / Employer Review</h4>
            <form onSubmit={handleAddReview} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#102A35] mb-1">
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={revName}
                    onChange={(e) => setRevName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCE7E3] bg-white focus:outline-none focus:border-[#087C80]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102A35] mb-1">Company / Startup</label>
                  <input
                    type="text"
                    required
                    value={revCompany}
                    onChange={(e) => setRevCompany(e.target.value)}
                    placeholder="e.g. Acme Tech"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCE7E3] bg-white focus:outline-none focus:border-[#087C80]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#102A35] mb-1">Your Title</label>
                  <input
                    type="text"
                    value={revTitle}
                    onChange={(e) => setRevTitle(e.target.value)}
                    placeholder="e.g. Co-founder & CTO"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCE7E3] bg-white focus:outline-none focus:border-[#087C80]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102A35] mb-1">Overall Rating (1-5)</label>
                  <select
                    value={revRating}
                    onChange={(e) => setRevRating(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCE7E3] bg-white focus:outline-none focus:border-[#087C80]"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ 5 Stars (Exceptional)</option>
                    <option value={4}>⭐⭐⭐⭐ 4 Stars (Very Good)</option>
                    <option value={3}>⭐⭐⭐ 3 Stars (Good)</option>
                    <option value={2}>⭐⭐ 2 Stars (Fair)</option>
                    <option value={1}>⭐ 1 Star (Poor)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102A35] mb-1">Project Scope / Release Tested</label>
                <input
                  type="text"
                  value={revScope}
                  onChange={(e) => setRevScope(e.target.value)}
                  placeholder="e.g. Beta V1.2 iOS Checkout Flow"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCE7E3] bg-white focus:outline-none focus:border-[#087C80]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102A35] mb-1">
                  Performance Feedback / Testimonial <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={revText}
                  onChange={(e) => setRevText(e.target.value)}
                  placeholder="Describe the tester's thoroughness, bug report quality, responsiveness, and communication..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DCE7E3] bg-white focus:outline-none focus:border-[#087C80]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-[#DCE7E3]">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#52656B] hover:bg-[#EFEFE5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold bg-[#087C80] text-white hover:bg-[#07545A]"
                >
                  {actionLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>Post Verified Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Original Document Inline Preview Modal */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE7E3]">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#D7EFEB] text-[#07545A] flex items-center justify-center">
                  <Award className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#102A35]">
                    {previewDocTitle}
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


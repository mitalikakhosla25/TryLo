import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Target,
  UserCheck,
  CheckCircle2,
  Award,
  Sparkles,
  ArrowRight,
  Compass,
  Laptop,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: 'founder' | 'tester';
}

interface TutorialStep {
  step: string;
  badge: string;
  title: string;
  description: string;
  takeaway: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  mockup: {
    header: string;
    sub: string;
    badgeText: string;
    items: { label: string; value: string; isHighlight?: boolean }[];
    footerNotice?: string;
  };
}

const FOUNDER_TUTORIAL_STEPS: TutorialStep[] = [
  {
    step: '01',
    badge: 'Step 1 • Anti-Shell Trust Protocol',
    title: 'Verify Your Startup Legitimacy',
    description:
      'To protect testers from fraudulent shell entities, founders provide legitimate government registration (CIN, GSTIN, LLC, or Corp) and a company domain email.',
    takeaway: 'Guaranteed credibility. Only verified companies can launch public campaigns.',
    icon: ShieldCheck,
    accentColor: '#0E7C57',
    mockup: {
      header: 'Nexus AI Technologies Pvt Ltd',
      sub: 'Corporate Email: founder@nexusai.io',
      badgeText: 'MCA CIN: U72900KA2023PTC178942',
      items: [
        { label: 'Registration Type', value: 'Private Limited (Pvt Ltd)' },
        { label: 'Legal Status', value: 'Verified & Active (MCA Portal)', isHighlight: true },
        { label: 'Domain Matching', value: 'Confirmed (@nexusai.io)' },
        { label: 'Publishing Permission', value: 'Granted (Anti-Shell Cleared)' },
      ],
      footerNotice: 'Public profile granted the Verified Startup Shield badge.',
    },
  },
  {
    step: '02',
    badge: 'Step 2 • Campaign Architecture',
    title: 'Design Guided Testing Missions',
    description:
      'Define step-by-step test scenarios, hardware requirements (macOS, Android, Linux), custom screening questions, and monetary bounties or perks.',
    takeaway: 'Structure gives testers clarity and produces 10x higher quality bug reports.',
    icon: Target,
    accentColor: '#087C80',
    mockup: {
      header: 'Campaign: Nexus Copilot Beta',
      sub: 'Reward: $75 Monetary Payout • Deadline: 14 Days',
      badgeText: 'Mission Architecture',
      items: [
        { label: 'Task 1', value: 'Connect GitHub test repository and trigger analysis' },
        { label: 'Task 2', value: 'Test intentional CVE SQL injection detection flags', isHighlight: true },
        { label: 'Task 3', value: 'Evaluate multi-file PR response latency (>500 lines)' },
        { label: 'Target Audience', value: 'Advanced QA & Security Specialists' },
      ],
      footerNotice: 'Testers must answer screening questions before applying.',
    },
  },
  {
    step: '03',
    badge: 'Step 3 • Screen Vetted Testers',
    title: 'Review Credentials & Proven Resumes',
    description:
      'Screen applicants with dynamic verification tiers (Tier 1 Basic to Tier 3 Top-Rated), verified ISTQB/AWS certifications, GitHub portfolios, and founder ratings.',
    takeaway: 'No random bots or low-effort testers. Only verified human practitioners.',
    icon: UserCheck,
    accentColor: '#07545A',
    mockup: {
      header: 'Applicant: Priya Patel',
      sub: 'Senior QA Automation & Security • 6 Years Exp',
      badgeText: 'Tier 3: Top-Rated Vetted • 5.0 (2 Reviews)',
      items: [
        { label: 'Verified Certs', value: 'ISTQB Advanced Test Automation, AWS Security', isHighlight: true },
        { label: 'Endorsements', value: 'Penetration Testing (4), Cypress (5)' },
        { label: 'Past Review', value: '"Caught 3 critical race conditions" — CTO, Stripe Partner' },
        { label: 'Hardware Fit', value: 'macOS, Linux, Android (Matches Campaign)' },
      ],
      footerNotice: 'Inspect full resume and certifications before accepting.',
    },
  },
  {
    step: '04',
    badge: 'Step 4 • Closed-Loop Signal',
    title: 'Triage Reports, Retest & Endorse',
    description:
      'Receive structured bug reports with reproduction steps, network traces, and video recordings. Verify fixes, rate testers, and build long-term relationships.',
    takeaway: 'Close the loop, squash critical vulnerabilities, and ship with certainty.',
    icon: CheckCircle2,
    accentColor: '#0E7C57',
    mockup: {
      header: 'Bug Report #104: Auth Token Race Condition',
      sub: 'Severity: High • Device: macOS 14.2 Chrome 122',
      badgeText: 'Actionable Signal',
      items: [
        { label: 'Reproduction', value: 'Provided curl script & HAR network dump', isHighlight: true },
        { label: 'Fix Status', value: 'Patched in v0.9.4 • Retest Verified' },
        { label: 'Founder Action', value: 'Awarded $75 Bounty & 5-Star Review' },
        { label: 'Endorsement', value: 'Endorsed for "Security QA"' },
      ],
      footerNotice: 'Completed feedback loops automatically update tester credibility.',
    },
  },
];

const TESTER_TUTORIAL_STEPS: TutorialStep[] = [
  {
    step: '01',
    badge: 'Step 1 • Reputation Hub',
    title: 'Build Your Verified Credibility Hub',
    description:
      'Upload your QA resume, link your GitHub/portfolio, add verified industry certifications (ISTQB, AWS, Google), and collect endorsements to reach Tier 3.',
    takeaway: 'Your verified reputation unlocks private beta invites and premium bounties.',
    icon: Award,
    accentColor: '#087C80',
    mockup: {
      header: 'Tester Credibility Hub',
      sub: 'Verification Status: Tier 3 Top-Rated Vetted',
      badgeText: 'Verified QA Profile',
      items: [
        { label: 'Resume File', value: 'Priya_Patel_Senior_QA.pdf (Verified)', isHighlight: true },
        { label: 'Certifications', value: 'ISTQB Advanced Level, AWS Security Specialty' },
        { label: 'Founder Ratings', value: '5.0 Rating Across 2 Beta Campaigns' },
        { label: 'Specializations', value: 'API Penetration, Automated Regressions, UI/UX' },
      ],
      footerNotice: 'Verified profiles get 4x higher campaign acceptance rates.',
    },
  },
  {
    step: '02',
    badge: 'Step 2 • Venture Discovery',
    title: 'Explore Curated Early-Stage Software',
    description:
      'Discover innovative pre-launch SaaS, AI copilots, and developer platforms from anti-shell verified startups. Filter by your devices, operating system, and bounty rewards.',
    takeaway: 'Test cutting-edge technology before it launches to the world.',
    icon: Compass,
    accentColor: '#07545A',
    mockup: {
      header: 'Nexus AI Labs: Code Review Copilot',
      sub: 'Bounty: $75 USD Cash Payout • 25 Testers Needed',
      badgeText: 'Verified Startup Campaign',
      items: [
        { label: 'Category', value: 'AI / Developer Tools' },
        { label: 'Required Tier', value: 'Tier 2+ (Certified QA Specialists)', isHighlight: true },
        { label: 'Screening', value: '2 Quick Experience Questions' },
        { label: 'Device Support', value: 'macOS, Linux, Windows' },
      ],
      footerNotice: 'One-click application using your saved profile & credentials.',
    },
  },
  {
    step: '03',
    badge: 'Step 3 • Guided Testing Journey',
    title: 'Execute Step-by-Step Test Scenarios',
    description:
      'Follow clear testing tasks defined by the founders. Exercise real-world workflows, stress-test edge cases, and evaluate responsiveness on your personal devices.',
    takeaway: 'Clear goals. No ambiguity about what to test and validate.',
    icon: Laptop,
    accentColor: '#087C80',
    mockup: {
      header: 'Active Mission: Nexus Copilot Tasks',
      sub: 'Progress: 2 of 3 Completed',
      badgeText: 'Testing Workspace',
      items: [
        { label: 'Task 1: Setup', value: 'Connected test repo (Completed)', isHighlight: false },
        { label: 'Task 2: CVE Test', value: 'Simulated SQL Injection payload (Completed)' },
        { label: 'Task 3: Latency', value: 'In Progress: Multi-file PR benchmark (>500 lines)', isHighlight: true },
        { label: 'Artifacts', value: 'Ready to attach video & network log' },
      ],
      footerNotice: 'Progress saves automatically across sessions.',
    },
  },
  {
    step: '04',
    badge: 'Step 4 • Payouts & Reputation',
    title: 'Submit High-Signal Reports & Earn',
    description:
      'File reproducible bug reports with screenshots and logs. Founders review your findings, release cash payouts via Stripe/Wise, and leave 5-star reviews on your profile.',
    takeaway: 'Turn your QA skills into verified reputation and monetary rewards.',
    icon: CheckCircle2,
    accentColor: '#0E7C57',
    mockup: {
      header: 'Submission Approved & Reward Released',
      sub: 'Payout: $75.00 Transferred • Review Recorded',
      badgeText: 'Bounty Cleared',
      items: [
        { label: 'Feedback Quality', value: 'Exceptional (Reproduction script verified)', isHighlight: true },
        { label: 'Founder Rating', value: '5.0 Rating — "Found 3 subtle concurrency issues"' },
        { label: 'Skill Endorsement', value: '+1 Endorsement in Automated Testing' },
        { label: 'Tier Impact', value: 'Maintained Tier 3 Top-Rated Status' },
      ],
      footerNotice: 'Earnings and endorsements automatically update on your public profile.',
    },
  },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'founder',
}) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState<'founder' | 'tester'>(initialRole);
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  useEffect(() => {
    if (initialRole) setRole(initialRole);
    setStepIndex(0);
  }, [initialRole, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, stepIndex, role]);

  if (!isOpen) return null;

  const steps = role === 'founder' ? FOUNDER_TUTORIAL_STEPS : TESTER_TUTORIAL_STEPS;
  const currentStep = steps[stepIndex];

  const handleNext = () => {
    setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    setStepIndex((prev) => (prev > 0 ? prev - 1 : steps.length - 1));
  };

  const handleLaunchDemo = async (targetRole: 'founder' | 'tester') => {
    setIsSimulating(true);
    try {
      const email = targetRole === 'founder' ? 'founder@trylo.io' : 'tester@trylo.io';
      await login({ email, password: 'Password123!' });
      onClose();
      navigate(targetRole === 'founder' ? '/founder' : '/tester');
    } catch (err) {
      console.error('Demo simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Blurred Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#102A35]/70 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog Window */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl border border-[#DCE7E3] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-[#DCE7E3] bg-[#F6F5ED]/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#087C80] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              T
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#102A35]">
                How TryLo Works: Platform Tour
              </h2>
              <p className="text-xs text-[#52656B]">
                Discover how verified founders and vetted testers collaborate with complete trust.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#52656B] hover:text-[#102A35] hover:bg-white transition-colors cursor-pointer"
            aria-label="Close tutorial"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dual Role Selector Tab Pill */}
        <div className="px-6 sm:px-8 pt-4 pb-2 flex items-center justify-between bg-white border-b border-[#DCE7E3]">
          <div className="relative inline-grid grid-cols-2 p-1 bg-[#EFEFE5] rounded-full border border-[#DCE7E3] w-64 sm:w-72 select-none shadow-inner">
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-[#087C80] shadow-sm transition-all duration-300 ease-out"
              style={{
                left: role === 'founder' ? '4px' : 'calc(50%)',
              }}
            />
            <button
              type="button"
              onClick={() => {
                setRole('founder');
                setStepIndex(0);
              }}
              className={`relative z-10 flex items-center justify-center py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                role === 'founder' ? 'text-white' : 'text-[#52656B] hover:text-[#102A35]'
              }`}
            >
              <span>For Founders</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('tester');
                setStepIndex(0);
              }}
              className={`relative z-10 flex items-center justify-center py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                role === 'tester' ? 'text-white' : 'text-[#52656B] hover:text-[#102A35]'
              }`}
            >
              <span>For Testers</span>
            </button>
          </div>

          {/* Step Counter Indicator */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#52656B]">
            <span>Step</span>
            <span className="text-[#07545A] font-extrabold text-sm">{stepIndex + 1}</span>
            <span>of</span>
            <span>{steps.length}</span>
          </div>
        </div>

        {/* Modal Body: Active Step Content & Interactive Preview Mockup */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#F6F5ED]/40">
          {/* Left Column: Step Description */}
          <div className="lg:col-span-6 space-y-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#102A35] tracking-tight leading-tight">
              {currentStep.title}
            </h3>

            <p className="text-sm text-[#52656B] leading-relaxed">
              {currentStep.description}
            </p>

            <div className="p-3.5 rounded-xl bg-white border border-[#DCE7E3] shadow-xs flex items-start gap-2.5">
              <Check className="w-4 h-4 text-[#0E7C57] shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-[#102A35] block mb-0.5">Key Advantage:</strong>
                <span className="text-[#52656B]">{currentStep.takeaway}</span>
              </div>
            </div>

            {/* Quick Demo CTA for This Role */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isSimulating}
                onClick={() => handleLaunchDemo(role)}
                className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full bg-[#07545A] hover:bg-[#087C80] text-white shadow-xs transition cursor-pointer"
              >
                <span>Test Live {role === 'founder' ? 'Founder' : 'Tester'} Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Styled UI Mockup */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl bg-white border border-[#DCE7E3] p-5 sm:p-6 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-[#DCE7E3]">
                <div>
                  <h4 className="font-bold text-sm text-[#102A35]">{currentStep.mockup.header}</h4>
                  <p className="text-[11px] text-[#52656B]">{currentStep.mockup.sub}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E6F7F0] text-[#0E7C57] border border-[#0E7C57]/20 shrink-0">
                  {currentStep.mockup.badgeText}
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {currentStep.mockup.items.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                      item.isHighlight
                        ? 'bg-[#EBF7F5] border-[#087C80]/30 font-semibold text-[#07545A]'
                        : 'bg-[#F6F5ED] border-[#DCE7E3] text-[#102A35]'
                    }`}
                  >
                    <span className="text-[#52656B] font-medium">{item.label}</span>
                    <span className="font-semibold text-right max-w-[60%] truncate">{item.value}</span>
                  </div>
                ))}
              </div>

              {currentStep.mockup.footerNotice && (
                <div className="mt-4 pt-3 border-t border-[#DCE7E3] flex items-center gap-1.5 text-[11px] text-[#52656B]">
                  <Sparkles className="w-3.5 h-3.5 text-[#087C80]" />
                  <span>{currentStep.mockup.footerNotice}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 sm:px-8 py-4 border-t border-[#DCE7E3] bg-white flex items-center justify-between">
          {/* Step Pagination Dots */}
          <div className="flex items-center gap-2">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setStepIndex(idx)}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  stepIndex === idx ? 'w-8 bg-[#087C80]' : 'w-2.5 bg-[#DCE7E3] hover:bg-[#52656B]'
                }`}
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-[#DCE7E3] text-xs font-semibold text-[#102A35] hover:bg-[#F6F5ED] transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {stepIndex < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1 px-5 py-2 rounded-full bg-[#087C80] hover:bg-[#07545A] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1 px-5 py-2 rounded-full bg-[#0E7C57] hover:bg-[#0E7C57]/90 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <span>Complete Tour</span>
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


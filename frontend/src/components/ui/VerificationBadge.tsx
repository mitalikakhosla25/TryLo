import React from 'react';
import { ShieldCheck, ShieldAlert, Award, Star, CheckCircle2, Clock } from 'lucide-react';

interface StartupVerificationBadgeProps {
  status?: string | null;
  isVerified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const StartupVerificationBadge: React.FC<StartupVerificationBadgeProps> = ({
  status,
  isVerified,
  size = 'sm',
  showDetails = false,
}) => {
  const verified = isVerified || status === 'verified';

  if (verified) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full border border-[#0E7C57]/30 bg-[#E6F7F0] text-[#0E7C57] ${
          size === 'sm' ? 'text-[11px] px-2 py-0.5' : size === 'md' ? 'text-xs px-2.5 py-1' : 'text-sm px-3.5 py-1.5'
        }`}
        title="Verified Business: Legal Entity and Corporate Proof validated"
      >
        <ShieldCheck className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span>Verified Startup</span>
        {showDetails && <span className="text-[10px] opacity-75 font-normal">• Anti-Shell Validated</span>}
      </span>
    );
  }

  if (status === 'pending') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full border border-[#9A4200]/30 bg-[#FEF3C7] text-[#9A4200] ${
          size === 'sm' ? 'text-[11px] px-2 py-0.5' : size === 'md' ? 'text-xs px-2.5 py-1' : 'text-sm px-3.5 py-1.5'
        }`}
        title="Verification Proof Pending Review"
      >
        <Clock className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span>Verification Pending</span>
      </span>
    );
  }

  if (status === 'rejected') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full border border-[#B91C1C]/30 bg-[#FEE2E2] text-[#B91C1C] ${
          size === 'sm' ? 'text-[11px] px-2 py-0.5' : size === 'md' ? 'text-xs px-2.5 py-1' : 'text-sm px-3.5 py-1.5'
        }`}
        title="Business Verification Rejected"
      >
        <ShieldAlert className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span>Verification Rejected</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border border-[#DCE7E3] bg-[#EFEFE5] text-[#52656B] ${
        size === 'sm' ? 'text-[11px] px-2 py-0.5' : size === 'md' ? 'text-xs px-2.5 py-1' : 'text-sm px-3.5 py-1.5'
      }`}
      title="Unverified Entity"
    >
      <Clock className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      <span>Unverified Startup</span>
    </span>
  );
};

interface TesterTierBadgeProps {
  tier?: number | string;
  rating?: number | null;
  reviewsCount?: number | null;
  size?: 'sm' | 'md';
}

export const TesterTierBadge: React.FC<TesterTierBadgeProps> = ({
  tier = 1,
  rating,
  reviewsCount,
  size = 'sm',
}) => {
  const isTopTier =
    tier === 3 ||
    tier === 'platinum' ||
    tier === 'gold' ||
    (typeof tier === 'number' && tier >= 3);

  const isCertified = tier === 2 || tier === 'silver';

  if (isTopTier) {
    return (
      <div className="inline-flex items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-1 font-bold rounded-full border border-[#087C80]/30 bg-[#D7EFEB] text-[#07545A] ${
            size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
          }`}
          title="Top-Rated Vetted Tester: Multiple ratings and verified experience"
        >
          <Award className="w-3 h-3 text-[#087C80]" />
          <span>Tier 3: Top-Rated Vetted</span>
        </span>
        {rating !== undefined && rating !== null && rating > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#102A35]">
            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
            <span>{rating.toFixed(1)}</span>
            {reviewsCount !== undefined && reviewsCount !== null && (
              <span className="text-[#52656B] font-normal">({reviewsCount})</span>
            )}
          </span>
        )}
      </div>
    );
  }

  if (isCertified) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-semibold rounded-full border border-[#0E7C57]/30 bg-[#E6F7F0] text-[#0E7C57] ${
          size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
        }`}
        title="Certified Tester: Verified QA certification or verified resume portfolio"
      >
        <CheckCircle2 className="w-3 h-3 text-[#0E7C57]" />
        <span>Tier 2: Certified Tester</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full border border-[#DCE7E3] bg-[#EFEFE5] text-[#52656B] ${
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      }`}
      title="Basic Profile Completed"
    >
      <span>Tier 1: Basic Profile</span>
    </span>
  );
};


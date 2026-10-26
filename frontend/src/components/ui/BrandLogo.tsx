import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

export const BrandIcon: React.FC<{ className?: string }> = ({ className = 'h-7 w-7' }) => (
  <img
    src="/images/trylo-icon.png"
    alt="TryLo Logo"
    className={`${className} object-contain`}
  />
);

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showTagline = false,
  className = '',
}) => {
  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <Link
      to="/"
      className={`inline-flex items-center space-x-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087C80] rounded-xl p-1 transition-opacity hover:opacity-95 ${className}`}
      aria-label="TryLo Home"
    >
      <div className="shrink-0 transition-transform duration-200 group-hover:rotate-12">
        <BrandIcon className={iconSizes[size]} />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center space-x-2">
          <span className={`font-extrabold tracking-tight text-[#102A35] ${textSizes[size]}`}>
            TryLo
          </span>
        </div>
        {showTagline && (
          <span className="text-[11px] text-[#52656B] -mt-0.5 font-medium">
            Beta-Testing Marketplace
          </span>
        )}
      </div>
    </Link>
  );
};

import React from 'react';
import { PackageOpen } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      role="region"
      aria-label={title}
      className={`rounded-2xl border border-[#DCE7E3] bg-white p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-2xs ${className}`}
    >
      <div className="h-12 w-12 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#087C80]">
        {icon || <PackageOpen className="h-6 w-6" />}
      </div>

      <div className="space-y-1.5 max-w-md mx-auto">
        <h4 className="text-base sm:text-lg font-bold text-[#102A35]">{title}</h4>
        <p className="text-xs sm:text-sm text-[#52656B] leading-relaxed">{description}</p>
      </div>

      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};

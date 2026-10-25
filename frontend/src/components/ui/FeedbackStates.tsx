import React from 'react';
import { Loader2, AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading...',
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-7 w-7',
    lg: 'h-10 w-10',
  };

  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center p-8 space-y-3 ${className}`}
    >
      <Loader2
        className={`${sizeMap[size]} animate-spin text-[#087C80]`}
        aria-hidden="true"
      />
      {label && <p className="text-xs font-medium text-[#52656B]">{label}</p>}
      <span className="sr-only">{label}</span>
    </div>
  );
};

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-[#EFEFE5] rounded-xl ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
};

export type AlertBannerVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertBannerProps {
  variant?: AlertBannerVariant;
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

const alertConfig: Record<
  AlertBannerVariant,
  { container: string; text: string; title: string; icon: React.ReactNode }
> = {
  info: {
    container: 'bg-[#D7EFEB]/50 border-[#BCE1DA]',
    text: 'text-[#07545A]',
    title: 'text-[#07545A]',
    icon: <Info className="h-5 w-5 text-[#087C80] shrink-0" />,
  },
  success: {
    container: 'bg-[#E6F7F0] border-[#B6EDD5]',
    text: 'text-[#0E7C57]',
    title: 'text-[#0E7C57]',
    icon: <CheckCircle2 className="h-5 w-5 text-[#0E7C57] shrink-0" />,
  },
  warning: {
    container: 'bg-[#FEF3C7] border-[#FDE68A]',
    text: 'text-[#9A4200]',
    title: 'text-[#9A4200]',
    icon: <AlertTriangle className="h-5 w-5 text-[#9A4200] shrink-0" />,
  },
  error: {
    container: 'bg-[#FEE2E2] border-[#FECACA]',
    text: 'text-[#B91C1C]',
    title: 'text-[#B91C1C]',
    icon: <AlertCircle className="h-5 w-5 text-[#B91C1C] shrink-0" />,
  },
};

export const AlertBanner: React.FC<AlertBannerProps> = ({
  variant = 'info',
  title,
  children,
  action,
  className = '',
}) => {
  const config = alertConfig[variant];

  return (
    <div
      role="alert"
      className={`rounded-2xl border p-4 sm:p-4.5 flex items-start gap-3.5 ${config.container} ${className}`}
    >
      <div className="mt-0.5">{config.icon}</div>
      <div className="flex-1 space-y-1">
        {title && <h5 className={`text-xs sm:text-sm font-bold ${config.title}`}>{title}</h5>}
        <div className={`text-xs leading-relaxed ${config.text}`}>{children}</div>
      </div>
      {action && <div className="shrink-0 pt-0.5">{action}</div>}
    </div>
  );
};

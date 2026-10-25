import React from 'react';

export type BadgeVariant =
  | 'teal'
  | 'aqua'
  | 'slate'
  | 'success'
  | 'warning'
  | 'danger'
  | 'dark';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, { badge: string; dot: string }> = {
  teal: {
    badge: 'bg-[#087C80] text-white border-transparent',
    dot: 'bg-white',
  },
  aqua: {
    badge: 'bg-[#D7EFEB] text-[#07545A] border-[#BCE1DA]',
    dot: 'bg-[#087C80]',
  },
  slate: {
    badge: 'bg-[#EFEFE5] text-[#52656B] border-[#DCE7E3]',
    dot: 'bg-[#52656B]',
  },
  success: {
    badge: 'bg-[#E6F7F0] text-[#0E7C57] border-[#B6EDD5]',
    dot: 'bg-[#0E7C57]',
  },
  warning: {
    badge: 'bg-[#FEF3C7] text-[#9A4200] border-[#FDE68A]',
    dot: 'bg-[#9A4200]',
  },
  danger: {
    badge: 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]',
    dot: 'bg-[#B91C1C]',
  },
  dark: {
    badge: 'bg-[#102A35] text-white border-transparent',
    dot: 'bg-[#D7EFEB]',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[10px] font-semibold px-2 py-0.5 rounded-full gap-1',
  md: 'text-xs font-semibold px-2.5 py-1 rounded-full gap-1.5',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'aqua',
  size = 'sm',
  dot = false,
  className = '',
  ...props
}) => {
  const styles = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center font-medium border ${styles.badge} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${styles.dot}`} />}
      <span>{children}</span>
    </span>
  );
};

import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#087C80] hover:bg-[#07545A] text-white shadow-sm hover:shadow-md hover:shadow-[#087C80]/15 active:scale-[0.99] border border-transparent',
  secondary:
    'bg-[#D7EFEB] hover:bg-[#C5E8E2] text-[#07545A] font-semibold active:scale-[0.99] border border-[#BCE1DA]',
  outline:
    'bg-white hover:bg-[#F6F5ED] text-[#102A35] border border-[#DCE7E3] hover:border-[#087C80] shadow-2xs active:scale-[0.99]',
  ghost:
    'bg-transparent hover:bg-[#D7EFEB]/40 text-[#102A35] hover:text-[#07545A] border border-transparent',
  danger:
    'bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-sm active:scale-[0.99] border border-transparent',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5 h-8.5',
  md: 'text-xs sm:text-sm px-4 py-2.5 rounded-xl gap-2 h-10.5',
  lg: 'text-sm sm:text-base px-6 py-3.5 rounded-xl gap-2.5 h-12.5 font-semibold',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      className = '',
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={`inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087C80] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...rest}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

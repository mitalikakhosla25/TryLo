import React from 'react';
import { Badge } from './Badge';

export interface SectionHeadingProps {
  badge?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: 'left' | 'center';
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  badge,
  title,
  subtitle,
  align = 'left',
  action,
  className = '',
}) => {
  const isCenter = align === 'center';

  return (
    <div
      className={`flex flex-col sm:flex-row ${
        isCenter ? 'sm:items-center sm:justify-center text-center' : 'sm:items-end sm:justify-between'
      } gap-4 pb-4 ${className}`}
    >
      <div className={`space-y-2 max-w-3xl ${isCenter ? 'mx-auto' : ''}`}>
        {badge && (
          <div className={isCenter ? 'flex justify-center' : ''}>
            <Badge variant="aqua" size="md">
              {badge}
            </Badge>
          </div>
        )}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#102A35] tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm sm:text-base text-[#52656B] leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {action && !isCenter && <div className="shrink-0 pt-2 sm:pt-0">{action}</div>}
    </div>
  );
};

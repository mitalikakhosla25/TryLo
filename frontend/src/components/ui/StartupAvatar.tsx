import React, { useState } from 'react';

export interface StartupAvatarProps {
  name: string;
  logoUrl?: string | null;
  category?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'fill';
  className?: string;
  shape?: 'rounded' | 'circle' | 'square';
}

/**
 * Derives clean, professional 1-2 letter initials from startup name.
 * Examples:
 *   "Girlyio" -> "G"
 *   "FemmeCare Health" -> "FH"
 *   "StudyGenie" -> "SG"
 *   "AutoMitra" -> "AM"
 *   "Aurora" -> "A"
 */
export function getStartupInitials(name: string): string {
  if (!name || !name.trim()) return 'TL';
  const clean = name.trim();
  const words = clean.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  // If camelCase or PascalCase like "StudyGenie", "AutoMitra", "FinMate"
  const camelMatches = clean.match(/[A-Z][a-z]+/g);
  if (camelMatches && camelMatches.length >= 2) {
    return (camelMatches[0][0] + camelMatches[1][0]).toUpperCase();
  }
  // Single word: use first letter or first two letters
  return clean.length >= 2 ? clean.slice(0, 2).toUpperCase() : clean.toUpperCase();
}

/**
 * Harmonious, premium gradient palettes aligned with TryLo's aesthetic.
 */
const MONOGRAM_PALETTES = [
  {
    bg: 'bg-gradient-to-br from-[#07545A] via-[#087C80] to-[#0A8E94]',
    border: 'border-[#BCE1DA]/80',
    text: 'text-white',
  },
  {
    bg: 'bg-gradient-to-br from-[#BE185D] via-[#DB2777] to-[#F43F5E]', // Rose/Pink (great for Girlyio / Women Health)
    border: 'border-rose-200/60',
    text: 'text-white',
  },
  {
    bg: 'bg-gradient-to-br from-[#4338CA] via-[#6366F1] to-[#818CF8]', // Indigo
    border: 'border-indigo-200/60',
    text: 'text-white',
  },
  {
    bg: 'bg-gradient-to-br from-[#C2410C] via-[#EA580C] to-[#FB923C]', // Amber / Sunset
    border: 'border-orange-200/60',
    text: 'text-white',
  },
  {
    bg: 'bg-gradient-to-br from-[#047857] via-[#059669] to-[#10B981]', // Emerald
    border: 'border-emerald-200/60',
    text: 'text-white',
  },
  {
    bg: 'bg-gradient-to-br from-[#0284C7] via-[#0EA5E9] to-[#38BDF8]', // Sky
    border: 'border-sky-200/60',
    text: 'text-white',
  },
  {
    bg: 'bg-gradient-to-br from-[#6D28D9] via-[#7C3AED] to-[#A78BFA]', // Purple
    border: 'border-purple-200/60',
    text: 'text-white',
  },
];

export function getMonogramPalette(name: string) {
  if (!name) return MONOGRAM_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % MONOGRAM_PALETTES.length;
  return MONOGRAM_PALETTES[idx];
}

export const StartupAvatar: React.FC<StartupAvatarProps> = ({
  name,
  logoUrl,
  category,
  size = 'md',
  className = '',
  shape = 'rounded',
}) => {
  const [imgError, setImgError] = useState(false);
  const initials = getStartupInitials(name);
  const palette = getMonogramPalette(name);

  const isUrlValid = Boolean(
    logoUrl &&
    logoUrl.trim() &&
    !logoUrl.includes('phototourl.com') &&
    !logoUrl.includes('example.com') &&
    !imgError
  );

  const sizeClasses = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base sm:text-lg',
    xl: 'h-20 w-20 text-2xl',
    fill: 'w-full h-full aspect-square text-base sm:text-lg',
  };

  const shapeClasses = {
    rounded: 'rounded-xl',
    circle: 'rounded-full',
    square: 'rounded-lg',
  };

  if (isUrlValid) {
    return (
      <div
        className={`relative overflow-hidden bg-white border border-[#DCE7E3] shrink-0 flex items-center justify-center ${shapeClasses[shape]} ${sizeClasses[size]} ${className}`}
      >
        <img
          src={logoUrl!}
          alt={`${name} logo`}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Render High-Assurance Stylized Alphabet Monogram
  return (
    <div
      className={`relative overflow-hidden shrink-0 flex items-center justify-center select-none shadow-xs border ${palette.border} ${palette.bg} ${shapeClasses[shape]} ${sizeClasses[size]} ${className}`}
      aria-label={`${name} avatar`}
    >
      {/* Decorative ambient glass highlights */}
      <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white/25 blur-xs pointer-events-none" />
      <div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-black/10 pointer-events-none" />

      {/* Bold Monogram Letter(s) */}
      <span className="relative z-10 font-black tracking-wider text-white drop-shadow-xs">
        {initials}
      </span>

      {/* Micro category indicator on larger cards */}
      {category && (size === 'lg' || size === 'xl' || size === 'fill') && (
        <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded text-[7px] font-bold bg-black/25 text-white/95 uppercase tracking-wider backdrop-blur-2xs">
          {category.slice(0, 3)}
        </span>
      )}
    </div>
  );
};

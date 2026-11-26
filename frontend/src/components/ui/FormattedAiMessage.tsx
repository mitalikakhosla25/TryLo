import React from 'react';

interface FormattedAiMessageProps {
  content: string;
  className?: string;
}

/**
 * Parses markdown-formatted AI responses into clean, beautiful, human-readable UI.
 * Eliminates all raw markdown symbols (#, ##, ###, *, **, ---) and renders
 * structured headings, styled bullet lists, badges, and clean typography.
 */
export const FormattedAiMessage: React.FC<FormattedAiMessageProps> = ({
  content,
  className = '',
}) => {
  if (!content) return null;

  // Helper to parse inline markdown: **bold**, *italic*, `code`
  const renderInline = (text: string): React.ReactNode[] => {
    // Regex splits on `code`, **bold**, or *italic*
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 mx-0.5 rounded-md bg-[#EDF7F6] text-[#07545A] font-semibold text-[11px] font-mono border border-[#C5ECE4]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={idx} className="font-bold text-[#102A35]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return (
          <em key={idx} className="italic text-[#475569]">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    const raw = line.trim();

    if (!raw) {
      elements.push(<div key={`spacer-${lineIdx}`} className="h-1.5" />);
      return;
    }

    // Horizontal Dividers (--- or ***)
    if (raw === '---' || raw === '***' || raw === '___') {
      elements.push(
        <hr key={`hr-${lineIdx}`} className="my-2.5 border-t border-[#E5E7EB]" />
      );
      return;
    }

    // Level 1 Header (# Title)
    if (raw.startsWith('# ')) {
      const title = raw.replace(/^#\s+/, '').replace(/\*\*/g, '');
      elements.push(
        <h3
          key={`h1-${lineIdx}`}
          className="text-sm font-extrabold text-[#102A35] mt-2.5 mb-1.5 pb-1 border-b border-[#E5E7EB]"
        >
          {title}
        </h3>
      );
      return;
    }

    // Level 2 Header (## Subtitle)
    if (raw.startsWith('## ')) {
      const title = raw.replace(/^##\s+/, '').replace(/\*\*/g, '');
      elements.push(
        <h4
          key={`h2-${lineIdx}`}
          className="text-xs font-bold text-[#07545A] mt-2.5 mb-1 uppercase tracking-wide"
        >
          {title}
        </h4>
      );
      return;
    }

    // Level 3+ Header (### Section)
    if (raw.startsWith('### ') || raw.startsWith('#### ')) {
      const title = raw.replace(/^#+\s+/, '').replace(/\*\*/g, '');
      elements.push(
        <h5
          key={`h3-${lineIdx}`}
          className="text-xs font-bold text-[#102A35] mt-2 mb-1 flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#087C80]" />
          <span>{title}</span>
        </h5>
      );
      return;
    }

    // Bullet points (* , - , • )
    const bulletMatch = line.match(/^(\s*)([\*\-\•])\s+(.*)$/);
    if (bulletMatch) {
      const indentSpaces = bulletMatch[1].length;
      const bulletContent = bulletMatch[3];
      const isSubBullet = indentSpaces >= 2;

      elements.push(
        <div
          key={`bullet-${lineIdx}`}
          className={`flex items-start gap-2 my-1 leading-relaxed ${
            isSubBullet ? 'pl-5 text-[11px] text-[#475569]' : 'pl-1 text-xs text-[#1E293B]'
          }`}
        >
          <span
            className={`font-bold shrink-0 mt-0.5 ${
              isSubBullet ? 'text-[#64748B] text-[10px]' : 'text-[#07545A] text-xs'
            }`}
          >
            {isSubBullet ? '◦' : '•'}
          </span>
          <span className="flex-1">{renderInline(bulletContent)}</span>
        </div>
      );
      return;
    }

    // Normal paragraph
    elements.push(
      <p key={`p-${lineIdx}`} className="text-xs text-[#1E293B] leading-relaxed my-0.5">
        {renderInline(raw)}
      </p>
    );
  });

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
};

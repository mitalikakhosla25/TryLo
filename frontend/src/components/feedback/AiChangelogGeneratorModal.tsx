import React, { useState } from 'react';
import {
  FileText,
  X,
  Copy,
  Check,
  Loader2,
  Sparkles,
  GitBranch,
  Share2,
  Rocket,
} from 'lucide-react';
import { useGenerateReleaseChangelog } from '../../context/useFeedback';
import type { ChangelogGenerateResponse } from '../../api/feedback';

interface AiChangelogGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId?: string;
  campaignTitle?: string;
}

export const AiChangelogGeneratorModal: React.FC<AiChangelogGeneratorModalProps> = ({
  isOpen,
  onClose,
  campaignId,
  campaignTitle,
}) => {
  const { mutateAsync: generateChangelog, isPending } = useGenerateReleaseChangelog();
  const [versionTag, setVersionTag] = useState('v1.2.0');
  const [activeTab, setActiveTab] = useState<'github' | 'twitter' | 'product_hunt'>('github');
  const [changelog, setChangelog] = useState<ChangelogGenerateResponse | null>(null);
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setErrorMsg(null);
    try {
      const res = await generateChangelog({
        campaign_id: campaignId || null,
        version_tag: versionTag.trim() || 'v1.2.0',
      });
      setChangelog(res);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setErrorMsg(errObj.message || 'Failed to generate release notes.');
    }
  };

  const handleCopy = (text: string, tabName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabName);
    setTimeout(() => setCopiedTab(null), 2500);
  };

  const currentContent = () => {
    if (!changelog) return '';
    if (activeTab === 'github') return changelog.github_markdown;
    if (activeTab === 'twitter') return changelog.twitter_thread;
    return changelog.product_hunt_blurb;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#DCE7E3] rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#DCE7E3]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#07545A] text-white">
              <FileText className="h-5 w-5 text-[#7DE3DA]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-[#102A35]">
                  AI Release Notes &amp; Changelog Generator
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#D7EFEB] text-[#07545A]">
                  Multi-Channel
                </span>
              </div>
              <p className="text-xs text-[#52656B]">
                Synthesizes verified fixes across {campaignTitle ? `"${campaignTitle}"` : 'your campaign'} into public release notes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#52656B] hover:bg-[#EFEFE5] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Configuration Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#DCE7E3]">
          <div className="flex items-center space-x-2">
            <label htmlFor="versionTagInput" className="text-xs font-bold text-[#102A35] shrink-0">
              Release Version:
            </label>
            <input
              id="versionTagInput"
              type="text"
              value={versionTag}
              onChange={(e) => setVersionTag(e.target.value)}
              placeholder="e.g. v1.2.0"
              className="text-xs font-mono font-bold px-3 py-1.5 bg-white border border-[#DCE7E3] rounded-lg text-[#102A35] w-28 focus:outline-none focus:border-[#087C80]"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isPending}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#07545A] hover:bg-[#087C80] text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Synthesizing Release Notes...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-[#7DE3DA]" />
                <span>{changelog ? 'Regenerate Notes' : 'Generate Notes with AI'}</span>
              </>
            )}
          </button>
        </div>

        {/* Tab Selection */}
        {changelog && (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#DCE7E3] pb-2">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('github')}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'github'
                      ? 'bg-[#102A35] text-white shadow-xs'
                      : 'text-[#52656B] hover:text-[#102A35]'
                  }`}
                >
                  <GitBranch className="h-3.5 w-3.5" />
                  <span>GitHub Releases</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('twitter')}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'twitter'
                      ? 'bg-[#102A35] text-white shadow-xs'
                      : 'text-[#52656B] hover:text-[#102A35]'
                  }`}
                >
                  <Share2 className="h-3.5 w-3.5 text-sky-400" />
                  <span>Twitter / X</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('product_hunt')}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'product_hunt'
                      ? 'bg-[#102A35] text-white shadow-xs'
                      : 'text-[#52656B] hover:text-[#102A35]'
                  }`}
                >
                  <Rocket className="h-3.5 w-3.5 text-orange-400" />
                  <span>Product Hunt</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(currentContent(), activeTab)}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#D7EFEB] hover:bg-[#BCE1DA] text-[#07545A] border border-[#BCE1DA] transition-all cursor-pointer"
              >
                {copiedTab === activeTab ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>

            {/* Content Display */}
            <div className="relative">
              <pre className="text-xs font-mono bg-[#FAF9F5] p-4 rounded-2xl border border-[#DCE7E3] text-[#102A35] whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed">
                {currentContent()}
              </pre>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#52656B] pt-1">
              <span>Engine: <strong className="text-[#102A35]">{changelog.engine_used}</strong></span>
              <span>{changelog.total_items_synthesized} verified items included</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-[#DCE7E3] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-semibold bg-[#EFEFE5] hover:bg-[#DCE7E3] text-[#102A35] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

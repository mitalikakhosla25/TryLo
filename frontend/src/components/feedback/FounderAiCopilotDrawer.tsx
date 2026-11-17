/**
 * TryLo Founder AI Co-Pilot Drawer
 * Interactive slide-over assistant answering natural language founder questions
 * synthesized across all campaign feedback submissions and video logs.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { useQueryAiCopilot, useAiEngineStatus } from '../../context/useFeedback';
import type { AiCopilotQueryResponse } from '../../api/feedback';

interface Message {
  id: string;
  sender: 'founder' | 'ai';
  text: string;
  responsePayload?: AiCopilotQueryResponse;
}

interface FounderAiCopilotDrawerProps {
  campaignId?: string;
  campaignTitle?: string;
}

const QUICK_PROMPTS = [
  'What is the #1 blocker right now?',
  'Are we ready for release?',
  'What are testers saying about the checkout flow?',
  'Show financial and churn risk breakdown',
  'Summarize tester feedback on navigation and UX',
];

export const FounderAiCopilotDrawer: React.FC<FounderAiCopilotDrawerProps> = ({
  campaignId,
  campaignTitle,
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello Founder! I am your TryLo AI Co-Pilot. I continuously synthesize every bug report, usability review, and video recording across ${
        campaignTitle ? `"${campaignTitle}"` : 'your campaigns'
      }. Ask me anything about tester friction, root causes, or release readiness.`,
    },
  ]);

  const { mutateAsync: queryCopilot, isPending } = useQueryAiCopilot();
  const { data: engineStatus } = useAiEngineStatus();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || isPending) return;

    const userMsgId = String(Date.now());
    const newMsg: Message = { id: userMsgId, sender: 'founder', text: q };
    setMessages((prev) => [...prev, newMsg]);
    setInputQuery('');

    try {
      const res = await queryCopilot({
        query: q,
        campaign_id: campaignId || null,
      });

      const aiMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: res.answer_markdown,
        responsePayload: res,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      const errorMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text:
          err instanceof Error
            ? `I encountered an issue connecting to the AI Co-Pilot: ${err.message}`
            : 'Unable to process query. Please verify backend connection.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'ai',
        text: 'Conversation reset. What would you like to investigate across your tester feedback?',
      },
    ]);
  };

  return (
    <>
      {/* Floating Co-Pilot Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative inline-flex items-center space-x-2.5 px-5 py-3 rounded-full font-bold text-xs bg-[#07545A] hover:bg-[#087C80] text-white shadow-xl hover:shadow-2xl transition-all cursor-pointer border border-[#168B98]"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <Sparkles className="h-4 w-4 text-[#7DE3DA] group-hover:rotate-12 transition-transform" />
          <span className="tracking-wide">Ask TryLo AI</span>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#102A35] text-[#7DE3DA] border border-[#168B98]">
            Co-Pilot
          </span>
        </button>
      </div>

      {/* Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-over Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="px-6 py-4.5 border-b border-[#DCE7E3] bg-[#FAF9F5] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#07545A] text-white shadow-xs">
              <Sparkles className="h-5 w-5 text-[#7DE3DA]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-extrabold text-[#102A35]">TryLo AI Co-Pilot</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    engineStatus?.is_live_llm
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : 'bg-[#D7EFEB] text-[#07545A]'
                  }`}
                  title={engineStatus?.notice}
                >
                  {engineStatus?.is_live_llm ? 'Gemini 1.5 Flash' : 'Free Local Engine'}
                </span>
              </div>
              <p className="text-[11px] text-[#52656B]">
                {campaignTitle ? `Scoped to "${campaignTitle}"` : 'Synthesizing all active campaign data'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={handleClearHistory}
              title="Reset Conversation"
              className="p-2 rounded-xl text-[#52656B] hover:text-[#102A35] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl text-[#52656B] hover:text-[#102A35] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#FCFBFA]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'founder' ? 'items-end' : 'items-start'}`}
            >
              {msg.sender === 'founder' ? (
                <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-[#07545A] text-white px-4 py-3 text-xs leading-relaxed shadow-sm font-medium">
                  {msg.text}
                </div>
              ) : (
                <div className="max-w-[95%] space-y-3">
                  {/* AI Response Bubble */}
                  <div className="rounded-2xl rounded-tl-xs bg-white border border-[#DCE7E3] p-4 text-xs text-[#102A35] leading-relaxed shadow-xs space-y-3">
                    <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-[#07545A]">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>TryLo AI Intelligence</span>
                    </div>

                    <div className="whitespace-pre-wrap font-sans text-xs text-[#102A35] space-y-2">
                      {msg.text}
                    </div>

                    {/* Key Takeaways */}
                    {msg.responsePayload && msg.responsePayload.key_takeaways.length > 0 && (
                      <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#EBEBEB] space-y-1.5 mt-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#102A35] block">
                          Executive Takeaways
                        </span>
                        <ul className="space-y-1 text-[11px] text-[#334155]">
                          {msg.responsePayload.key_takeaways.map((takeaway, idx) => (
                            <li key={idx} className="flex items-start space-x-1.5">
                              <span className="text-emerald-600 font-bold">•</span>
                              <span>{takeaway}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Referenced Submissions */}
                    {msg.responsePayload && msg.responsePayload.referenced_feedbacks.length > 0 && (
                      <div className="pt-2 border-t border-[#F0F0F0] space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#52656B] block">
                          Referenced Tester Evidence ({msg.responsePayload.referenced_feedbacks.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.responsePayload.referenced_feedbacks.map((ref) => (
                            <button
                              key={ref.id}
                              type="button"
                              onClick={() => {
                                setIsOpen(false);
                                navigate(`/founder/feedback/${ref.id}`);
                              }}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#102A35] border border-[#E5E7EB] transition-colors cursor-pointer"
                            >
                              <span className="max-w-[130px] truncate">{ref.title}</span>
                              <ExternalLink className="h-2.5 w-2.5 text-[#52656B]" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Suggested Followups */}
                  {msg.responsePayload && msg.responsePayload.suggested_followups.length > 0 && (
                    <div className="space-y-1.5 pl-1">
                      <span className="text-[10px] font-bold text-[#52656B] flex items-center gap-1">
                        <HelpCircle className="h-3 w-3" />
                        <span>Suggested Follow-ups</span>
                      </span>
                      <div className="flex flex-col gap-1">
                        {msg.responsePayload.suggested_followups.map((followup, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSend(followup)}
                            className="text-left px-3 py-1.5 rounded-xl text-xs text-[#07545A] font-semibold bg-[#E8F6F4] hover:bg-[#D7EFEB] border border-[#C5ECE4] transition-colors cursor-pointer flex items-center justify-between group"
                          >
                            <span>{followup}</span>
                            <ArrowRight className="h-3 w-3 text-[#07545A] opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {isPending && (
            <div className="flex items-center space-x-2 text-xs text-[#52656B] p-3 rounded-2xl bg-white border border-[#DCE7E3] w-fit shadow-xs">
              <Loader2 className="h-4 w-4 animate-spin text-[#07545A]" />
              <span>Analyzing reports, clustering patterns &amp; compiling synthesis...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {messages.length === 1 && (
          <div className="px-6 py-2.5 bg-[#FAF9F5] border-t border-[#DCE7E3] space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#52656B]">
              Quick Inquiries
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white hover:bg-slate-100 text-[#102A35] border border-[#DCE7E3] transition-colors cursor-pointer shadow-2xs"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-[#DCE7E3] bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything about tester feedback, blockers, or release..."
              disabled={isPending}
              className="flex-1 px-4 py-2.5 text-xs rounded-full border border-[#DCE7E3] focus:outline-hidden focus:ring-2 focus:ring-[#07545A] bg-[#FAFAFA]"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isPending}
              className="p-2.5 rounded-full bg-[#07545A] hover:bg-[#087C80] text-white disabled:opacity-50 transition-colors cursor-pointer shadow-xs shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="text-[10px] text-center text-[#52656B] mt-2">
            Synthesized live from tester submissions, bug reports, and video timestamps.
          </p>
        </div>
      </div>
    </>
  );
};

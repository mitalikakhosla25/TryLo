import React, { useState } from 'react';
import {
  Sparkles,
  Code2,
  Sliders,
  Users,
  Video,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AiSuperIntelligenceShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'playwright' | 'patch' | 'simulator' | 'synthetic'>('playwright');
  const [copied, setCopied] = useState(false);

  const samplePlaywrightCode = `import { test, expect } from '@playwright/test';

// Autonomous E2E Test synthesized from Tester Screen Recording
test('Reproduce Checkout Modal Crash on Payment Confirmation', async ({ page }) => {
  await page.goto('https://app.trylo.io/checkout');
  
  // Step 1: Fill test customer billing details
  await page.fill('#card-number', '4242424242424242');
  await page.fill('#card-exp', '12/28');
  await page.fill('#card-cvc', '123');
  
  // Step 2: Trigger payment submission
  await page.click('button:has-text("Complete Purchase")');
  
  // Step 3: Assert spinner handles response without unhandled promise rejection
  const modal = page.locator('#payment-modal');
  await expect(modal).not.toHaveClass(/error-500/);
  await expect(page).toHaveURL(/.*\\/order-confirmed/);
});`;

  const sampleGitPatch = `diff --git a/frontend/src/components/CheckoutModal.tsx b/frontend/src/components/CheckoutModal.tsx
--- a/frontend/src/components/CheckoutModal.tsx
+++ b/frontend/src/components/CheckoutModal.tsx
@@ -42,6 +42,9 @@ export const CheckoutModal = () => {
+  // Fix: Prevent race condition and double-submit during payment confirmation
+  if (isSubmitting) return;
+  setIsSubmitting(true);
   try {
     const res = await api.processPayment(paymentDetails);
     navigate('/order-confirmed');`;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative py-8 sm:py-12" id="ai-intelligence">
      <div className="space-y-12">
        {/* Section Heading */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-purple-100 to-emerald-100 border border-purple-200 text-purple-900 text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5 text-purple-600" />
            <span>TryLo Super-Intelligence Suite</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-[#102A35] tracking-tight leading-tight">
            Stop Chasing Vague Bugs. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#07545A] via-[#087C80] to-emerald-600">
              Turn Tester Proof into Code in Seconds.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-[#52656B] leading-relaxed">
            Most beta testing tools are static feedback forms. TryLo combines multimodal video transcription, predictive launch revenue simulation, and autonomous Playwright E2E script synthesis.
          </p>
        </div>

        {/* 4 Feature Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1 */}
          <div className="p-6 rounded-3xl bg-white border border-[#DCE7E3] hover:border-[#087C80] hover:shadow-lg transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <Code2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-[#102A35]">Autonomous E2E Scripts</h3>
            <p className="text-xs text-[#52656B] leading-relaxed">
              Instantly converts user bug reports and repro steps into ready-to-run Playwright &amp; Cypress `.spec.ts` files.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-3xl bg-white border border-[#DCE7E3] hover:border-[#087C80] hover:shadow-lg transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Sliders className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-[#102A35]">Launch &amp; ROI Simulator</h3>
            <p className="text-xs text-[#52656B] leading-relaxed">
              Interactive "What-If" modeling calculates protected MRR and churn reduction before public traffic onboarding.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-3xl bg-white border border-[#DCE7E3] hover:border-[#087C80] hover:shadow-lg transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-[#102A35]">Synthetic AI Personas</h3>
            <p className="text-xs text-[#52656B] leading-relaxed">
              Simulate 3 diverse human tester archetypes (Novice, Power User, Accessibility Specialist) in 10 seconds flat.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-3xl bg-white border border-[#DCE7E3] hover:border-[#087C80] hover:shadow-lg transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
              <Video className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-[#102A35]">Video Frustration Heatmap</h3>
            <p className="text-xs text-[#52656B] leading-relaxed">
              Multimodal audio &amp; speech dialogue tracking maps tester emotional spikes directly onto the video player seek bar.
            </p>
          </div>
        </div>

        {/* Interactive Live Demo Preview Box */}
        <div className="rounded-3xl border border-[#DCE7E3] bg-gradient-to-br from-[#102A35] via-[#0D232C] to-[#07545A] p-6 sm:p-10 text-white shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-[#087C80] text-white">
                <Sparkles className="h-5 w-5 text-[#7DE3DA]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">TryLo Autonomous Intelligence Engine</h3>
                <p className="text-xs text-[#7DE3DA]">Live Preview: Automated Artifacts Generated in Real Time</p>
              </div>
            </div>

            {/* Tab Controls */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-black/30 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('playwright')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === 'playwright' ? 'bg-[#087C80] text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                Playwright Test
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('patch')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === 'patch' ? 'bg-[#087C80] text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                Git Diff Hotfix
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('simulator')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === 'simulator' ? 'bg-[#087C80] text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                ROI Modeling
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('synthetic')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === 'synthetic' ? 'bg-[#087C80] text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                Synthetic Personas
              </button>
            </div>
          </div>

          {/* Tab 1: Playwright Test */}
          {activeTab === 'playwright' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs text-gray-300">
                <span className="font-mono text-emerald-400">reproduce_checkout_crash.spec.ts</span>
                <button
                  type="button"
                  onClick={() => handleCopy(samplePlaywrightCode)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer transition-all"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Test'}</span>
                </button>
              </div>
              <pre className="text-xs font-mono bg-black/40 p-4 rounded-2xl border border-white/10 text-emerald-300 overflow-x-auto leading-relaxed">
                {samplePlaywrightCode}
              </pre>
            </div>
          )}

          {/* Tab 2: Git Diff */}
          {activeTab === 'patch' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs text-gray-300">
                <span className="font-mono text-[#7DE3DA]">hotfix_race_condition.patch</span>
                <button
                  type="button"
                  onClick={() => handleCopy(sampleGitPatch)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer transition-all"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Patch'}</span>
                </button>
              </div>
              <pre className="text-xs font-mono bg-black/40 p-4 rounded-2xl border border-white/10 text-[#7DE3DA] overflow-x-auto leading-relaxed">
                {sampleGitPatch}
              </pre>
            </div>
          )}

          {/* Tab 3: Simulator */}
          {activeTab === 'simulator' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-1">
                <span className="text-[10px] font-black uppercase text-[#7DE3DA]">Predicted Readiness</span>
                <div className="text-2xl font-black text-white flex items-center space-x-2">
                  <span>92/100</span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                    <TrendingUp className="h-3 w-3 inline mr-1" />+44 pts
                  </span>
                </div>
                <p className="text-[11px] text-gray-300">Readiness jumps from 48% to 92% after 2 critical fixes.</p>
              </div>

              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-1">
                <span className="text-[10px] font-black uppercase text-[#7DE3DA]">Protected MRR</span>
                <div className="text-2xl font-black text-emerald-400 flex items-center space-x-1">
                  <DollarSign className="h-6 w-6" />
                  <span>$6,400/mo</span>
                </div>
                <p className="text-[11px] text-gray-300">Prevents drop-off during primary checkout onboarding.</p>
              </div>

              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-1">
                <span className="text-[10px] font-black uppercase text-[#7DE3DA]">Projected Churn</span>
                <div className="text-2xl font-black text-purple-300 flex items-center space-x-2">
                  <span>14%</span>
                  <span className="text-xs font-bold text-purple-200 bg-purple-950 px-2 py-0.5 rounded-full border border-purple-800">
                    <Zap className="h-3 w-3 inline mr-1" />-50% drop
                  </span>
                </div>
                <p className="text-[11px] text-gray-300">Stabilizes user retention across beta cohort.</p>
              </div>
            </div>
          )}

          {/* Tab 4: Synthetic Personas */}
          {activeTab === 'synthetic' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Jordan (First-Timer)</span>
                  <span className="text-xs font-black text-[#7DE3DA]">82/100</span>
                </div>
                <p className="text-[11px] text-gray-300">"Clear CTA, but onboarding guide dismiss button has double-tap glitch on iPad."</p>
              </div>

              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Alex (Power User)</span>
                  <span className="text-xs font-black text-amber-400">74/100</span>
                </div>
                <p className="text-[11px] text-gray-300">"Rapid double-click on payment fires 2 POST requests. Needs client debounce."</p>
              </div>

              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Morgan (A11y Auditor)</span>
                  <span className="text-xs font-black text-purple-300">80/100</span>
                </div>
                <p className="text-[11px] text-gray-300">"Touch targets are solid (&gt;44px). Table columns need horizontal scroll indicator on 375px."</p>
              </div>
            </div>
          )}

          {/* Bottom Call to Action */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-xs text-gray-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Zero external subscriptions required &bull; Free tier Google Gemini or offline local intelligence</span>
            </div>

            <Link
              to="/register?role=founder"
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-full text-xs font-bold bg-[#7DE3DA] hover:bg-white text-[#102A35] shadow-lg transition-all cursor-pointer self-start sm:self-auto"
            >
              <span>Launch Beta with TryLo AI</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

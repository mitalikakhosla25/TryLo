import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
} from 'lucide-react';
import { Container } from '../ui/Container';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface WorkflowStep {
  step: string;
  title: string;
  description: string;
  highlight: string;
}

interface HowItWorksSectionProps {
  activeJourney?: 'founders' | 'testers';
  onJourneyChange?: (journey: 'founders' | 'testers') => void;
}

const FOUNDER_STEPS: WorkflowStep[] = [
  {
    step: '01',
    title: 'Create Your Startup',
    description:
      'Set up your company profile, choose your geographic hub across India, and define your company stage and target audience.',
    highlight: 'Venture Setup',
  },
  {
    step: '02',
    title: 'Launch a Testing Campaign',
    description:
      'Define step-by-step test scenarios, acceptance criteria, application deadlines, screening questions, and any rewards or perks.',
    highlight: 'Task Architecture',
  },
  {
    step: '03',
    title: 'Review Applications',
    description:
      'Screen applicant profiles, hardware configurations, and question responses to accept verified testers matched to your product.',
    highlight: 'Tester Screening',
  },
  {
    step: '04',
    title: 'Resolve Issues With Real Feedback',
    description:
      'Triage standardized bug reports with reproduction steps, communicate directly with testers, verify retests, and ship with certainty.',
    highlight: 'Closed-Loop Verification',
  },
];

const TESTER_STEPS: WorkflowStep[] = [
  {
    step: '01',
    title: 'Explore Open Campaigns',
    description:
      'Browse live testing campaigns filtered by category, operating system, and reward type to find software you are eager to test.',
    highlight: 'Venture Discovery',
  },
  {
    step: '02',
    title: 'Apply to Test Products',
    description:
      'Submit your application highlighting your device setups, testing background, and answers to the founder’s screening questions.',
    highlight: 'One-Click Apply',
  },
  {
    step: '03',
    title: 'Complete Guided Tasks',
    description:
      'Execute the structured testing journey, explore new workflows, and test real-world scenarios on your own devices.',
    highlight: 'Hands-On Testing',
  },
  {
    step: '04',
    title: 'Submit Feedback & Retest',
    description:
      'File structured bug reports with reproducible steps, share UX insights, and re-verify fixes when founders update their product.',
    highlight: 'Actionable Signal',
  },
];

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({
  activeJourney: controlledJourney,
  onJourneyChange,
}) => {
  const [internalJourney, setInternalJourney] = useState<'founders' | 'testers'>('founders');
  const activeJourney = controlledJourney !== undefined ? controlledJourney : internalJourney;

  const handleSelectJourney = (journey: 'founders' | 'testers') => {
    setInternalJourney(journey);
    if (onJourneyChange) {
      onJourneyChange(journey);
    }
  };

  const steps = activeJourney === 'founders' ? FOUNDER_STEPS : TESTER_STEPS;

  return (
    <section className="relative overflow-hidden scroll-mt-24 sm:scroll-mt-28 py-6 sm:py-10" id="how-it-works">
      <Container size="xl" className="space-y-12">
        {/* Header & Toggle */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#102A35] tracking-tight">
            How TryLo Works
          </h2>

          <p className="text-sm sm:text-base text-[#52656B] leading-relaxed">
            A transparent, collaborative testing cycle built for product precision and high-signal feedback.
          </p>

          {/* Dual Journey Pill Switcher (Sliding Animated Indicator) */}
          <div className="relative inline-grid grid-cols-2 p-1.5 bg-[#EFEFE5] rounded-full border border-[#DCE7E3] shadow-inner w-72 sm:w-80 select-none">
            {/* Sliding Animated Indicator */}
            <div
              className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-full bg-[#087C80] shadow-sm transition-all duration-300 ease-out"
              style={{
                left: activeJourney === 'founders' ? '6px' : 'calc(50%)',
              }}
            />

            <button
              type="button"
              onClick={() => handleSelectJourney('founders')}
              className={`relative z-10 flex items-center justify-center py-2.5 rounded-full text-xs sm:text-sm font-bold transition-colors duration-200 cursor-pointer ${
                activeJourney === 'founders'
                  ? 'text-white'
                  : 'text-[#52656B] hover:text-[#102A35]'
              }`}
            >
              For Founders
            </button>
            <button
              type="button"
              onClick={() => handleSelectJourney('testers')}
              className={`relative z-10 flex items-center justify-center py-2.5 rounded-full text-xs sm:text-sm font-bold transition-colors duration-200 cursor-pointer ${
                activeJourney === 'testers'
                  ? 'text-white'
                  : 'text-[#52656B] hover:text-[#102A35]'
              }`}
            >
              For Testers
            </button>
          </div>
        </div>

        {/* 4 Steps Grid */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {steps.map((item) => {
              return (
                <Card
                  key={item.step}
                  variant="interactive"
                  className="p-6 relative flex flex-col justify-between space-y-6 group border border-[#DCE7E3] hover:border-[#087C80]/50 transition-all duration-300 hover:-translate-y-1 bg-white shadow-xs hover:shadow-md"
                >
                  <div className="space-y-4">
                    {/* Top Row: Step Number & Highlight Pill */}
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-black text-[#087C80] tracking-tight font-mono">
                        {item.step}
                      </span>

                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA]">
                        {item.highlight}
                      </span>
                    </div>

                    {/* Step Title & Description */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-extrabold text-[#102A35] tracking-tight group-hover:text-[#087C80] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#52656B] leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Card bottom indicator */}
                  <div className="pt-3 border-t border-[#DCE7E3]/70 flex items-center justify-between text-[11px] text-[#52656B]">
                    <span className="font-semibold">Step {item.step} of 04</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#087C80] opacity-40 group-hover:opacity-100 group-hover:scale-125 transition-all" />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Action Button matching journey */}
        <div className="pt-2 text-center">
          {activeJourney === 'founders' ? (
            <Link to="/register?role=founder">
              <Button size="md" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Launch Your Campaign as Founder
              </Button>
            </Link>
          ) : (
            <Link to="/tester/discover">
              <Button size="md" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Explore Live Testing Campaigns
              </Button>
            </Link>
          )}
        </div>
      </Container>
    </section>
  );
};

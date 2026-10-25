import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Rocket,
  Target,
  UserCheck,
  CheckCircle2,
  Compass,
  FileCheck,
  Laptop,
  MessageSquareCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Container } from '../ui/Container';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface WorkflowStep {
  step: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight: string;
}

const FOUNDER_STEPS: WorkflowStep[] = [
  {
    step: '01',
    title: 'Create Your Startup',
    description:
      'Set up your company profile, choose your geographic hub across India, and define your company stage and target audience.',
    icon: Rocket,
    highlight: 'Venture Setup',
  },
  {
    step: '02',
    title: 'Launch a Testing Campaign',
    description:
      'Define step-by-step test scenarios, acceptance criteria, application deadlines, screening questions, and any rewards or perks.',
    icon: Target,
    highlight: 'Task Architecture',
  },
  {
    step: '03',
    title: 'Review Applications',
    description:
      'Screen applicant profiles, hardware configurations, and question responses to accept verified testers matched to your product.',
    icon: UserCheck,
    highlight: 'Tester Screening',
  },
  {
    step: '04',
    title: 'Resolve Issues With Real Feedback',
    description:
      'Triage standardized bug reports with reproduction steps, communicate directly with testers, verify retests, and ship with certainty.',
    icon: CheckCircle2,
    highlight: 'Closed-Loop Verification',
  },
];

const TESTER_STEPS: WorkflowStep[] = [
  {
    step: '01',
    title: 'Explore Open Campaigns',
    description:
      'Browse live testing campaigns filtered by category, operating system, and reward type to find software you are eager to test.',
    icon: Compass,
    highlight: 'Venture Discovery',
  },
  {
    step: '02',
    title: 'Apply to Test Products',
    description:
      'Submit your application highlighting your device setups, testing background, and answers to the founder’s screening questions.',
    icon: FileCheck,
    highlight: 'One-Click Apply',
  },
  {
    step: '03',
    title: 'Complete Guided Tasks',
    description:
      'Execute the structured testing journey, explore new workflows, and test real-world scenarios on your own devices.',
    icon: Laptop,
    highlight: 'Hands-On Testing',
  },
  {
    step: '04',
    title: 'Submit Feedback & Retest',
    description:
      'File structured bug reports with reproducible steps, share UX insights, and re-verify fixes when founders update their product.',
    icon: MessageSquareCheck,
    highlight: 'Actionable Signal',
  },
];

export const HowItWorksSection: React.FC = () => {
  const [activeJourney, setActiveJourney] = useState<'founders' | 'testers'>('founders');

  const steps = activeJourney === 'founders' ? FOUNDER_STEPS : TESTER_STEPS;

  return (
    <section className="relative overflow-hidden py-4 sm:py-8" id="how-it-works">
      <Container size="xl" className="space-y-12">
        {/* Header & Toggle */}
        <div className="text-center space-y-5 max-w-2xl mx-auto">
          <div className="inline-flex items-center">
            <Badge variant="aqua" size="md">
              <Sparkles className="h-3.5 w-3.5 mr-1 text-[#087C80]" />
              <span>Step-by-Step Workflow</span>
            </Badge>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#102A35] tracking-tight">
            How TryLo Works
          </h2>

          <p className="text-sm sm:text-base text-[#52656B] leading-relaxed">
            A transparent, collaborative testing cycle built for product precision and high-signal feedback.
          </p>

          {/* Dual Journey Pill Switcher */}
          <div className="inline-flex p-1.5 bg-[#EFEFE5] rounded-2xl border border-[#DCE7E3] shadow-inner">
            <button
              type="button"
              onClick={() => setActiveJourney('founders')}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${activeJourney === 'founders'
                  ? 'bg-white text-[#102A35] shadow-sm border border-[#DCE7E3]'
                  : 'text-[#52656B] hover:text-[#102A35]'
                }`}
            >
              For Founders
            </button>
            <button
              type="button"
              onClick={() => setActiveJourney('testers')}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${activeJourney === 'testers'
                  ? 'bg-white text-[#102A35] shadow-sm border border-[#DCE7E3]'
                  : 'text-[#52656B] hover:text-[#102A35]'
                }`}
            >
              For Testers
            </button>
          </div>
        </div>

        {/* 4 Steps Grid with Visual Connecting Line on Desktop */}
        <div className="relative">
          {/* Subtle horizontal connecting line on desktop */}
          <div className="hidden lg:block absolute top-[68px] left-[10%] right-[10%] h-0.5 border-t-2 border-dashed border-[#BCE1DA] -z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {steps.map((item) => {
              const IconComponent = item.icon;
              return (
                <Card
                  key={item.step}
                  variant="interactive"
                  className="p-6 relative flex flex-col justify-between space-y-6 group border border-[#DCE7E3] hover:border-[#087C80]/50 transition-all duration-300 hover:-translate-y-1 bg-white shadow-xs hover:shadow-md"
                >
                  <div className="space-y-4">
                    {/* Top Row: Icon Container + Step Number Watermark */}
                    <div className="flex items-center justify-between">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#D7EFEB] to-[#BCE1DA] border border-[#BCE1DA] flex items-center justify-center text-[#087C80] shadow-xs group-hover:scale-105 group-hover:shadow-md group-hover:shadow-[#087C80]/15 transition-all duration-300">
                        <IconComponent className="h-6 w-6 stroke-[2.2]" />
                      </div>

                      <span className="text-3xl font-black text-[#087C80]/20 tracking-tighter select-none font-mono group-hover:text-[#087C80]/30 transition-colors">
                        {item.step}
                      </span>
                    </div>

                    {/* Step Title & Badge */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#087C80]">
                        {item.highlight}
                      </span>
                      <h3 className="text-lg font-extrabold text-[#102A35] tracking-tight group-hover:text-[#087C80] transition-colors">
                        {item.title}
                      </h3>
                    </div>

                    {/* Step Description */}
                    <p className="text-xs sm:text-sm text-[#52656B] leading-relaxed">
                      {item.description}
                    </p>
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

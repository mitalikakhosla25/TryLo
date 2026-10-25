import React from 'react';
import { Link } from 'react-router-dom';
import {
  Rocket,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Users,
  ListTodo,
  Bug,
  RefreshCw,
  Compass,
  FileCheck,
  Award,
  Building2,
  MapPin,
  Calendar,
  Coins,
  Gift,
} from 'lucide-react';
import { Container } from '../components/ui/Container';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SectionHeading } from '../components/ui/SectionHeading';
import { HeroSection } from '../components/home/HeroSection';
import { IndiaStartupMap } from '../components/map/IndiaStartupMap';
import { HowItWorksSection } from '../components/home/HowItWorksSection';
import { usePublicCampaigns } from '../context/useCampaigns';
import { usePublicStartups } from '../context/useStartups';

export const LandingPage: React.FC = () => {
  const {
    data: campaignsData,
    isLoading: campaignsLoading,
  } = usePublicCampaigns();

  const {
    data: startupsData,
    isLoading: startupsLoading,
  } = usePublicStartups({ page_size: 6 });

  const featuredCampaigns = campaignsData?.items?.slice(0, 6) || [];
  const featuredStartups = startupsData?.items || [];

  return (
    <div className="flex-1 flex flex-col space-y-20 sm:space-y-28 pb-12 sm:pb-20 overflow-hidden">
      {/* =========================================================================
          SECTION A: Interactive Hero & Campaign Carousel
          ========================================================================= */}
      <HeroSection />

      {/* =========================================================================
          SECTION B: Interactive India Startup Map (Geographically Accurate)
          ========================================================================= */}
      <section className="relative scroll-mt-20" id="startup-map">
        <Container size="xl" className="space-y-8">
          <SectionHeading
            badge="Interactive Geographic Directory"
            title="Explore Startups Across India"
            subtitle="Discover emerging technology companies testing their products across Indian states and Union Territories. Click any region or use the selector to filter."
            align="center"
          />

          <IndiaStartupMap />
        </Container>
      </section>

      {/* =========================================================================
          SECTION C: Featured Campaigns
          ========================================================================= */}
      <section className="relative">
        <Container size="xl" className="space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <SectionHeading
              badge="Discover Campaigns"
              title="Featured Testing Opportunities"
              subtitle="Apply to hands-on testing programs launched by verified founders."
            />
            <Link
              to="/tester/discover"
              className="inline-flex items-center space-x-1.5 text-sm font-semibold text-[#087C80] hover:text-[#07545A] transition-colors shrink-0"
            >
              <span>Browse All Open Campaigns</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {campaignsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-64 rounded-3xl bg-white border border-[#DCE7E3] animate-pulse p-6 space-y-4"
                />
              ))}
            </div>
          ) : featuredCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCampaigns.map((camp) => {
                const campaignLink =
                  camp.startup_slug && camp.slug
                    ? `/campaigns/${camp.startup_slug}/${camp.slug}`
                    : `/campaigns/p/${camp.id}`;

                return (
                  <Card
                    key={camp.id}
                    variant="interactive"
                    className="p-6 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#087C80] uppercase tracking-wider">
                          {camp.product_type || 'Software Beta'}
                        </span>
                        {camp.reward_type === 'monetary' && camp.reward_amount ? (
                          <Badge variant="teal" size="sm">
                            <Coins className="h-3 w-3 mr-1" />
                            <span>
                              {camp.reward_currency || '$'}
                              {camp.reward_amount}
                            </span>
                          </Badge>
                        ) : camp.reward_type === 'perk' ? (
                          <Badge variant="aqua" size="sm">
                            <Gift className="h-3 w-3 mr-1" />
                            <span>{camp.reward_description || 'Perk'}</span>
                          </Badge>
                        ) : null}
                      </div>

                      <div className="space-y-1">
                        <Link
                          to={campaignLink}
                          className="text-base font-bold text-[#102A35] hover:text-[#087C80] transition-colors line-clamp-1"
                        >
                          {camp.title}
                        </Link>
                        <p className="text-xs font-medium text-[#52656B]">
                          by {camp.startup_name}
                        </p>
                      </div>

                      {camp.summary && (
                        <p className="text-xs text-[#52656B] line-clamp-2 leading-relaxed">
                          {camp.summary}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#DCE7E3] space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-[#52656B]">
                        <span>
                          {camp.testing_tasks?.length || 0} testing task
                          {camp.testing_tasks?.length === 1 ? '' : 's'}
                        </span>
                        {camp.application_deadline && (
                          <span className="inline-flex items-center space-x-1">
                            <Calendar className="h-3 w-3 text-[#087C80]" />
                            <span>
                              Due {new Date(camp.application_deadline).toLocaleDateString()}
                            </span>
                          </span>
                        )}
                      </div>

                      <Link to={campaignLink} className="block">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                        >
                          View Campaign
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card variant="surface" className="p-8 text-center max-w-lg mx-auto space-y-4">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#087C80]">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-[#102A35]">No Public Campaigns Yet</h3>
              <p className="text-xs text-[#52656B]">
                Founders are actively preparing new beta test programs. Launch the first campaign or check back soon!
              </p>
              <div className="pt-2">
                <Link to="/register?role=founder">
                  <Button variant="primary" size="sm">
                    Launch a Campaign
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </Container>
      </section>

      {/* =========================================================================
          SECTION D: Featured Startups
          ========================================================================= */}
      <section className="relative">
        <Container size="xl" className="space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <SectionHeading
              badge="Startup Directory"
              title="Emerging Ventures on TryLo"
              subtitle="Learn about the visionary companies developing the next wave of products."
            />
            <a
              href="#startup-map"
              className="inline-flex items-center space-x-1.5 text-sm font-semibold text-[#087C80] hover:text-[#07545A] transition-colors shrink-0"
            >
              <span>Explore State Directory</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {startupsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-48 rounded-3xl bg-white border border-[#DCE7E3] animate-pulse p-6"
                />
              ))}
            </div>
          ) : featuredStartups.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredStartups.map((st) => {
                const location = [st.city, st.state].filter(Boolean).join(', ');
                return (
                  <Card
                    key={st.id}
                    variant="interactive"
                    className="p-6 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start gap-3.5">
                        {st.logo_url ? (
                          <img
                            src={st.logo_url}
                            alt={`${st.name} logo`}
                            className="h-12 w-12 rounded-xl object-cover border border-[#DCE7E3] bg-white shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#D7EFEB] to-[#A5E1D8] text-[#087C80] font-bold text-base flex items-center justify-center border border-[#BCE1DA] shrink-0">
                            {st.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/startups/${st.slug}`}
                            className="text-base font-bold text-[#102A35] hover:text-[#087C80] transition-colors block truncate"
                          >
                            {st.name}
                          </Link>
                          {st.industry && (
                            <span className="text-[11px] font-semibold text-[#087C80] block truncate">
                              {st.industry}
                            </span>
                          )}
                        </div>
                      </div>

                      {st.tagline ? (
                        <p className="text-xs text-[#52656B] line-clamp-2 leading-relaxed">
                          {st.tagline}
                        </p>
                      ) : (
                        <p className="text-xs text-[#52656B] italic">
                          Innovating in {st.industry || 'technology'}.
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#DCE7E3] flex items-center justify-between text-xs">
                      {location ? (
                        <span className="inline-flex items-center space-x-1 text-[#52656B] truncate max-w-[160px]">
                          <MapPin className="h-3 w-3 text-[#087C80] shrink-0" />
                          <span className="truncate">{location}</span>
                        </span>
                      ) : (
                        <span className="text-[#52656B]">India</span>
                      )}

                      <Link
                        to={`/startups/${st.slug}`}
                        className="inline-flex items-center space-x-1 font-semibold text-[#087C80] hover:text-[#07545A] transition-colors"
                      >
                        <span>Profile</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card variant="surface" className="p-8 text-center max-w-lg mx-auto space-y-4">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#087C80]">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-[#102A35]">Startups Registering Daily</h3>
              <p className="text-xs text-[#52656B]">
                Be among the early wave of founders launching their product profiles and recruiting community testers.
              </p>
              <div className="pt-2">
                <Link to="/register?role=founder">
                  <Button variant="primary" size="sm">
                    Register Your Startup
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </Container>
      </section>

      {/* =========================================================================
          SECTION E: For Founders
          ========================================================================= */}
      <section className="relative" id="for-founders">
        <Container size="xl" className="space-y-10">
          <SectionHeading
            badge="For Founders"
            title="Recruit Early Adopters. Ship With Certainty."
            subtitle="Eliminate product guesswork. Run targeted beta testing programs with real users before your public launch."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="surface" className="p-6 space-y-3.5">
              <div className="h-11 w-11 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#087C80]">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#102A35]">
                Targeted Tester Recruitment
              </h3>
              <p className="text-xs text-[#52656B] leading-relaxed">
                Filter applicants by experience level, devices, industry background, and custom screening questions to find your ideal user archetype.
              </p>
            </Card>

            <Card variant="surface" className="p-6 space-y-3.5">
              <div className="h-11 w-11 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#087C80]">
                <ListTodo className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#102A35]">
                Task-Based Test Campaigns
              </h3>
              <p className="text-xs text-[#52656B] leading-relaxed">
                Create structured testing scenarios and user journeys so testers know exactly what features, flows, and integrations to evaluate.
              </p>
            </Card>

            <Card variant="surface" className="p-6 space-y-3.5">
              <div className="h-11 w-11 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#087C80]">
                <Bug className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#102A35]">
                Structured Bug Reports
              </h3>
              <p className="text-xs text-[#52656B] leading-relaxed">
                Receive standardized bug submissions complete with reproduction steps, severity categorization, expected outcomes, and browser details.
              </p>
            </Card>

            <Card variant="surface" className="p-6 space-y-3.5">
              <div className="h-11 w-11 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#087C80]">
                <RefreshCw className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#102A35]">
                Retest & Issue Verification
              </h3>
              <p className="text-xs text-[#52656B] leading-relaxed">
                Close the loop with testers: request retesting once bugs are fixed and verify resolutions before rolling features out to general users.
              </p>
            </Card>
          </div>

          <div className="pt-2 flex items-center">
            <Link to="/register?role=founder">
              <Button size="md" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Launch Your First Campaign
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* =========================================================================
          SECTION F: For Testers
          ========================================================================= */}
      <section className="relative" id="for-testers">
        <Container size="xl" className="space-y-10">
          <SectionHeading
            badge="For Testers"
            title="Discover Tomorrow's Tech Today."
            subtitle="Join a passionate community of early adopters, test unreleased products, and help shape software roadmaps."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="surface" className="p-6 space-y-3.5">
              <div className="h-11 w-11 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#087C80]">
                <Compass className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#102A35]">
                Discover Products Early
              </h3>
              <p className="text-xs text-[#52656B] leading-relaxed">
                Get hands-on access to emerging developer tools, SaaS applications, productivity apps, and consumer software before launch.
              </p>
            </Card>

            <Card variant="surface" className="p-6 space-y-3.5">
              <div className="h-11 w-11 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#087C80]">
                <FileCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#102A35]">
                Seamless Campaign Applications
              </h3>
              <p className="text-xs text-[#52656B] leading-relaxed">
                Apply with one click using your testing profile, hardware specifications, and custom answers tailored to the founder's requirements.
              </p>
            </Card>

            <Card variant="surface" className="p-6 space-y-3.5">
              <div className="h-11 w-11 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#087C80]">
                <ListTodo className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#102A35]">
                Guided Testing Tasks
              </h3>
              <p className="text-xs text-[#52656B] leading-relaxed">
                Follow clear, task-oriented test objectives to exercise key product features, edge scenarios, and usability touchpoints.
              </p>
            </Card>

            <Card variant="surface" className="p-6 space-y-3.5">
              <div className="h-11 w-11 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#087C80]">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#102A35]">
                Build Your Reputation
              </h3>
              <p className="text-xs text-[#52656B] leading-relaxed">
                Earn recognition for high-quality bug reports, unlock exclusive rewards and perks, and become a trusted beta specialist.
              </p>
            </Card>
          </div>

          <div className="pt-2 flex items-center">
            <Link to="/tester/discover">
              <Button size="md" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Explore Active Campaigns
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* =========================================================================
          SECTION G: How TryLo Works (Illustrated Visual Storytelling)
          ========================================================================= */}
      <HowItWorksSection />

      {/* =========================================================================
          SECTION H: Final Call to Action
          ========================================================================= */}
      <section className="relative">
        <Container size="xl">
          <Card
            variant="surface"
            className="p-8 sm:p-14 relative overflow-hidden bg-gradient-to-br from-white via-white to-[#D7EFEB]/40 border-[#BCE1DA] shadow-xl text-center space-y-6"
          >
            <div className="inline-flex items-center mx-auto">
              <Badge variant="aqua" size="md">
                <Sparkles className="h-3.5 w-3.5 mr-1 text-[#087C80]" />
                <span>Join TryLo Today</span>
              </Badge>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#102A35] tracking-tight max-w-2xl mx-auto">
              Ready to Build or Test What's Next?
            </h2>

            <p className="text-sm sm:text-base text-[#52656B] max-w-xl mx-auto leading-relaxed">
              Whether you are a founder looking for mission-critical feedback before launch or a passionate tester eager to evaluate novel products, TryLo is built for you.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link to="/register?role=founder">
                <Button size="lg" variant="primary" rightIcon={<Rocket className="h-4 w-4" />}>
                  Join as a Founder
                </Button>
              </Link>
              <Link to="/register?role=tester">
                <Button
                  size="lg"
                  variant="outline"
                  rightIcon={<ShieldCheck className="h-4 w-4 text-[#087C80]" />}
                >
                  Join as a Tester
                </Button>
              </Link>
            </div>

            <div className="pt-2">
              <Link
                to="/login"
                className="text-xs font-semibold text-[#52656B] hover:text-[#087C80] transition-colors"
              >
                Already have an account? <span className="underline underline-offset-2">Sign In to Workspace</span>
              </Link>
            </div>
          </Card>
        </Container>
      </section>
    </div>
  );
};

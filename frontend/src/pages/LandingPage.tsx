import React from 'react';
import { Link } from 'react-router-dom';
import {
  Rocket,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Building2,
  MapPin,
  Calendar,
  Coins,
  Gift,
  CheckCircle2,
} from 'lucide-react';
import { Container } from '../components/ui/Container';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { HeroSection } from '../components/home/HeroSection';
import { IndiaStartupMap } from '../components/map/IndiaStartupMap';
import { ServicesSection } from '../components/home/ServicesSection';
import { HowItWorksSection } from '../components/home/HowItWorksSection';
import { usePublicCampaigns } from '../context/useCampaigns';
import { usePublicStartups } from '../context/useStartups';

export const LandingPage: React.FC = () => {
  const {
    data: campaignsData,
    isLoading: campaignsLoading,
  } = usePublicCampaigns({ page_size: 6 });

  const {
    data: startupsData,
    isLoading: startupsLoading,
  } = usePublicStartups({ page_size: 6 });

  const featuredCampaigns = campaignsData?.items?.slice(0, 6) || [];
  const featuredStartups = startupsData?.items || [];

  return (
    <div className="flex-1 flex flex-col space-y-20 sm:space-y-28 pb-16 sm:pb-24 overflow-hidden">
      {/* =========================================================================
          SECTION 1: HERO & PERSPECTIVE STARTUP DECK
          ========================================================================= */}
      <HeroSection />

      {/* =========================================================================
          SECTION 2: PAN INDIA COMMUNITY MAP
          ========================================================================= */}
      <section className="relative scroll-mt-24" id="startup-map">
        <Container size="xl">
          <IndiaStartupMap />
        </Container>
      </section>

      {/* =========================================================================
          SECTION 3: BUILT FOR BUILDERS AND BELIEVERS (SERVICES)
          ========================================================================= */}
      <div id="for-startups" className="scroll-mt-24">
        <div id="for-testers" className="scroll-mt-24">
          <ServicesSection />
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: STARTUP DISCOVERY (REAL BACKEND STARTUP DIRECTORY)
          ========================================================================= */}
      <section className="relative scroll-mt-24" id="discover-startups">
        <Container size="xl" className="space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center">
                <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA] shadow-2xs">
                  VENTURE DISCOVERY
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#102A35] tracking-tight">
                Discover Startups Building{' '}
                <span className="text-[#087C80]">What's Next</span>
              </h2>
              <p className="text-sm sm:text-base text-[#52656B] leading-relaxed">
                Connect with visionary founders and discover breakthrough products actively recruiting beta testers.
              </p>
            </div>

            <Link
              to="/register?role=founder"
              className="inline-flex items-center space-x-1.5 text-sm font-semibold text-[#087C80] hover:text-[#07545A] transition-colors shrink-0"
            >
              <span>List Your Startup</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {startupsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-52 rounded-3xl bg-white border border-[#DCE7E3] animate-pulse p-6"
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
                    className="p-6 flex flex-col justify-between space-y-4 rounded-3xl border-[#DCE7E3] hover:border-[#087C80]/40 hover:shadow-lg transition-all"
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
                        <p className="text-xs sm:text-sm text-[#52656B] line-clamp-2 leading-relaxed">
                          {st.tagline}
                        </p>
                      ) : (
                        <p className="text-xs sm:text-sm text-[#52656B] italic">
                          Innovating in {st.industry || 'technology'}.
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#DCE7E3] flex items-center justify-between text-xs">
                      {location ? (
                        <span className="inline-flex items-center space-x-1 text-[#52656B] truncate max-w-[170px]">
                          <MapPin className="h-3 w-3 text-[#087C80] shrink-0" />
                          <span className="truncate">{location}</span>
                        </span>
                      ) : (
                        <span className="text-[#52656B]">Pan-India</span>
                      )}

                      <Link
                        to={`/startups/${st.slug}`}
                        className="inline-flex items-center space-x-1 font-semibold text-[#087C80] hover:text-[#07545A] transition-colors"
                      >
                        <span>View Startup</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* Graceful Empty State */
            <div className="rounded-3xl border border-[#DCE7E3] bg-white p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4 shadow-xs">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#087C80]">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-[#102A35]">
                  Startups Registering Daily
                </h3>
                <p className="text-xs sm:text-sm text-[#52656B] leading-relaxed">
                  Be among the pioneering wave of founders listing their product profile and recruiting community beta testers.
                </p>
              </div>
              <div className="pt-2">
                <Link to="/register?role=founder">
                  <Button variant="primary" size="md">
                    Register Your Startup
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Container>
      </section>

      {/* =========================================================================
          SECTION 5: FEATURED CAMPAIGNS (TESTING OPPORTUNITIES)
          ========================================================================= */}
      <section className="relative">
        <Container size="xl" className="space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center">
                <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA] shadow-2xs">
                  HANDS-ON TESTING
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#102A35] tracking-tight">
                Featured Beta <span className="text-[#087C80]">Campaigns</span>
              </h2>
              <p className="text-sm sm:text-base text-[#52656B] leading-relaxed">
                Test unreleased software, complete guided tasks, and share actionable feedback directly with founding teams.
              </p>
            </div>

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
                    className="p-6 flex flex-col justify-between space-y-4 rounded-3xl border-[#DCE7E3] hover:border-[#087C80]/40 hover:shadow-lg transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#087C80] uppercase tracking-wider">
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
                            <span>{camp.reward_description || 'Perk & License'}</span>
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
                          className="w-full rounded-xl"
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
            <div className="rounded-3xl border border-[#DCE7E3] bg-white p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4 shadow-xs">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#087C80]">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-[#102A35]">
                  No Public Campaigns Active Yet
                </h3>
                <p className="text-xs sm:text-sm text-[#52656B] leading-relaxed">
                  Founders are actively preparing new beta test programs. Launch the first campaign or check back soon!
                </p>
              </div>
              <div className="pt-2">
                <Link to="/register?role=founder">
                  <Button variant="primary" size="md">
                    Launch a Campaign
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Container>
      </section>

      {/* =========================================================================
          SECTION 6: HOW TRYLO WORKS (STEP BY STEP WORKFLOW)
          ========================================================================= */}
      <HowItWorksSection />

      {/* =========================================================================
          SECTION 7: ABOUT US SECTION
          ========================================================================= */}
      <section className="relative scroll-mt-24" id="about">
        <Container size="xl">
          <div className="rounded-3xl border border-[#DCE7E3] bg-gradient-to-br from-white via-white to-[#D7EFEB]/30 p-8 sm:p-14 shadow-sm relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center">
                  <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA] shadow-2xs">
                    ABOUT TRYLO
                  </span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#102A35] tracking-tight">
                  Bridging the Gap Between{' '}
                  <span className="text-[#087C80]">Builders</span> &amp; Early Adopters
                </h2>

                <p className="text-sm sm:text-base text-[#52656B] leading-relaxed">
                  TryLo was built on a simple conviction: the greatest software products are forged
                  through genuine dialogue between visionary founders and inquisitive users. We provide
                  startups across India and beyond with an accessible, high-signal beta testing marketplace.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
                  <div className="p-3.5 rounded-2xl bg-white border border-[#DCE7E3] space-y-1">
                    <span className="font-bold text-[#102A35] block">Genuine Feedback</span>
                    <span className="text-[#52656B] leading-tight block">
                      Screened testers with reproducible bug reports.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-[#DCE7E3] space-y-1">
                    <span className="font-bold text-[#102A35] block">Pan-India Reach</span>
                    <span className="text-[#52656B] leading-tight block">
                      Ecosystem hubs from Mumbai to Bengaluru and beyond.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-[#DCE7E3] space-y-1">
                    <span className="font-bold text-[#102A35] block">Iterate with Speed</span>
                    <span className="text-[#52656B] leading-tight block">
                      Validate UX flows, squash blockers, and launch confidently.
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 relative flex justify-center">
                <div className="relative p-6 rounded-3xl bg-white border border-[#DCE7E3] shadow-lg max-w-sm w-full space-y-4">
                  <div className="flex items-center space-x-3 pb-3 border-b border-[#DCE7E3]">
                    <div className="h-10 w-10 rounded-xl bg-[#087C80] text-white flex items-center justify-center font-bold text-sm">
                      TL
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#102A35]">TryLo Marketplace</h4>
                      <p className="text-xs text-[#087C80] font-medium">Pan-India Beta Network</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-[#52656B]">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-[#087C80] shrink-0" />
                      <span>Task-guided beta testing cycles</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-[#087C80] shrink-0" />
                      <span>Closed-loop retesting verification</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-[#087C80] shrink-0" />
                      <span>Reputation badges &amp; tester perks</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link to="/register" className="block">
                      <Button size="sm" variant="primary" className="w-full rounded-xl">
                        Join the Community
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* =========================================================================
          SECTION 8: FINAL CALL TO ACTION
          ========================================================================= */}
      <section className="relative">
        <Container size="xl">
          <div className="rounded-3xl p-8 sm:p-14 relative overflow-hidden bg-gradient-to-br from-white via-white to-[#D7EFEB]/40 border border-[#BCE1DA] shadow-xl text-center space-y-6">
            <div className="inline-flex items-center mx-auto">
              <span className="text-[11px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA] shadow-2xs">
                JOIN TRYLO TODAY
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#102A35] tracking-tight max-w-2xl mx-auto">
              Ready to Build or Test <span className="text-[#087C80]">What's Next?</span>
            </h2>

            <p className="text-sm sm:text-base text-[#52656B] max-w-xl mx-auto leading-relaxed">
              Whether you are a founder looking for mission-critical feedback before launch or a passionate tester eager to evaluate novel products, TryLo is built for you.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register?role=founder">
                <Button size="lg" variant="primary" className="rounded-full px-7" rightIcon={<Rocket className="h-4 w-4" />}>
                  Join as a Founder
                </Button>
              </Link>
              <Link to="/register?role=tester">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-7"
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
          </div>
        </Container>
      </section>
    </div>
  );
};

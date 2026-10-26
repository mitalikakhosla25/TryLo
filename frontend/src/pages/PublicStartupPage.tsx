import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePublicStartup } from '../context/useStartups';
import { usePublicCampaigns } from '../context/useCampaigns';
import { Container } from '../components/ui/Container';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SectionHeading } from '../components/ui/SectionHeading';
import {
  MapPin,
  Globe,
  Calendar,
  Layers,
  ExternalLink,
  ArrowLeft,
  Sparkles,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Coins,
  Gift,
} from 'lucide-react';
import { StartupAvatar } from '../components/ui/StartupAvatar';

export const PublicStartupPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: startup, isLoading, isError, error, refetch } = usePublicStartup(slug);
  const { data: campaignsData } = usePublicCampaigns();

  const startupCampaigns = campaignsData?.items?.filter(
    (c) => c.startup_slug === startup?.slug || c.startup_id === startup?.id
  ) || [];

  if (isLoading) {
    return (
      <div className="flex-1 py-12">
        <Container size="xl" className="space-y-6">
          <div className="h-6 w-32 bg-[#DCE7E3]/60 rounded animate-pulse" />
          <div className="h-56 rounded-3xl bg-white border border-[#DCE7E3] animate-pulse" />
          <div className="h-72 rounded-3xl bg-white border border-[#DCE7E3] animate-pulse" />
        </Container>
      </div>
    );
  }

  if (isError || !startup) {
    return (
      <div className="flex-1 py-16">
        <Container size="md" className="text-center space-y-4">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#087C80]">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#102A35]">Startup Not Found</h1>
          <p className="text-sm text-[#52656B] max-w-md mx-auto">
            {error?.message || 'The requested startup profile could not be found or has not been made public.'}
          </p>
          <div className="flex items-center justify-center space-x-3 pt-3">
            <Button variant="outline" size="sm" onClick={() => refetch()} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Retry
            </Button>
            <Link to="/">
              <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                Back to Home
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const locationText = [startup.city, startup.state, startup.country].filter(Boolean).join(', ');

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#F6F5ED] py-10 sm:py-14 space-y-10">
      <Container size="xl" className="space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs text-[#52656B]">
          <Link to="/" className="hover:text-[#087C80] transition-colors inline-flex items-center space-x-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>
          <span>/</span>
          <span className="text-[#102A35] font-semibold">{startup.name}</span>
        </div>

        {/* Hero Card */}
        <Card variant="surface" className="p-6 sm:p-10 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Logo or Monogram */}
            <StartupAvatar
              name={startup.name}
              logoUrl={startup.logo_url}
              category={startup.industry}
              size="xl"
              shape="rounded"
            />

            {/* Meta */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A35]">
                  {startup.name}
                </h1>
                {startup.company_stage && (
                  <Badge variant="aqua" size="sm">
                    {startup.company_stage}
                  </Badge>
                )}
                {startup.industry && (
                  <Badge variant="slate" size="sm">
                    {startup.industry}
                  </Badge>
                )}
              </div>

              {startup.tagline && (
                <p className="text-base sm:text-lg text-[#52656B] leading-relaxed">
                  {startup.tagline}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[#52656B]">
                {locationText && (
                  <span className="inline-flex items-center space-x-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#087C80]" />
                    <span>{locationText}</span>
                  </span>
                )}
                {startup.founded_year && (
                  <span className="inline-flex items-center space-x-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#087C80]" />
                    <span>Founded {startup.founded_year}</span>
                  </span>
                )}
                {startup.website_url && (
                  <a
                    href={startup.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-[#087C80] hover:text-[#07545A] font-semibold underline underline-offset-2 transition-colors"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>Visit Website</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Startup Pitch / Description */}
        {startup.description && (
          <Card variant="surface" className="p-6 sm:p-8 space-y-3">
            <h2 className="text-lg font-bold text-[#102A35] flex items-center space-x-2">
              <Layers className="h-5 w-5 text-[#087C80]" />
              <span>About the Product</span>
            </h2>
            <p className="text-sm sm:text-base text-[#52656B] leading-relaxed whitespace-pre-line">
              {startup.description}
            </p>
          </Card>
        )}

        {/* Active Campaigns */}
        <div className="space-y-6">
          <SectionHeading
            badge="Testing Programs"
            title="Active Beta Campaigns"
            subtitle={`Explore available testing opportunities run directly by the ${startup.name} team.`}
          />

          {startupCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {startupCampaigns.map((camp) => (
                <Card
                  key={camp.id}
                  variant="interactive"
                  className="p-6 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#087C80] uppercase tracking-wider">
                        {camp.product_type || 'Beta Product'}
                      </span>
                      {camp.reward_type === 'monetary' && camp.reward_amount ? (
                        <Badge variant="teal" size="sm">
                          <Coins className="h-3 w-3 mr-1" />
                          <span>{camp.reward_currency || '$'}{camp.reward_amount}</span>
                        </Badge>
                      ) : camp.reward_type === 'perk' ? (
                        <Badge variant="aqua" size="sm">
                          <Gift className="h-3 w-3 mr-1" />
                          <span>Perk</span>
                        </Badge>
                      ) : null}
                    </div>

                    <h3 className="text-base font-bold text-[#102A35] line-clamp-1">
                      {camp.title}
                    </h3>

                    {camp.summary && (
                      <p className="text-xs text-[#52656B] line-clamp-2">
                        {camp.summary}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#DCE7E3] flex items-center justify-between">
                    <span className="text-xs text-[#52656B]">
                      {camp.testing_tasks?.length || 0} testing task{camp.testing_tasks?.length === 1 ? '' : 's'}
                    </span>
                    <Link
                      to={
                        camp.startup_slug && camp.slug
                          ? `/campaigns/${camp.startup_slug}/${camp.slug}`
                          : `/campaigns/p/${camp.id}`
                      }
                    >
                      <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                        View Campaign
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card variant="surface" className="p-8 text-center space-y-4 max-w-lg mx-auto">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#087C80]">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-[#102A35]">No Active Public Campaigns</h3>
              <p className="text-xs text-[#52656B]">
                {startup.name} hasn't launched any public beta campaigns at this time. Check back soon or explore other active campaigns on TryLo.
              </p>
              <div className="pt-2">
                <Link to="/tester/discover">
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Explore Other Campaigns
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </Container>
    </div>
  );
};

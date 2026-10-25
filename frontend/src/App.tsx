import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { WorkspaceGuard } from './components/WorkspaceGuard';

// Route-level code-splitting for performance and reduced initial bundle footprint
const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const FounderWorkspace = lazy(() => import('./pages/FounderWorkspace').then((m) => ({ default: m.FounderWorkspace })));
const TesterWorkspace = lazy(() => import('./pages/TesterWorkspace').then((m) => ({ default: m.TesterWorkspace })));
const FounderOnboardingPage = lazy(() => import('./pages/FounderOnboardingPage').then((m) => ({ default: m.FounderOnboardingPage })));
const TesterOnboardingPage = lazy(() => import('./pages/TesterOnboardingPage').then((m) => ({ default: m.TesterOnboardingPage })));
const ProfileManagementPage = lazy(() => import('./pages/ProfileManagementPage').then((m) => ({ default: m.ProfileManagementPage })));
const StartupListPage = lazy(() => import('./pages/StartupListPage').then((m) => ({ default: m.StartupListPage })));
const StartupCreatePage = lazy(() => import('./pages/StartupCreatePage').then((m) => ({ default: m.StartupCreatePage })));
const StartupDetailPage = lazy(() => import('./pages/StartupDetailPage').then((m) => ({ default: m.StartupDetailPage })));
const StartupEditPage = lazy(() => import('./pages/StartupEditPage').then((m) => ({ default: m.StartupEditPage })));
const StartupCampaignListPage = lazy(() => import('./pages/StartupCampaignListPage').then((m) => ({ default: m.StartupCampaignListPage })));
const CampaignWizardPage = lazy(() => import('./pages/CampaignWizardPage').then((m) => ({ default: m.CampaignWizardPage })));
const CampaignDetailPage = lazy(() => import('./pages/CampaignDetailPage').then((m) => ({ default: m.CampaignDetailPage })));
const CampaignApplicationsPage = lazy(() => import('./pages/CampaignApplicationsPage').then((m) => ({ default: m.CampaignApplicationsPage })));
const FounderApplicationsPage = lazy(() => import('./pages/FounderApplicationsPage').then((m) => ({ default: m.FounderApplicationsPage })));
const PublicCampaignPage = lazy(() => import('./pages/PublicCampaignPage').then((m) => ({ default: m.PublicCampaignPage })));
const PublicStartupPage = lazy(() => import('./pages/PublicStartupPage').then((m) => ({ default: m.PublicStartupPage })));
const TesterDiscoverPage = lazy(() => import('./pages/TesterDiscoverPage').then((m) => ({ default: m.TesterDiscoverPage })));
const TesterApplicationsPage = lazy(() => import('./pages/TesterApplicationsPage').then((m) => ({ default: m.TesterApplicationsPage })));
const TesterTasksPage = lazy(() => import('./pages/TesterTasksPage').then((m) => ({ default: m.TesterTasksPage })));
const CampaignTasksPage = lazy(() => import('./pages/CampaignTasksPage').then((m) => ({ default: m.CampaignTasksPage })));
const FeedbackSubmissionPage = lazy(() => import('./pages/FeedbackSubmissionPage').then((m) => ({ default: m.FeedbackSubmissionPage })));
const TesterFeedbackHistoryPage = lazy(() => import('./pages/TesterFeedbackHistoryPage').then((m) => ({ default: m.TesterFeedbackHistoryPage })));
const FounderFeedbackDashboardPage = lazy(() => import('./pages/FounderFeedbackDashboardPage').then((m) => ({ default: m.FounderFeedbackDashboardPage })));
const FounderFeedbackDetailPage = lazy(() => import('./pages/FounderFeedbackDetailPage').then((m) => ({ default: m.FounderFeedbackDetailPage })));

const PageLoadingFallback: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-8 space-y-4 animate-in fade-in duration-200">
    <div className="h-8 w-8 rounded-full border-2 border-[#087C80]/20 border-t-[#087C80] animate-spin" />
    <p className="text-xs text-[#52656B] font-medium">Loading view...</p>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-[#F6F5ED] text-[#102A35]">
            <Header />
            <main className="flex-1 flex flex-col">
              <Suspense fallback={<PageLoadingFallback />}>
                <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/startups/:slug" element={<PublicStartupPage />} />
                <Route path="/campaigns/:startupSlug/:campaignSlug" element={<PublicCampaignPage />} />
                <Route path="/campaigns/p/:campaignId" element={<PublicCampaignPage />} />

                {/* Onboarding Routes */}
                <Route
                  path="/onboarding/founder"
                  element={
                    <ProtectedRoute allowedRoles={['founder']}>
                      <FounderOnboardingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/onboarding/tester"
                  element={
                    <ProtectedRoute allowedRoles={['tester']}>
                      <TesterOnboardingPage />
                    </ProtectedRoute>
                  }
                />

                {/* Profile Management Route */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute allowedRoles={['founder', 'tester']}>
                      <ProfileManagementPage />
                    </ProtectedRoute>
                  }
                />

                {/* Role-Protected Workspace Routes with Profile Completion Guard */}
                <Route
                  path="/founder"
                  element={
                    <ProtectedRoute allowedRoles={['founder']}>
                      <WorkspaceGuard expectedRole="founder">
                        <FounderWorkspace />
                      </WorkspaceGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/founder/startups"
                  element={
                    <ProtectedRoute allowedRoles={['founder']}>
                      <WorkspaceGuard expectedRole="founder">
                        <StartupListPage />
                      </WorkspaceGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/founder/startups/new"
                  element={
                    <ProtectedRoute allowedRoles={['founder']}>
                      <WorkspaceGuard expectedRole="founder">
                        <StartupCreatePage />
                      </WorkspaceGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/founder/startups/:startupId"
                  element={
                    <ProtectedRoute allowedRoles={['founder']}>
                      <WorkspaceGuard expectedRole="founder">
                        <StartupDetailPage />
                      </WorkspaceGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/founder/startups/:startupId/edit"
                  element={
                    <ProtectedRoute allowedRoles={['founder']}>
                      <WorkspaceGuard expectedRole="founder">
                        <StartupEditPage />
                      </WorkspaceGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/founder/startups/:startupId/campaigns"
                  element={
                    <ProtectedRoute allowedRoles={['founder']}>
                      <WorkspaceGuard expectedRole="founder">
                        <StartupCampaignListPage />
                      </WorkspaceGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/founder/startups/:startupId/campaigns/new"
                  element={
                    <ProtectedRoute allowedRoles={['founder']}>
                      <WorkspaceGuard expectedRole="founder">
                        <CampaignWizardPage />
                      </WorkspaceGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/founder/campaigns/:campaignId"
                  element={
                    <ProtectedRoute allowedRoles={['founder']}>
                      <WorkspaceGuard expectedRole="founder">
                        <CampaignDetailPage />
                      </WorkspaceGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/founder/campaigns/:campaignId/edit"
                  element={
                    <ProtectedRoute allowedRoles={['founder']}>
                      <WorkspaceGuard expectedRole="founder">
                        <CampaignWizardPage />
                      </WorkspaceGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/founder/campaigns/:campaignId/applications"
                  element={
                    <ProtectedRoute allowedRoles={['founder']}>
                      <WorkspaceGuard expectedRole="founder">
                        <CampaignApplicationsPage />
                      </WorkspaceGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/founder/applications"
                  element={
                    <ProtectedRoute allowedRoles={['founder']}>
                      <WorkspaceGuard expectedRole="founder">
                        <FounderApplicationsPage />
                      </WorkspaceGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/founder/feedback"
                  element={
                    <ProtectedRoute allowedRoles={['founder']}>
                      <WorkspaceGuard expectedRole="founder">
                        <FounderFeedbackDashboardPage />
                      </WorkspaceGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/founder/feedback/:feedbackId"
                  element={
                    <ProtectedRoute allowedRoles={['founder']}>
                      <WorkspaceGuard expectedRole="founder">
                        <FounderFeedbackDetailPage />
                      </WorkspaceGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tester"
                  element={
                    <ProtectedRoute allowedRoles={['tester']}>
                      <WorkspaceGuard expectedRole="tester">
                        <TesterWorkspace />
                      </WorkspaceGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tester/workspace"
                  element={
                    <ProtectedRoute allowedRoles={['tester']}>
                      <WorkspaceGuard expectedRole="tester">
                        <TesterWorkspace />
                      </WorkspaceGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tester/discover"
                  element={
                    <ProtectedRoute allowedRoles={['tester']}>
                      <WorkspaceGuard expectedRole="tester">
                        <TesterDiscoverPage />
                      </WorkspaceGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tester/applications"
                  element={
                    <ProtectedRoute allowedRoles={['tester']}>
                      <WorkspaceGuard expectedRole="tester">
                        <TesterApplicationsPage />
                      </WorkspaceGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tester/tasks"
                  element={
                    <ProtectedRoute allowedRoles={['tester']}>
                      <WorkspaceGuard expectedRole="tester">
                        <TesterTasksPage />
                      </WorkspaceGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tester/campaigns/:campaignId/tasks"
                  element={
                    <ProtectedRoute allowedRoles={['tester']}>
                      <WorkspaceGuard expectedRole="tester">
                        <CampaignTasksPage />
                      </WorkspaceGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tester/campaigns/:campaignId/feedback/new"
                  element={
                    <ProtectedRoute allowedRoles={['tester']}>
                      <WorkspaceGuard expectedRole="tester">
                        <FeedbackSubmissionPage />
                      </WorkspaceGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tester/feedback"
                  element={
                    <ProtectedRoute allowedRoles={['tester']}>
                      <WorkspaceGuard expectedRole="tester">
                        <TesterFeedbackHistoryPage />
                      </WorkspaceGuard>
                    </ProtectedRoute>
                  }
                />

                {/* 404 Route */}
                <Route
                  path="*"
                  element={
                    <div className="flex-1 flex items-center justify-center p-8 text-center min-h-[50vh]">
                      <div className="max-w-md mx-auto space-y-3">
                        <span className="text-4xl font-extrabold text-[#087C80]">404</span>
                        <h1 className="text-2xl font-bold text-[#102A35]">Page Not Found</h1>
                        <p className="text-sm text-[#52656B]">
                          The page you are looking for doesn't exist or has been moved.
                        </p>
                        <div className="pt-2">
                          <a
                            href="/"
                            className="inline-flex items-center justify-center text-xs font-semibold px-4 py-2.5 rounded-xl bg-[#087C80] text-white hover:bg-[#07545A] shadow-xs transition-colors"
                          >
                            Return to TryLo Home
                          </a>
                        </div>
                      </div>
                    </div>
                  }
                />
              </Routes>
            </Suspense>
          </main>
          <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;


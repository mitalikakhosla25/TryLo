import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useFounderApplications,
  useAcceptApplication,
  useRejectApplication,
} from '../context/useApplications';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Building,
  Smartphone,
  Check,
  X,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import type { FounderApplicationItem } from '../api/applications';

export const FounderApplicationsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  // Modals state
  const [acceptModalApp, setAcceptModalApp] = useState<FounderApplicationItem | null>(null);
  const [rejectModalApp, setRejectModalApp] = useState<FounderApplicationItem | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    data: applicationsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useFounderApplications({
    status: filter,
    search: searchQuery || undefined,
  });

  const acceptMutation = useAcceptApplication();
  const rejectMutation = useRejectApplication();

  const allItems = applicationsData?.items || [];

  const toggleExpand = (id: string) => {
    setExpandedAppId((prev) => (prev === id ? null : id));
  };

  const handleOpenAccept = (app: FounderApplicationItem) => {
    setActionError(null);
    setAcceptModalApp(app);
  };

  const handleConfirmAccept = async () => {
    if (!acceptModalApp) return;
    setActionError(null);
    setSuccessMessage(null);
    try {
      await acceptMutation.mutateAsync(acceptModalApp.id);
      setSuccessMessage(`Successfully accepted ${acceptModalApp.tester.full_name} for "${acceptModalApp.campaign_title}".`);
      setAcceptModalApp(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to accept application.';
      setActionError(msg);
    }
  };

  const handleOpenReject = (app: FounderApplicationItem) => {
    setActionError(null);
    setRejectionNote('');
    setRejectModalApp(app);
  };

  const handleConfirmReject = async () => {
    if (!rejectModalApp) return;
    setActionError(null);
    setSuccessMessage(null);
    try {
      await rejectMutation.mutateAsync({
        applicationId: rejectModalApp.id,
        rejectionNote: rejectionNote.trim() || undefined,
      });
      setSuccessMessage(`Application for ${rejectModalApp.tester.full_name} marked as Not Selected.`);
      setRejectModalApp(null);
      setRejectionNote('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reject application.';
      setActionError(msg);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#F6F5ED] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#DCE7E3]">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs text-[#52656B]">
              <Link to="/founder" className="hover:text-[#07545A] transition-colors">
                Founder Workspace
              </Link>
              <span>/</span>
              <span className="text-[#087C80] font-semibold">All Applications</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A35] tracking-tight">
              Founder Applicant Overview
            </h1>
            <p className="text-xs sm:text-sm text-[#52656B]">
              Unified view of all beta tester applications submitted across your startups and testing campaigns.
            </p>
          </div>

          <Link
            to="/founder/startups"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white text-[#102A35] hover:bg-[#EFEFE5] transition-colors border border-[#DCE7E3] shadow-xs shrink-0"
          >
            <Building className="h-3.5 w-3.5 text-[#07545A]" />
            <span>My Startups</span>
          </Link>
        </div>

        {/* Success Notification */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 transition-colors p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Action Error Notification */}
        {actionError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span className="font-medium">{actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="text-rose-700 hover:text-rose-900 transition-colors p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Filter Tabs & Search Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                filter === 'all'
                  ? 'bg-[#07545A] text-white border-[#07545A] shadow-xs'
                  : 'bg-white text-[#52656B] border-[#DCE7E3] hover:text-[#102A35]'
              }`}
            >
              All Applications ({allItems.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                filter === 'pending'
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                  : 'bg-white text-[#52656B] border-[#DCE7E3] hover:text-[#102A35]'
              }`}
            >
              Pending Review
            </button>
            <button
              onClick={() => setFilter('accepted')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                filter === 'accepted'
                  ? 'bg-[#D7EFEB] text-[#07545A] border-[#BCE1DA] shadow-xs'
                  : 'bg-white text-[#52656B] border-[#DCE7E3] hover:text-[#102A35]'
              }`}
            >
              Accepted
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                filter === 'rejected'
                  ? 'bg-rose-100 text-rose-900 border-rose-300 shadow-xs'
                  : 'bg-white text-[#52656B] border-[#DCE7E3] hover:text-[#102A35]'
              }`}
            >
              Not Selected
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[260px]">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#52656B]" />
            <input
              type="text"
              placeholder="Search by tester or campaign..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-white border border-[#DCE7E3] text-xs text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:border-[#087C80]"
            />
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-6 rounded-3xl bg-white border border-[#DCE7E3] space-y-3 animate-pulse"
              >
                <div className="flex justify-between items-center">
                  <div className="h-5 w-48 bg-[#EFEFE5] rounded-md"></div>
                  <div className="h-5 w-24 bg-[#EFEFE5] rounded-md"></div>
                </div>
                <div className="h-4 w-72 bg-[#EFEFE5] rounded-md"></div>
                <div className="h-8 w-full bg-[#EFEFE5]/60 rounded-xl"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-8 rounded-3xl bg-rose-50 border border-rose-200 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-rose-600 mx-auto" />
            <h3 className="text-sm font-bold text-[#102A35]">Failed to load applications</h3>
            <p className="text-xs text-rose-700 max-w-md mx-auto">
              {error?.message || 'An error occurred while loading applications.'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-[#07545A] text-white hover:bg-[#087C80] transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && allItems.length === 0 && (
          <div className="rounded-3xl bg-white border border-dashed border-[#DCE7E3] p-12 text-center space-y-4 shadow-sm">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-[#EFEFE5] border border-[#DCE7E3] flex items-center justify-center text-[#52656B]">
              <Users className="h-6 w-6 text-[#07545A]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#102A35]">
                {filter === 'all'
                  ? 'No Applications Received Yet'
                  : `No ${filter} applications found`}
              </h3>
              <p className="text-xs text-[#52656B] max-w-sm mx-auto">
                {filter === 'all'
                  ? 'When testers apply to any of your active campaigns, their submissions will appear here for review.'
                  : `There are currently no applications matching the "${filter}" filter criteria.`}
              </p>
            </div>
          </div>
        )}

        {/* Applications Cards */}
        {!isLoading && !isError && allItems.length > 0 && (
          <div className="space-y-4">
            {allItems.map((app) => {
              const isPending = app.status === 'pending';
              const isAccepted = app.status === 'accepted';
              const isRejected = app.status === 'rejected';
              const isExpanded = expandedAppId === app.id;
              const answersCount = Object.keys(app.screening_answers || {}).length;
              const tester = app.tester;

              return (
                <div
                  key={app.id}
                  className="rounded-3xl bg-white border border-[#DCE7E3] hover:border-[#087C80]/50 transition-all p-6 sm:p-7 space-y-4 shadow-xs"
                >
                  {/* Header row: Tester, Campaign Link, Status */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start space-x-3.5">
                      <div className="h-11 w-11 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#07545A] font-bold text-sm shrink-0">
                        {tester.full_name ? tester.full_name.slice(0, 2).toUpperCase() : 'TT'}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base sm:text-lg font-bold text-[#102A35]">
                            {tester.full_name}
                          </h2>
                          {tester.experience_level && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#EFEFE5] text-[#07545A] border border-[#DCE7E3]">
                              {tester.experience_level}
                            </span>
                          )}
                          {(tester.city || tester.country) && (
                            <span className="text-[11px] text-[#52656B]">
                              {[tester.city, tester.country].filter(Boolean).join(', ')}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#52656B]">
                          <span>Applied for:</span>
                          <Link
                            to={`/founder/campaigns/${app.campaign_id}/applications`}
                            className="font-semibold text-[#07545A] hover:text-[#087C80] transition-colors"
                          >
                            {app.campaign_title}
                          </Link>
                          {app.startup_name && (
                            <span className="text-[#52656B]">({app.startup_name})</span>
                          )}
                          <span>&bull;</span>
                          <span>{new Date(app.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center space-x-2 self-start sm:self-center">
                      <span
                        className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${
                          isPending
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : isAccepted
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {isPending && <Clock className="h-3.5 w-3.5" />}
                        {isAccepted && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {isRejected && <XCircle className="h-3.5 w-3.5" />}
                        <span>{isPending ? 'Pending' : isAccepted ? 'Accepted' : 'Not Selected'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Bio text */}
                  {tester.bio && (
                    <p className="text-xs text-[#52656B] leading-relaxed pt-2 border-t border-[#DCE7E3]">
                      {tester.bio}
                    </p>
                  )}

                  {/* Skills & Devices */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    {tester.devices && tester.devices.length > 0 && (
                      <div className="flex items-center space-x-1 mr-2 text-[#52656B]">
                        <Smartphone className="h-3.5 w-3.5 text-[#07545A]" />
                        <span className="text-[11px] font-medium">{tester.devices.join(', ')}</span>
                      </div>
                    )}

                    {tester.skills && tester.skills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {tester.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 rounded-full bg-[#EFEFE5] text-[#102A35] border border-[#DCE7E3] text-[10px] font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Motivation */}
                  {app.motivation && (
                    <div className="p-3.5 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] text-xs space-y-1">
                      <span className="font-semibold text-[#07545A] block text-[10px] uppercase tracking-wider flex items-center space-x-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>Applicant's Motivation:</span>
                      </span>
                      <p className="italic text-[#102A35]">"{app.motivation}"</p>
                    </div>
                  )}

                  {/* Drawer for screening answers */}
                  {answersCount > 0 && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => toggleExpand(app.id)}
                        className="inline-flex items-center space-x-1.5 text-xs text-[#07545A] hover:text-[#087C80] transition-colors font-semibold cursor-pointer"
                      >
                        <span>
                          {isExpanded ? 'Hide' : 'Inspect'} screening answers ({answersCount})
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-3 animate-in fade-in">
                          <div className="text-[11px] font-semibold text-[#52656B] uppercase tracking-wider">
                            Screening Answers
                          </div>
                          <div className="space-y-2">
                            {Object.entries(app.screening_answers).map(([qid, ans]) => (
                              <div
                                key={qid}
                                className="p-3 rounded-xl bg-white border border-[#DCE7E3] space-y-1"
                              >
                                <span className="text-[11px] text-[#52656B] font-mono">
                                  Question [{qid}]:
                                </span>
                                <p className="text-xs text-[#102A35] font-semibold">
                                  {typeof ans === 'boolean'
                                    ? ans
                                      ? 'Yes'
                                      : 'No'
                                    : String(ans)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#DCE7E3]">
                    <Link
                      to={`/founder/campaigns/${app.campaign_id}/applications`}
                      className="inline-flex items-center space-x-1 text-xs text-[#07545A] hover:text-[#087C80] font-semibold"
                    >
                      <span>View Campaign Queue</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>

                    {isPending && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenReject(app)}
                          disabled={rejectMutation.isPending || acceptMutation.isPending}
                          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Reject</span>
                        </button>

                        <button
                          onClick={() => handleOpenAccept(app)}
                          disabled={acceptMutation.isPending || rejectMutation.isPending}
                          className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#07545A] hover:bg-[#087C80] text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Accept Tester</span>
                        </button>
                      </div>
                    )}

                    {isAccepted && (
                      <span className="text-xs text-emerald-700 font-semibold inline-flex items-center space-x-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Access Granted</span>
                      </span>
                    )}

                    {isRejected && (
                      <span className="text-xs text-[#52656B] font-medium inline-flex items-center space-x-1">
                        <XCircle className="h-3.5 w-3.5 text-rose-600" />
                        <span>Not Selected</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Accept Confirmation Modal */}
        {acceptModalApp && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-[#DCE7E3] rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center space-x-3 text-emerald-700">
                <div className="h-10 w-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102A35]">Accept Beta Tester</h3>
                  <p className="text-xs text-[#52656B]">Confirm tester onboarding into your campaign</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#52656B] leading-relaxed">
                Are you sure you want to accept{' '}
                <strong className="text-[#102A35]">{acceptModalApp.tester.full_name}</strong> for{' '}
                <strong className="text-[#102A35]">{acceptModalApp.campaign_title}</strong>?
              </p>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAcceptModalApp(null)}
                  disabled={acceptMutation.isPending}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-[#EFEFE5] hover:bg-[#DCE7E3] text-[#102A35] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAccept}
                  disabled={acceptMutation.isPending}
                  className="px-5 py-2 rounded-full text-xs font-semibold bg-[#07545A] hover:bg-[#087C80] text-white transition-colors flex items-center space-x-1.5 shadow-xs"
                >
                  {acceptMutation.isPending ? (
                    <span>Accepting...</span>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Confirm &amp; Accept</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Confirmation Modal */}
        {rejectModalApp && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-[#DCE7E3] rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center space-x-3 text-rose-700">
                <div className="h-10 w-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102A35]">Decline Application</h3>
                  <p className="text-xs text-[#52656B]">Mark applicant as not selected</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#52656B] leading-relaxed">
                Are you sure you want to mark the application from{' '}
                <strong className="text-[#102A35]">{rejectModalApp.tester.full_name}</strong> as Not Selected?
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#102A35] block">
                  Internal Note (Optional):
                </label>
                <textarea
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="Private team feedback..."
                  rows={3}
                  maxLength={500}
                  className="w-full p-3 rounded-xl bg-white border border-[#DCE7E3] text-xs text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:border-[#087C80]"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setRejectModalApp(null)}
                  disabled={rejectMutation.isPending}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-[#EFEFE5] hover:bg-[#DCE7E3] text-[#102A35] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={rejectMutation.isPending}
                  className="px-5 py-2 rounded-full text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center space-x-1.5 shadow-xs"
                >
                  {rejectMutation.isPending ? (
                    <span>Updating...</span>
                  ) : (
                    <>
                      <X className="h-3.5 w-3.5" />
                      <span>Confirm &amp; Decline</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  AlertCircle,
  Calendar,
  Layers,
  MessageSquarePlus,
  Search,
} from 'lucide-react';
import { useTesterTasks } from '../context/useTasks';

export const TesterTasksPage: React.FC = () => {
  const { data, isLoading, isError, error, refetch } = useTesterTasks();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');

  const campaigns = data?.items || [];

  const filteredCampaigns = campaigns.filter((item) => {
    const matchesSearch =
      item.campaign_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.startup_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.assignment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#F6F5ED] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Header Breadcrumbs & Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#DCE7E3]">
          <div>
            <div className="flex items-center space-x-2 text-xs text-[#52656B] mb-1">
              <Link to="/tester" className="hover:text-[#07545A] transition-colors">
                Workspace
              </Link>
              <span>/</span>
              <span className="text-[#087C80] font-semibold">Testing Tasks</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#102A35] flex items-center gap-2">
              <Layers className="h-6 w-6 text-[#07545A]" />
              <span>My Testing Tasks</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#52656B] mt-1">
              Follow assigned testing tasks, track your progress, and report feedback for accepted campaigns.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/tester/feedback"
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-full bg-white border border-[#DCE7E3] hover:bg-[#EFEFE5] text-[#102A35] transition-colors shadow-xs"
            >
              <MessageSquarePlus className="h-4 w-4 text-[#07545A]" />
              <span>Feedback History</span>
            </Link>
            <Link
              to="/tester/discover"
              className="inline-flex items-center space-x-1.5 px-5 py-2 text-xs font-semibold rounded-full bg-[#07545A] hover:bg-[#087C80] text-white shadow-xs transition-all"
            >
              <Sparkles className="h-4 w-4 text-[#FFC928]" />
              <span>Discover Campaigns</span>
            </Link>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white border border-[#DCE7E3] rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-full font-semibold transition-colors border ${
                statusFilter === 'all'
                  ? 'bg-[#07545A] text-white border-[#07545A] shadow-xs'
                  : 'bg-white text-[#52656B] border-[#DCE7E3] hover:text-[#102A35]'
              }`}
            >
              All ({campaigns.length})
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-4 py-2 rounded-full font-semibold transition-colors border ${
                statusFilter === 'in_progress'
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                  : 'bg-white text-[#52656B] border-[#DCE7E3] hover:text-[#102A35]'
              }`}
            >
              In Progress ({campaigns.filter((c) => c.assignment_status === 'in_progress').length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 rounded-full font-semibold transition-colors border ${
                statusFilter === 'completed'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300 shadow-xs'
                  : 'bg-white text-[#52656B] border-[#DCE7E3] hover:text-[#102A35]'
              }`}
            >
              Completed ({campaigns.filter((c) => c.assignment_status === 'completed').length})
            </button>
            <button
              onClick={() => setStatusFilter('not_started')}
              className={`px-4 py-2 rounded-full font-semibold transition-colors border ${
                statusFilter === 'not_started'
                  ? 'bg-[#EFEFE5] text-[#102A35] border-[#DCE7E3] shadow-xs'
                  : 'bg-white text-[#52656B] border-[#DCE7E3] hover:text-[#102A35]'
              }`}
            >
              Not Started ({campaigns.filter((c) => c.assignment_status === 'not_started').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#52656B]" />
            <input
              type="text"
              placeholder="Search by startup or campaign..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 text-xs bg-white border border-[#DCE7E3] rounded-xl text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:border-[#087C80]"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-white border border-[#DCE7E3] rounded-3xl animate-pulse shadow-xs"
              />
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-600" />
              <span className="text-sm font-medium">
                {error instanceof Error ? error.message : 'Failed to load testing tasks.'}
              </span>
            </div>
            <button
              onClick={() => refetch()}
              className="text-xs px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-semibold transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredCampaigns.length === 0 && (
          <div className="text-center py-16 px-4 bg-white border border-dashed border-[#DCE7E3] rounded-3xl shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EFEFE5] border border-[#DCE7E3] flex items-center justify-center mb-4">
              <Layers className="h-7 w-7 text-[#07545A]" />
            </div>
            <h3 className="text-lg font-bold text-[#102A35]">No testing campaigns found</h3>
            <p className="text-sm text-[#52656B] max-w-md mx-auto mt-1 mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'No campaigns match your search or filter criteria. Try clearing the filters.'
                : 'You have not been accepted to any active campaigns yet. Discover startups looking for beta testers and submit an application!'}
            </p>
            {searchTerm || statusFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="text-xs font-semibold px-5 py-2.5 rounded-full bg-[#EFEFE5] hover:bg-[#DCE7E3] text-[#102A35] border border-[#DCE7E3] transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <Link
                to="/tester/discover"
                className="inline-flex items-center space-x-2 text-xs font-semibold px-5 py-2.5 rounded-full bg-[#07545A] hover:bg-[#087C80] text-white shadow-xs transition-all"
              >
                <Sparkles className="h-4 w-4 text-[#FFC928]" />
                <span>Browse Available Campaigns</span>
              </Link>
            )}
          </div>
        )}

        {/* Campaign Cards List */}
        {!isLoading && !isError && filteredCampaigns.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {filteredCampaigns.map((campaign) => {
              const progressPercent =
                campaign.total_tasks > 0
                  ? Math.round((campaign.completed_tasks / campaign.total_tasks) * 100)
                  : 0;

              return (
                <div
                  key={campaign.campaign_id}
                  className="bg-white border border-[#DCE7E3] rounded-3xl p-6 sm:p-7 hover:border-[#087C80]/50 transition-all shadow-xs"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Left: Info */}
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-[#07545A] uppercase tracking-wider">
                          {campaign.startup_name}
                        </span>
                        {campaign.product_type && (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#EFEFE5] border border-[#DCE7E3] text-[#102A35] font-medium">
                            {campaign.product_type}
                          </span>
                        )}
                        {/* Assignment Status Pill */}
                        <span
                          className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                            campaign.assignment_status === 'completed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : campaign.assignment_status === 'in_progress'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-[#EFEFE5] text-[#52656B] border-[#DCE7E3]'
                          }`}
                        >
                          {campaign.assignment_status === 'completed'
                            ? 'All Tasks Completed'
                            : campaign.assignment_status === 'in_progress'
                            ? 'In Progress'
                            : 'Not Started'}
                        </span>
                      </div>

                      <h2 className="text-lg font-bold text-[#102A35] hover:text-[#07545A] transition-colors">
                        <Link to={`/tester/campaigns/${campaign.campaign_id}/tasks`}>
                          {campaign.campaign_title}
                        </Link>
                      </h2>

                      {/* Dates */}
                      {(campaign.testing_start_date || campaign.testing_end_date) && (
                        <div className="flex items-center space-x-1.5 text-xs text-[#52656B]">
                          <Calendar className="h-3.5 w-3.5 text-[#07545A]" />
                          <span>
                            Testing Period:{' '}
                            {campaign.testing_start_date
                              ? new Date(campaign.testing_start_date).toLocaleDateString()
                              : 'Now'}{' '}
                            -{' '}
                            {campaign.testing_end_date
                              ? new Date(campaign.testing_end_date).toLocaleDateString()
                              : 'Open'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right: Progress & Action */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6 min-w-[280px]">
                      {/* Progress Bar & Ratio */}
                      <div className="flex-1 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#52656B]">Task Completion</span>
                          <span className="font-bold text-[#102A35]">
                            {campaign.completed_tasks} / {campaign.total_tasks} ({progressPercent}%)
                          </span>
                        </div>
                        <div className="w-full bg-[#EFEFE5] rounded-full h-2 overflow-hidden border border-[#DCE7E3]">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              progressPercent === 100
                                ? 'bg-emerald-600'
                                : progressPercent > 0
                                ? 'bg-[#087C80]'
                                : 'bg-[#DCE7E3]'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/tester/campaigns/${campaign.campaign_id}/tasks`}
                          className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-full bg-[#07545A] hover:bg-[#087C80] text-white shadow-xs transition-all whitespace-nowrap"
                        >
                          <span>Open Workspace</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

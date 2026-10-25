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
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Breadcrumbs & Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
              <Link to="/tester" className="hover:text-slate-200 transition-colors">
                Workspace
              </Link>
              <span>/</span>
              <span className="text-violet-400 font-medium">Testing Tasks</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Layers className="h-6 w-6 text-violet-400" />
              <span>My Testing Tasks</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Follow assigned testing tasks, track your progress, and report feedback for accepted campaigns.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/tester/feedback"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700/80 text-slate-200 transition-colors"
            >
              <MessageSquarePlus className="h-4 w-4 text-violet-400" />
              <span>Feedback History</span>
            </Link>
            <Link
              to="/tester/discover"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/20 transition-all"
            >
              <Sparkles className="h-4 w-4 text-[#FFC928]" />
              <span>Discover Campaigns</span>
            </Link>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({campaigns.length})
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                statusFilter === 'in_progress'
                  ? 'bg-amber-600/90 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              In Progress ({campaigns.filter((c) => c.assignment_status === 'in_progress').length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Completed ({campaigns.filter((c) => c.assignment_status === 'completed').length})
            </button>
            <button
              onClick={() => setStatusFilter('not_started')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                statusFilter === 'not_started'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Not Started ({campaigns.filter((c) => c.assignment_status === 'not_started').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by startup or campaign..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-800/80 border border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-slate-900/50 border border-slate-800 rounded-xl animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">
                {error instanceof Error ? error.message : 'Failed to load testing tasks.'}
              </span>
            </div>
            <button
              onClick={() => refetch()}
              className="text-xs px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-md font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredCampaigns.length === 0 && (
          <div className="text-center py-16 px-4 bg-slate-900/40 border border-slate-800 rounded-2xl">
            <div className="w-14 h-14 mx-auto rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
              <Layers className="h-7 w-7 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">No testing campaigns found</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-6">
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
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <Link
                to="/tester/discover"
                className="inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20 transition-all"
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
                  className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700/80 transition-all shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Left: Info */}
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
                          {campaign.startup_name}
                        </span>
                        {campaign.product_type && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                            {campaign.product_type}
                          </span>
                        )}
                        {/* Assignment Status Pill */}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            campaign.assignment_status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : campaign.assignment_status === 'in_progress'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-slate-700/50 text-slate-300 border-slate-600/50'
                          }`}
                        >
                          {campaign.assignment_status === 'completed'
                            ? 'All Tasks Completed'
                            : campaign.assignment_status === 'in_progress'
                            ? 'In Progress'
                            : 'Not Started'}
                        </span>
                      </div>

                      <h2 className="text-lg font-bold text-white hover:text-violet-300 transition-colors">
                        <Link to={`/tester/campaigns/${campaign.campaign_id}/tasks`}>
                          {campaign.campaign_title}
                        </Link>
                      </h2>

                      {/* Dates */}
                      {(campaign.testing_start_date || campaign.testing_end_date) && (
                        <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" />
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
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Task Completion</span>
                          <span className="font-semibold text-white">
                            {campaign.completed_tasks} / {campaign.total_tasks} ({progressPercent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/50">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              progressPercent === 100
                                ? 'bg-emerald-500'
                                : progressPercent > 0
                                ? 'bg-violet-500'
                                : 'bg-slate-700'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/tester/campaigns/${campaign.campaign_id}/tasks`}
                          className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/20 transition-all whitespace-nowrap"
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

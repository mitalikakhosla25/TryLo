import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Key,
  ExternalLink,
  MessageSquarePlus,
  Bug,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
} from 'lucide-react';
import { useCampaignTasks, useUpdateTaskProgress } from '../context/useTasks';
import { useCampaignAccess } from '../context/useApplications';
import type { TaskProgressStatus } from '../api/tasks';

export const CampaignTasksPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { data, isLoading, isError, error, refetch } = useCampaignTasks(campaignId);
  const updateProgressMutation = useUpdateTaskProgress(campaignId);

  // Private Product Access Modal State
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const {
    data: accessData,
    isLoading: isAccessLoading,
    isError: isAccessError,
    error: accessError,
    refetch: fetchAccess,
  } = useCampaignAccess(isAccessModalOpen ? campaignId : undefined);

  // Note expansion per task
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [filterStatus, setFilterStatus] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');

  const handleOpenAccess = () => {
    setIsAccessModalOpen(true);
    fetchAccess();
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskProgressStatus) => {
    const note = editingNotes[taskId] ?? data?.tasks.find((t) => t.id === taskId)?.completion_note ?? '';
    try {
      await updateProgressMutation.mutateAsync({
        taskId,
        payload: {
          status: newStatus,
          completion_note: note.trim() ? note.trim() : null,
        },
      });
    } catch (err) {
      console.error('Failed to update task progress:', err);
    }
  };

  const handleSaveNote = async (taskId: string, currentStatus: TaskProgressStatus) => {
    const note = editingNotes[taskId] ?? '';
    try {
      await updateProgressMutation.mutateAsync({
        taskId,
        payload: {
          status: currentStatus,
          completion_note: note.trim() ? note.trim() : null,
        },
      });
      // Collapse note editor on save
      setExpandedNotes((prev) => ({ ...prev, [taskId]: false }));
    } catch (err) {
      console.error('Failed to save completion note:', err);
    }
  };

  const tasks = data?.tasks || [];
  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

  const progressPercent =
    data && data.total_tasks > 0
      ? Math.round((data.completed_tasks / data.total_tasks) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-2">
            <Link to="/tester" className="hover:text-slate-200 transition-colors">
              Workspace
            </Link>
            <span>/</span>
            <Link to="/tester/tasks" className="hover:text-slate-200 transition-colors">
              My Tasks
            </Link>
            <span>/</span>
            <span className="text-violet-400 font-medium truncate max-w-[200px]">
              {data?.campaign_title || 'Testing Workspace'}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                  {data?.startup_name}
                </span>
                {data?.product_type && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                    {data.product_type}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
                {data?.campaign_title || 'Campaign Testing Workspace'}
              </h1>
            </div>

            {/* Header Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Product Access Button */}
              <button
                onClick={handleOpenAccess}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all"
              >
                <Key className="h-3.5 w-3.5" />
                <span>Product Instructions</span>
              </button>

              {/* Bug Report Button */}
              <Link
                to={`/tester/campaigns/${campaignId}/feedback/new?type=bug_report`}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition-all"
              >
                <Bug className="h-3.5 w-3.5" />
                <span>Report Bug</span>
              </Link>

              {/* General Feedback Button */}
              <Link
                to={`/tester/campaigns/${campaignId}/feedback/new?type=general_feedback`}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/20 transition-all"
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                <span>Submit Feedback</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            <div className="h-24 bg-slate-900/50 border border-slate-800 rounded-xl animate-pulse" />
            <div className="h-48 bg-slate-900/50 border border-slate-800 rounded-xl animate-pulse" />
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">
                {error instanceof Error ? error.message : 'Failed to load campaign tasks.'}
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

        {/* Main Content */}
        {!isLoading && !isError && data && (
          <>
            {/* Progress Summary Card */}
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-white">Your Testing Progress</h2>
                  <p className="text-xs text-slate-400">
                    Track your completed items below. You can update task statuses as you test the product.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-white">
                    {data.completed_tasks} / {data.total_tasks}
                  </span>
                  <span className="text-xs text-slate-400 ml-1.5">tasks completed ({progressPercent}%)</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700/50">
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

              {/* Quick links footer */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60 text-slate-400">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>{data.completed_tasks} Completed</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span>{data.in_progress_tasks} In Progress</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-slate-600" />
                    <span>{data.total_tasks - data.completed_tasks - data.in_progress_tasks} Remaining</span>
                  </span>
                </div>
                <Link
                  to={`/tester/feedback?campaignId=${campaignId}`}
                  className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                >
                  View feedback history for this campaign &rarr;
                </Link>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1.5 text-xs bg-slate-900/40 p-1 rounded-lg border border-slate-800/80 w-fit">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Tasks ({tasks.length})
              </button>
              <button
                onClick={() => setFilterStatus('in_progress')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  filterStatus === 'in_progress'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                In Progress ({tasks.filter((t) => t.status === 'in_progress').length})
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  filterStatus === 'completed'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Completed ({tasks.filter((t) => t.status === 'completed').length})
              </button>
              <button
                onClick={() => setFilterStatus('not_started')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  filterStatus === 'not_started'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Not Started ({tasks.filter((t) => t.status === 'not_started').length})
              </button>
            </div>

            {/* Task Cards List */}
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12 px-4 bg-slate-900/40 border border-slate-800 rounded-xl">
                <p className="text-sm text-slate-400">No tasks match this filter.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredTasks.map((task) => {
                  const isNoteOpen = expandedNotes[task.id] ?? false;
                  const currentNoteValue =
                    editingNotes[task.id] !== undefined
                      ? editingNotes[task.id]
                      : task.completion_note || '';

                  return (
                    <div
                      key={task.id}
                      className={`bg-slate-900/70 border rounded-xl p-5 transition-all shadow-sm ${
                        task.status === 'completed'
                          ? 'border-emerald-500/30 bg-emerald-950/10'
                          : task.status === 'in_progress'
                          ? 'border-amber-500/30 bg-amber-950/10'
                          : 'border-slate-800/80 hover:border-slate-700/80'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        {/* Left: Task Content */}
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                              Step {task.order}
                            </span>
                            {task.is_required && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/20">
                                Required
                              </span>
                            )}
                            {task.estimated_duration && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {task.estimated_duration}
                              </span>
                            )}
                          </div>

                          <h3
                            className={`text-base font-semibold transition-colors ${
                              task.status === 'completed' ? 'text-slate-200 line-through opacity-80' : 'text-white'
                            }`}
                          >
                            {task.title}
                          </h3>

                          {task.description && (
                            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                              {task.description}
                            </p>
                          )}

                          {task.expected_outcome && (
                            <div className="mt-2 text-xs bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
                              <span className="font-semibold text-slate-300">Expected Outcome: </span>
                              <span className="text-slate-400">{task.expected_outcome}</span>
                            </div>
                          )}

                          {/* Completion note if present and editor closed */}
                          {task.completion_note && !isNoteOpen && (
                            <div className="mt-2 text-xs text-slate-400 italic bg-slate-900/60 p-2 rounded border border-slate-800">
                              <span className="font-semibold text-slate-300 not-italic">Note: </span>
                              &ldquo;{task.completion_note}&rdquo;
                            </div>
                          )}
                        </div>

                        {/* Right: Progress Controls */}
                        <div className="flex flex-col items-end gap-2 min-w-[210px]">
                          {/* Segmented Status Toggle */}
                          <div className="inline-flex rounded-lg bg-slate-800 p-1 border border-slate-700/70 text-xs">
                            <button
                              onClick={() => handleStatusChange(task.id, 'not_started')}
                              disabled={updateProgressMutation.isPending}
                              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                                task.status === 'not_started'
                                  ? 'bg-slate-700 text-white shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                              title="Mark Not Started"
                            >
                              Not Started
                            </button>
                            <button
                              onClick={() => handleStatusChange(task.id, 'in_progress')}
                              disabled={updateProgressMutation.isPending}
                              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                                task.status === 'in_progress'
                                  ? 'bg-amber-600 text-white shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                              title="Mark In Progress"
                            >
                              In Progress
                            </button>
                            <button
                              onClick={() => handleStatusChange(task.id, 'completed')}
                              disabled={updateProgressMutation.isPending}
                              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                                task.status === 'completed'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                              title="Mark Completed"
                            >
                              Completed
                            </button>
                          </div>

                          {/* Completed Timestamp */}
                          {task.completed_at && (
                            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Completed {new Date(task.completed_at).toLocaleDateString()}
                            </span>
                          )}

                          {/* Toggle Note / Add Note button */}
                          <button
                            onClick={() =>
                              setExpandedNotes((prev) => ({ ...prev, [task.id]: !isNoteOpen }))
                            }
                            className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
                          >
                            <span>{task.completion_note ? 'Edit Note' : '+ Add Note'}</span>
                            {isNoteOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Note Editor */}
                      {isNoteOpen && (
                        <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                          <label className="text-xs font-medium text-slate-300 block">
                            Observation or Task Note (optional):
                          </label>
                          <textarea
                            rows={2}
                            value={currentNoteValue}
                            onChange={(e) =>
                              setEditingNotes((prev) => ({ ...prev, [task.id]: e.target.value }))
                            }
                            placeholder="Add any specific details, quirks, or notes about this step..."
                            className="w-full text-xs p-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setExpandedNotes((prev) => ({ ...prev, [task.id]: false }))}
                              className="text-xs px-2.5 py-1 rounded text-slate-400 hover:text-slate-200"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveNote(task.id, task.status)}
                              disabled={updateProgressMutation.isPending}
                              className="text-xs px-3 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Access Instructions Modal */}
      {isAccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Key className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Confidential Product Access</h3>
              </div>
              <button
                onClick={() => setIsAccessModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isAccessLoading && (
              <div className="py-8 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="h-6 w-6 text-emerald-400 animate-spin" />
                <p className="text-xs text-slate-400">Retrieving confidential instructions...</p>
              </div>
            )}

            {isAccessError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg">
                {accessError instanceof Error
                  ? accessError.message
                  : 'Unable to retrieve access instructions.'}
              </div>
            )}

            {!isAccessLoading && !isAccessError && accessData && (
              <div className="space-y-4 text-xs">
                {accessData.product_url && (
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Product / Testing URL</label>
                    <a
                      href={accessData.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 underline break-all font-mono"
                    >
                      <span>{accessData.product_url}</span>
                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                    </a>
                  </div>
                )}

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Private Instructions &amp; Keys</label>
                  <div className="p-3.5 bg-slate-950/80 rounded-lg border border-slate-800 text-slate-200 font-mono text-xs whitespace-pre-wrap leading-relaxed select-all">
                    {accessData.access_instructions || 'No specific confidential instructions provided.'}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 italic">
                  Note: Confidential access credentials and links are strictly for authorized beta testers.
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsAccessModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

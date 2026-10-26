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
    <div className="min-h-[calc(100vh-140px)] bg-[#F6F5ED] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Navigation & Header */}
        <div className="pb-6 border-b border-[#DCE7E3]">
          <div className="flex items-center space-x-2 text-xs text-[#52656B] mb-2">
            <Link to="/tester" className="hover:text-[#07545A] transition-colors">
              Workspace
            </Link>
            <span>/</span>
            <Link to="/tester/tasks" className="hover:text-[#07545A] transition-colors">
              My Tasks
            </Link>
            <span>/</span>
            <span className="text-[#087C80] font-semibold truncate max-w-[200px]">
              {data?.campaign_title || 'Testing Workspace'}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-[#07545A] uppercase tracking-wider">
                  {data?.startup_name}
                </span>
                {data?.product_type && (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#EFEFE5] border border-[#DCE7E3] text-[#102A35] font-medium">
                    {data.product_type}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#102A35] mt-1">
                {data?.campaign_title || 'Campaign Testing Workspace'}
              </h1>
            </div>

            {/* Header Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Product Access Button */}
              <button
                onClick={handleOpenAccess}
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-full bg-white hover:bg-[#EFEFE5] text-[#07545A] border border-[#BCE1DA] shadow-xs transition-all cursor-pointer"
              >
                <Key className="h-3.5 w-3.5" />
                <span>Product Instructions</span>
              </button>

              {/* Bug Report Button */}
              <Link
                to={`/tester/campaigns/${campaignId}/feedback/new?type=bug_report`}
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-full bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 shadow-xs transition-all"
              >
                <Bug className="h-3.5 w-3.5 text-rose-600" />
                <span>Report Bug</span>
              </Link>

              {/* General Feedback Button */}
              <Link
                to={`/tester/campaigns/${campaignId}/feedback/new?type=general_feedback`}
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-full bg-[#07545A] hover:bg-[#087C80] text-white shadow-xs transition-all"
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
            <div className="h-24 bg-white border border-[#DCE7E3] rounded-3xl animate-pulse shadow-xs" />
            <div className="h-48 bg-white border border-[#DCE7E3] rounded-3xl animate-pulse shadow-xs" />
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-600" />
              <span className="text-sm font-medium">
                {error instanceof Error ? error.message : 'Failed to load campaign tasks.'}
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

        {/* Main Content */}
        {!isLoading && !isError && data && (
          <>
            {/* Progress Summary Card */}
            <div className="bg-white border border-[#DCE7E3] rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-[#102A35]">Your Testing Progress</h2>
                  <p className="text-xs text-[#52656B]">
                    Track your completed items below. You can update task statuses as you test the product.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-[#102A35]">
                    {data.completed_tasks} / {data.total_tasks}
                  </span>
                  <span className="text-xs text-[#52656B] ml-1.5">tasks completed ({progressPercent}%)</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#EFEFE5] rounded-full h-2.5 overflow-hidden border border-[#DCE7E3]">
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

              {/* Quick links footer */}
              <div className="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-[#DCE7E3] text-[#52656B] gap-2">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    <span>{data.completed_tasks} Completed</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span>{data.in_progress_tasks} In Progress</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#52656B]" />
                    <span>{data.total_tasks - data.completed_tasks - data.in_progress_tasks} Remaining</span>
                  </span>
                </div>
                <Link
                  to={`/tester/feedback?campaignId=${campaignId}`}
                  className="text-[#07545A] hover:text-[#087C80] font-semibold transition-colors"
                >
                  View feedback history for this campaign &rarr;
                </Link>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-full font-semibold transition-colors border ${
                  filterStatus === 'all'
                    ? 'bg-[#07545A] text-white border-[#07545A] shadow-xs'
                    : 'bg-white text-[#52656B] border-[#DCE7E3] hover:text-[#102A35]'
                }`}
              >
                All Tasks ({tasks.length})
              </button>
              <button
                onClick={() => setFilterStatus('in_progress')}
                className={`px-4 py-2 rounded-full font-semibold transition-colors border ${
                  filterStatus === 'in_progress'
                    ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                    : 'bg-white text-[#52656B] border-[#DCE7E3] hover:text-[#102A35]'
                }`}
              >
                In Progress ({tasks.filter((t) => t.status === 'in_progress').length})
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`px-4 py-2 rounded-full font-semibold transition-colors border ${
                  filterStatus === 'completed'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300 shadow-xs'
                    : 'bg-white text-[#52656B] border-[#DCE7E3] hover:text-[#102A35]'
                }`}
              >
                Completed ({tasks.filter((t) => t.status === 'completed').length})
              </button>
              <button
                onClick={() => setFilterStatus('not_started')}
                className={`px-4 py-2 rounded-full font-semibold transition-colors border ${
                  filterStatus === 'not_started'
                    ? 'bg-[#EFEFE5] text-[#102A35] border-[#DCE7E3] shadow-xs'
                    : 'bg-white text-[#52656B] border-[#DCE7E3] hover:text-[#102A35]'
                }`}
              >
                Not Started ({tasks.filter((t) => t.status === 'not_started').length})
              </button>
            </div>

            {/* Task Cards List */}
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12 px-4 bg-white border border-[#DCE7E3] rounded-3xl shadow-xs">
                <p className="text-sm text-[#52656B]">No tasks match this filter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTasks.map((task) => {
                  const isNoteOpen = expandedNotes[task.id] ?? false;
                  const currentNoteValue =
                    editingNotes[task.id] !== undefined
                      ? editingNotes[task.id]
                      : task.completion_note || '';

                  return (
                    <div
                      key={task.id}
                      className={`bg-white border rounded-3xl p-6 sm:p-7 transition-all shadow-xs ${
                        task.status === 'completed'
                          ? 'border-emerald-200'
                          : task.status === 'in_progress'
                          ? 'border-amber-200'
                          : 'border-[#DCE7E3] hover:border-[#087C80]/50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        {/* Left: Task Content */}
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EFEFE5] text-[#102A35] border border-[#DCE7E3]">
                              Step {task.order}
                            </span>
                            {task.is_required && (
                              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA]">
                                Required
                              </span>
                            )}
                            {task.estimated_duration && (
                              <span className="text-[10px] text-[#52656B] flex items-center gap-1">
                                <Clock className="h-3 w-3 text-[#07545A]" />
                                {task.estimated_duration}
                              </span>
                            )}
                          </div>

                          <h3
                            className={`text-base font-bold transition-colors ${
                              task.status === 'completed' ? 'text-[#52656B] line-through opacity-80' : 'text-[#102A35]'
                            }`}
                          >
                            {task.title}
                          </h3>

                          {task.description && (
                            <p className="text-xs text-[#52656B] leading-relaxed whitespace-pre-line">
                              {task.description}
                            </p>
                          )}

                          {task.expected_outcome && (
                            <div className="mt-2 text-xs bg-[#F6F5ED] p-3.5 rounded-2xl border border-[#DCE7E3]">
                              <span className="font-semibold text-[#102A35]">Expected Outcome: </span>
                              <span className="text-[#52656B]">{task.expected_outcome}</span>
                            </div>
                          )}

                          {/* Completion note if present and editor closed */}
                          {task.completion_note && !isNoteOpen && (
                            <div className="mt-2 text-xs text-[#52656B] italic bg-[#F6F5ED] p-3 rounded-xl border border-[#DCE7E3]">
                              <span className="font-semibold text-[#102A35] not-italic">Note: </span>
                              &ldquo;{task.completion_note}&rdquo;
                            </div>
                          )}
                        </div>

                        {/* Right: Progress Controls */}
                        <div className="flex flex-col items-end gap-2 min-w-[210px]">
                          {/* Segmented Status Toggle */}
                          <div className="inline-flex rounded-full bg-[#EFEFE5] p-1 border border-[#DCE7E3] text-xs">
                            <button
                              onClick={() => handleStatusChange(task.id, 'not_started')}
                              disabled={updateProgressMutation.isPending}
                              className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                                task.status === 'not_started'
                                  ? 'bg-white text-[#102A35] shadow-xs'
                                  : 'text-[#52656B] hover:text-[#102A35]'
                              }`}
                              title="Mark Not Started"
                            >
                              Not Started
                            </button>
                            <button
                              onClick={() => handleStatusChange(task.id, 'in_progress')}
                              disabled={updateProgressMutation.isPending}
                              className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                                task.status === 'in_progress'
                                  ? 'bg-amber-100 text-amber-900 shadow-xs'
                                  : 'text-[#52656B] hover:text-[#102A35]'
                              }`}
                              title="Mark In Progress"
                            >
                              In Progress
                            </button>
                            <button
                              onClick={() => handleStatusChange(task.id, 'completed')}
                              disabled={updateProgressMutation.isPending}
                              className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                                task.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-900 shadow-xs'
                                  : 'text-[#52656B] hover:text-[#102A35]'
                              }`}
                              title="Mark Completed"
                            >
                              Completed
                            </button>
                          </div>

                          {/* Completed Timestamp */}
                          {task.completed_at && (
                            <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Completed {new Date(task.completed_at).toLocaleDateString()}
                            </span>
                          )}

                          {/* Toggle Note / Add Note button */}
                          <button
                            onClick={() =>
                              setExpandedNotes((prev) => ({ ...prev, [task.id]: !isNoteOpen }))
                            }
                            className="text-[11px] text-[#07545A] hover:text-[#087C80] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>{task.completion_note ? 'Edit Note' : '+ Add Note'}</span>
                            {isNoteOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Note Editor */}
                      {isNoteOpen && (
                        <div className="mt-4 pt-4 border-t border-[#DCE7E3] space-y-2">
                          <label className="text-xs font-semibold text-[#102A35] block">
                            Observation or Task Note (optional):
                          </label>
                          <textarea
                            rows={2}
                            value={currentNoteValue}
                            onChange={(e) =>
                              setEditingNotes((prev) => ({ ...prev, [task.id]: e.target.value }))
                            }
                            placeholder="Add any specific details, quirks, or notes about this step..."
                            className="w-full text-xs p-3 bg-white border border-[#DCE7E3] rounded-xl text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:border-[#087C80]"
                          />
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              onClick={() => setExpandedNotes((prev) => ({ ...prev, [task.id]: false }))}
                              className="text-xs px-3 py-1.5 rounded-full text-[#52656B] hover:text-[#102A35] hover:bg-[#EFEFE5] transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveNote(task.id, task.status)}
                              disabled={updateProgressMutation.isPending}
                              className="text-xs px-4 py-1.5 rounded-full bg-[#07545A] hover:bg-[#087C80] text-white font-semibold shadow-xs transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-[#DCE7E3] rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE7E3]">
              <div className="flex items-center space-x-2 text-emerald-800">
                <Key className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-[#102A35]">Confidential Product Access</h3>
              </div>
              <button
                onClick={() => setIsAccessModalOpen(false)}
                className="text-[#52656B] hover:text-[#102A35] p-1 rounded-full hover:bg-[#EFEFE5]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isAccessLoading && (
              <div className="py-8 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="h-6 w-6 text-[#07545A] animate-spin" />
                <p className="text-xs text-[#52656B]">Retrieving confidential instructions...</p>
              </div>
            )}

            {isAccessError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl">
                {accessError instanceof Error
                  ? accessError.message
                  : 'Unable to retrieve access instructions.'}
              </div>
            )}

            {!isAccessLoading && !isAccessError && accessData && (
              <div className="space-y-4 text-xs">
                {accessData.product_url && (
                  <div>
                    <label className="text-[#52656B] block mb-1 font-semibold">Product / Testing URL</label>
                    <a
                      href={accessData.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#07545A] hover:text-[#087C80] flex items-center gap-1 font-mono font-medium underline break-all"
                    >
                      <span>{accessData.product_url}</span>
                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                    </a>
                  </div>
                )}

                <div>
                  <label className="text-[#52656B] block mb-1 font-semibold">Private Instructions &amp; Keys</label>
                  <div className="p-4 bg-[#F6F5ED] rounded-2xl border border-[#DCE7E3] text-[#102A35] font-mono text-xs whitespace-pre-wrap leading-relaxed select-all">
                    {accessData.access_instructions || 'No specific confidential instructions provided.'}
                  </div>
                </div>

                <p className="text-[11px] text-[#52656B] italic">
                  Note: Confidential access credentials and links are strictly for authorized beta testers.
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsAccessModalOpen(false)}
                className="px-5 py-2 text-xs font-semibold rounded-full bg-[#EFEFE5] hover:bg-[#DCE7E3] text-[#102A35] transition-colors"
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

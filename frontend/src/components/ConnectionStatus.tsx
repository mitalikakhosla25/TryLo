import React from 'react';
import {
  Server,
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useApiHealth, useDbHealth } from '../api/health';
import { API_BASE_URL } from '../api/client';

export const ConnectionStatus: React.FC = () => {
  const apiQuery = useApiHealth();
  const dbQuery = useDbHealth();

  const handleRefresh = () => {
    apiQuery.refetch();
    dbQuery.refetch();
  };

  const isRefreshing = apiQuery.isFetching || dbQuery.isFetching;

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <h2 className="text-lg font-semibold text-white tracking-tight">
              Backend &amp; Database Health Diagnostics
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Targeting API Base URL:{' '}
            <code className="text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
              {API_BASE_URL}
            </code>
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center justify-center space-x-2 text-xs font-medium px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Checking...' : 'Refresh Status'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Backend API Service Card */}
        <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    FastAPI Process
                  </h3>
                  <p className="text-xs text-slate-400">GET /api/health</p>
                </div>
              </div>

              {/* Status Badge */}
              {apiQuery.isLoading ? (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Checking...</span>
                </span>
              ) : apiQuery.isSuccess ? (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Operational</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Offline</span>
                </span>
              )}
            </div>

            <div className="text-xs space-y-2 text-slate-400">
              {apiQuery.isLoading && (
                <p className="text-slate-500 italic">Verifying API response...</p>
              )}

              {apiQuery.isSuccess && (
                <div className="space-y-1 bg-slate-900/70 rounded-lg p-3 border border-slate-800/50">
                  <div className="flex justify-between">
                    <span>Application:</span>
                    <span className="text-slate-200 font-medium">
                      {apiQuery.data.app}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Environment:</span>
                    <span className="text-indigo-300 font-mono">
                      {apiQuery.data.environment}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Timestamp:</span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      {new Date(apiQuery.data.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              )}

              {apiQuery.isError && (
                <div className="bg-rose-950/30 border border-rose-900/50 rounded-lg p-3 text-rose-300 text-xs space-y-1.5">
                  <p className="font-medium text-rose-200">
                    Cannot connect to backend server
                  </p>
                  <p className="text-[11px] text-rose-400/90">
                    {apiQuery.error.message}
                  </p>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Start the backend in PowerShell:
                    <br />
                    <code className="text-slate-200 font-mono bg-slate-900 px-1 py-0.5 rounded">
                      .\.venv\Scripts\uvicorn.exe app.main:app --reload
                    </code>
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex justify-between items-center text-[11px] text-slate-400">
            <span>FastAPI v0.115+</span>
            <a
              href={`${API_BASE_URL}/api/health`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-400 flex items-center space-x-1 transition-colors"
            >
              <span>Raw JSON</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        </div>

        {/* Supabase Database Connection Card */}
        <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    Supabase PostgreSQL
                  </h3>
                  <p className="text-xs text-slate-400">GET /api/health/db</p>
                </div>
              </div>

              {/* Status Badge */}
              {dbQuery.isLoading ? (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Testing...</span>
                </span>
              ) : dbQuery.isSuccess && dbQuery.data.status === 'ok' ? (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Connected</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Not Connected</span>
                </span>
              )}
            </div>

            <div className="text-xs space-y-2 text-slate-400">
              {dbQuery.isLoading && (
                <p className="text-slate-500 italic">
                  Executing test query via SQLAlchemy...
                </p>
              )}

              {dbQuery.isSuccess && dbQuery.data.status === 'ok' && (
                <div className="space-y-1 bg-slate-900/70 rounded-lg p-3 border border-slate-800/50">
                  <div className="flex justify-between">
                    <span>Database State:</span>
                    <span className="text-emerald-400 font-semibold">Active</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Query Latency (SELECT 1):</span>
                    <span className="text-indigo-300 font-mono flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{dbQuery.data.latency_ms ?? 0} ms</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Driver:</span>
                    <span className="text-slate-300 font-mono">SQLAlchemy 2.x + Psycopg 3</span>
                  </div>
                </div>
              )}

              {(!dbQuery.isSuccess || dbQuery.data?.status !== 'ok') && !dbQuery.isLoading && (
                <div className="bg-amber-950/20 border border-amber-900/40 rounded-lg p-3 text-amber-300 text-xs space-y-1.5">
                  <p className="font-semibold text-amber-200">
                    Configuration Required
                  </p>
                  <p className="text-[11px] text-amber-300/80 leading-relaxed">
                    {dbQuery.error?.message ||
                      dbQuery.data?.error ||
                      'DATABASE_URL is not configured in backend/.env.'}
                  </p>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Add your Supabase PostgreSQL connection URI to{' '}
                    <code className="text-slate-200 font-mono bg-slate-900 px-1 py-0.5 rounded">
                      backend/.env
                    </code>
                    , then click <strong>Refresh Status</strong> above.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex justify-between items-center text-[11px] text-slate-400">
            <span>Psycopg 3 Driver</span>
            <a
              href={`${API_BASE_URL}/api/health/db`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-400 flex items-center space-x-1 transition-colors"
            >
              <span>Raw JSON</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

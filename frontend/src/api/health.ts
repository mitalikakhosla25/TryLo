/**
 * Health Check API Types and TanStack Query Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiError } from './client';

export interface ApiHealthResponse {
  status: string;
  app: string;
  environment: string;
  timestamp: string;
}

export interface DbHealthResponse {
  status: string;
  database: string;
  latency_ms: number | null;
  timestamp: string;
  error?: string | null;
}

export function useApiHealth() {
  return useQuery<ApiHealthResponse, ApiError>({
    queryKey: ['health', 'api'],
    queryFn: () => apiClient<ApiHealthResponse>('/api/health'),
    refetchInterval: 10000,
    retry: 1,
  });
}

export function useDbHealth() {
  return useQuery<DbHealthResponse, ApiError>({
    queryKey: ['health', 'db'],
    queryFn: () => apiClient<DbHealthResponse>('/api/health/db'),
    refetchInterval: 15000,
    retry: false, // Don't spam retries if DB is intentionally not yet configured
  });
}

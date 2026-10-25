/**
 * TryLo Authentication API Module
 */

import { apiClient } from './client';

export type UserRole = 'founder' | 'tester';

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface MessageResponse {
  message: string;
}

/**
 * Register a new user account with TryLo.
 */
export async function registerUser(payload: RegisterRequest): Promise<UserResponse> {
  return apiClient<UserResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Log into TryLo. Sets HttpOnly session cookie on success.
 */
export async function loginUser(payload: LoginRequest): Promise<UserResponse> {
  return apiClient<UserResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch profile of currently authenticated user using session cookie.
 */
export async function getCurrentUser(): Promise<UserResponse> {
  return apiClient<UserResponse>('/api/auth/me', {
    method: 'GET',
  });
}

/**
 * Log out of TryLo and clear session cookies.
 */
export async function logoutUser(): Promise<MessageResponse> {
  return apiClient<MessageResponse>('/api/auth/logout', {
    method: 'POST',
  });
}

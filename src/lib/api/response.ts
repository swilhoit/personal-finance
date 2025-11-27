/**
 * Standardized API Response Utilities
 *
 * Provides consistent response formats across all API routes.
 */

import { NextResponse } from 'next/server';

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    count?: number;
    page?: number;
    totalPages?: number;
  };
}

/**
 * Creates a successful API response
 */
export function successResponse<T>(
  data: T,
  meta?: ApiResponse['meta'],
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta,
    },
    { status }
  );
}

/**
 * Creates an error API response
 */
export function errorResponse(
  message: string,
  status = 500,
  details?: unknown
): NextResponse<ApiResponse> {
  const response: ApiResponse = {
    success: false,
    error: message,
  };

  // Include details in development
  if (process.env.NODE_ENV === 'development' && details) {
    (response as ApiResponse & { details: unknown }).details = details;
  }

  return NextResponse.json(response, { status });
}

/**
 * Common error responses
 */
export const ApiErrors = {
  unauthorized: () => errorResponse('Unauthorized', 401),
  forbidden: () => errorResponse('Forbidden', 403),
  notFound: (resource = 'Resource') => errorResponse(`${resource} not found`, 404),
  badRequest: (message = 'Bad request') => errorResponse(message, 400),
  validationError: (field: string) => errorResponse(`Invalid ${field}`, 400),
  serverError: (message = 'Internal server error') => errorResponse(message, 500),
};

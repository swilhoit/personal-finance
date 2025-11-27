import { describe, it, expect } from 'vitest';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';

describe('API Response Utilities', () => {
  describe('successResponse', () => {
    it('should create a success response with data', async () => {
      const data = { id: 1, name: 'test' };
      const response = successResponse(data);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(data);
    });

    it('should include meta information when provided', async () => {
      const data = [1, 2, 3];
      const meta = { count: 3, page: 1 };
      const response = successResponse(data, meta);
      const body = await response.json();

      expect(body.meta).toEqual(meta);
    });

    it('should use custom status code', async () => {
      const response = successResponse({ created: true }, undefined, 201);
      expect(response.status).toBe(201);
    });
  });

  describe('errorResponse', () => {
    it('should create an error response', async () => {
      const response = errorResponse('Something went wrong');
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Something went wrong');
    });

    it('should use custom status code', async () => {
      const response = errorResponse('Not found', 404);
      expect(response.status).toBe(404);
    });
  });

  describe('ApiErrors', () => {
    it('should create unauthorized error', async () => {
      const response = ApiErrors.unauthorized();
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('should create not found error with custom resource', async () => {
      const response = ApiErrors.notFound('User');
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe('User not found');
    });

    it('should create validation error', async () => {
      const response = ApiErrors.validationError('email');
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Invalid email');
    });

    it('should create bad request error', async () => {
      const response = ApiErrors.badRequest('Missing required field');
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Missing required field');
    });
  });
});

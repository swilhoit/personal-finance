import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { verifyCronRequest } from '@/lib/api/cron-auth';
import { NextRequest } from 'next/server';

describe('Cron Authentication', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  function createRequest(authHeader?: string): NextRequest {
    const headers = new Headers();
    if (authHeader) {
      headers.set('authorization', authHeader);
    }
    return new NextRequest('http://localhost/api/cron', { headers });
  }

  it('should allow requests with valid CRON_SECRET', () => {
    process.env.CRON_SECRET = 'test-secret';
    const request = createRequest('Bearer test-secret');

    const result = verifyCronRequest(request);
    expect(result).toBeNull();
  });

  it('should reject requests without authorization header', async () => {
    process.env.CRON_SECRET = 'test-secret';
    const request = createRequest();

    const result = verifyCronRequest(request);
    expect(result).not.toBeNull();
    expect(result?.status).toBe(401);
  });

  it('should reject requests with wrong secret', async () => {
    process.env.CRON_SECRET = 'test-secret';
    const request = createRequest('Bearer wrong-secret');

    const result = verifyCronRequest(request);
    expect(result).not.toBeNull();
    expect(result?.status).toBe(401);
  });

  it('should allow requests in development without secret configured', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.CRON_SECRET;
    const request = createRequest();

    const result = verifyCronRequest(request);
    expect(result).toBeNull();
  });

  it('should return 500 if CRON_SECRET not configured in production', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.CRON_SECRET;
    const request = createRequest('Bearer some-token');

    const result = verifyCronRequest(request);
    expect(result).not.toBeNull();
    expect(result?.status).toBe(500);
  });
});

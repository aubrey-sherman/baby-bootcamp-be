import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { getDatabaseUri } from './config.js';

describe('getDatabaseUri', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('returns test database URL when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test';

    const result = getDatabaseUri();

    expect(result).toBe('postgresql:///baby_bootcamp_test');
  });

  test('returns production database URL when NODE_ENV is production and PRODUCTION_DATABASE_URL is set', () => {
    process.env.NODE_ENV = 'production';
    process.env.PRODUCTION_DATABASE_URL = 'postgres://prod-user:pass@prod-host:5432/prod-db';

    const result = getDatabaseUri();

    expect(result).toBe('postgres://prod-user:pass@prod-host:5432/prod-db');
  });

  test('returns fallback production database URL when NODE_ENV is production but PRODUCTION_DATABASE_URL is not set', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.PRODUCTION_DATABASE_URL;

    const result = getDatabaseUri();

    expect(result).toBe('postgresql:///baby_bootcamp');
  });

  test('returns local development database URL when NODE_ENV is development and LOCAL_DATABASE_URL is set', () => {
    process.env.NODE_ENV = 'development';
    process.env.LOCAL_DATABASE_URL = 'postgresql://dev-user:pass@localhost:5432/dev-db';

    const result = getDatabaseUri();

    expect(result).toBe('postgresql://dev-user:pass@localhost:5432/dev-db');
  });

  test('returns fallback development database URL when NODE_ENV is development but LOCAL_DATABASE_URL is not set', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.LOCAL_DATABASE_URL;

    const result = getDatabaseUri();

    expect(result).toBe('postgresql:///baby_bootcamp');
  });

  test('returns local development database URL when NODE_ENV is not set (defaults to development)', () => {
    delete process.env.NODE_ENV;
    process.env.LOCAL_DATABASE_URL = 'postgresql://default-user:pass@localhost:5432/default-db';

    const result = getDatabaseUri();

    expect(result).toBe('postgresql://default-user:pass@localhost:5432/default-db');
  });

  test('returns fallback database URL when no environment variables are set', () => {
    delete process.env.NODE_ENV;
    delete process.env.LOCAL_DATABASE_URL;
    delete process.env.PRODUCTION_DATABASE_URL;

    const result = getDatabaseUri();

    expect(result).toBe('postgresql:///baby_bootcamp');
  });

  test('handles unknown NODE_ENV values by defaulting to development behavior', () => {
    process.env.NODE_ENV = 'staging';
    process.env.LOCAL_DATABASE_URL = 'postgresql://staging-user:pass@localhost:5432/staging-db';

    const result = getDatabaseUri();

    expect(result).toBe('postgresql://staging-user:pass@localhost:5432/staging-db');
  });
});
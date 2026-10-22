import { describe, expect, test } from 'vitest';
import { assertLegacyLocalMutationAllowed } from '../../scripts/lib/legacy-local-guard';
import { parseResetUserVoucherArgs } from '../../scripts/lib/reset-user-voucher-args';

const local = {
  ENABLE_LOCAL_LEGACY_MUTATIONS: '1', NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://postgres@127.0.0.1:55432/jazz_maintenance',
};

describe('legacy CLI disposable target guard', () => {
  test.each([
    'postgresql://postgres@127.0.0.1:55432/jazz_maintenance',
    'postgres://postgres@localhost:56122/postgres?schema=public&connection_limit=1&pool_timeout=10',
  ])('accepts only explicit disposable database %s', DATABASE_URL => {
    expect(() => assertLegacyLocalMutationAllowed({}, { ...local, DATABASE_URL })).not.toThrow();
  });

  test.each([undefined, '', '0', 'true', 'yes'])('requires its own literal opt-in: %s', flag => {
    expect(() => assertLegacyLocalMutationAllowed({}, {
      ...local, ENABLE_LOCAL_LEGACY_MUTATIONS: flag,
      ENABLE_LOCAL_TEST_CHECKOUT: '1', ENABLE_LOCAL_TEST_RESETS: '1', CONFIRM: 'WIPE-USER-ACTIVITY',
    })).toThrow(/invalid opt-in/);
  });

  test.each([undefined, '', 'production', 'preview'])('rejects runtime environment %s', NODE_ENV => {
    expect(() => assertLegacyLocalMutationAllowed({}, { ...local, NODE_ENV })).toThrow(/invalid environment/);
  });
  test.each(['production', ' Production '])('rejects Vercel production %s', VERCEL_ENV => {
    expect(() => assertLegacyLocalMutationAllowed({}, { ...local, VERCEL_ENV })).toThrow(/invalid environment/);
  });

  test.each([
    undefined, '', 'malformed', 'https://127.0.0.1:55432/jazz_maintenance',
    'postgresql://fixture:private-marker@project.supabase.co:5432/postgres',
    'postgresql://postgres@localhost.attacker.test:55432/jazz_maintenance',
    'postgresql://postgres@127.0.0.1:5432/jazz_maintenance',
    'postgresql://postgres@127.0.0.1:55432/postgres',
    'postgresql://postgres@127.0.0.1:56122/jazz_maintenance',
    'postgresql://postgres@127.0.0.1:56122/customer_database',
    'postgresql://postgres@127.0.0.1:55432/jazz_maintenance?host=project.supabase.co',
    'postgresql://postgres@127.0.0.1:55432/jazz_maintenance?service=production',
    'postgresql://postgres@127.0.0.1:56122/postgres?schema=auth',
    'postgresql://postgres@127.0.0.1:56122/postgres?schema=public&schema=auth',
    'postgresql://postgres@127.0.0.1:56122/postgres?connection_limit=1&connection_limit=2',
    'postgresql://postgres@127.0.0.1:56122/postgres?options=host%3Dremote',
    'postgresql://postgres@127.0.0.1:56122/postgres#private-marker',
  ])('rejects missing, external or overridable datasource %s', DATABASE_URL => {
    let message = '';
    try { assertLegacyLocalMutationAllowed({}, { ...local, DATABASE_URL }); }
    catch (error) { message = (error as Error).message; }
    expect(message).toMatch(/invalid database/);
    expect(message).not.toContain('private-marker');
    expect(message).not.toContain('postgresql://');
  });

  test.each(['http://127.0.0.1:56121', 'http://localhost:56121/'])('allows dedicated Auth/storage origin %s', origin => {
    expect(() => assertLegacyLocalMutationAllowed({ supabase: true }, { ...local, NEXT_PUBLIC_SUPABASE_URL: origin })).not.toThrow();
  });
  test.each([
    undefined, '', 'https://project.supabase.co', 'http://127.0.0.1:54321',
    'http://localhost.attacker.test:56121', 'https://127.0.0.1:56121',
    'http://private-marker@127.0.0.1:56121', 'http://127.0.0.1:56121/path',
    'http://127.0.0.1:56121?project=remote', 'http://127.0.0.1:56121#private-marker',
  ])('rejects nonisolated Auth/storage origin %s', origin => {
    expect(() => assertLegacyLocalMutationAllowed({ supabase: true }, { ...local, NEXT_PUBLIC_SUPABASE_URL: origin })).toThrow(/invalid supabase/);
  });
  test('rejects a remote secondary alias despite a local primary origin', () => {
    expect(() => assertLegacyLocalMutationAllowed({ supabase: true }, {
      ...local, NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:56121', SUPABASE_URL: 'https://project.supabase.co',
    })).toThrow(/invalid supabase/);
  });
});

describe('voucher reset explicit plan and scope', () => {
  const scope = ['--user-id=fixture-user', '--course-id=fixture-course'];
  test('defaults to a dry-run for an explicit user and course', () => {
    expect(parseResetUserVoucherArgs(scope)).toEqual({ userId: 'fixture-user', courseId: 'fixture-course', codes: [], dryRun: true });
  });
  test('only --apply enables execution', () => {
    expect(parseResetUserVoucherArgs([...scope, '--apply']).dryRun).toBe(false);
    expect(parseResetUserVoucherArgs([...scope, '--dry-run']).dryRun).toBe(true);
  });
  test.each([[], ['--user-id=fixture-user'], ['--course-id=fixture-course'], [...scope, '--course-id=']].map(argv => [argv]))('rejects incomplete scope %j', argv => {
    expect(() => parseResetUserVoucherArgs(argv)).toThrow(/Both --user-id/);
  });
  test.each([[...scope, '--apply', '--dry-run'], [...scope, '--dry-run', '--apply']].map(argv => [argv]))('rejects contradictory execution flags %j', argv => {
    expect(() => parseResetUserVoucherArgs(argv)).toThrow(/Choose either/);
  });
  test('rejects arbitrary arguments without echoing private input', () => {
    expect(() => parseResetUserVoucherArgs([...scope, '--private=secret-marker'])).toThrow('Unknown reset argument.');
  });
});

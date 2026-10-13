import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(), getSession: vi.fn(), progress: vi.fn(), profile: vi.fn(), recognition: vi.fn(),
}));
vi.mock('react', () => ({ cache: <T>(fn: T) => fn }));
vi.mock('@/utils/supabase/server', () => ({ createClient: () => ({ auth: {
  getUser: mocks.getUser, getSession: mocks.getSession,
} }) }));
vi.mock('@/lib/jazz-medal-progress', () => ({
  getUserJazzMedalProgress: mocks.progress,
  getUserJazzMedalProfile: mocks.profile,
  getUserCourseCompletionRecognition: mocks.recognition,
}));

import { GET as progress } from '@/app/api/dashboard/quiz-medals/route';
import { GET as profile } from '@/app/api/dashboard/quiz-medals/profile/route';
import { GET as recognition } from '@/app/api/dashboard/course-completion-recognition/route';

const endpoints = [
  { name: 'medals', invoke: () => progress() },
  { name: 'profile', invoke: () => profile(new Request('https://example.test/api/profile?language=pt&userId=forged-cookie-user')) },
  { name: 'recognition', invoke: () => recognition() },
];

describe('medal APIs require a verified actor before granting owner access', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'forged-cookie-user', email: 'owner@example.test' } } } });
    mocks.progress.mockResolvedValue({ platinumMedalCount: 1 });
    mocks.profile.mockResolvedValue({ lessons: [] });
    mocks.recognition.mockResolvedValue({ isEligible: false });
  });

  test.each(endpoints)('$name rejects invalid authentication even if user data is populated', async ({ invoke }) => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'invalid-user', email: 'owner@example.test' } }, error: new Error('Token rejected') });
    expect((await invoke()).status).toBe(401);
    expect(mocks.progress).not.toHaveBeenCalled();
    expect(mocks.profile).not.toHaveBeenCalled();
    expect(mocks.recognition).not.toHaveBeenCalled();
    expect(mocks.getSession).not.toHaveBeenCalled();
  });

  test.each(endpoints)('$name ignores cookie identities when the verifier finds no user', async ({ invoke }) => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await invoke()).status).toBe(401);
    expect(mocks.progress).not.toHaveBeenCalled();
    expect(mocks.profile).not.toHaveBeenCalled();
    expect(mocks.recognition).not.toHaveBeenCalled();
  });

  test('every medal view passes only verified identity and email to the entitlement policy', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'verified-user', email: 'verified@example.test' } }, error: null });
    for (const endpoint of endpoints) expect((await endpoint.invoke()).status).toBe(200);
    expect(mocks.progress).toHaveBeenCalledWith('verified-user', 'verified@example.test');
    expect(mocks.profile).toHaveBeenCalledWith('verified-user', 'pt', 'verified@example.test');
    expect(mocks.recognition).toHaveBeenCalledWith('verified-user', 'verified@example.test');
    expect(mocks.getSession).not.toHaveBeenCalled();
  });
});

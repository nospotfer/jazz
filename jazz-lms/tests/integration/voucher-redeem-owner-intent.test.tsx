// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import RedeemPage from '@/app/redeem/page';

const mocks = vi.hoisted(() => ({
  post: vi.fn(), push: vi.fn(), toastError: vi.fn(), toastSuccess: vi.fn(), fetch: vi.fn(),
  language: 'en', initialOwner: 'synthetic-redeem-owner' as string | null | undefined,
  listeners: new Set<(event: string, session: unknown) => void>(),
}));
const OWNER = 'synthetic-redeem-owner';
const OTHER = 'synthetic-redeem-other-owner';
const params = new URLSearchParams('courseId=synthetic-course');
vi.mock('axios', () => ({ default: {
  post: mocks.post,
  isAxiosError: (error: unknown) => Boolean(error && typeof error === 'object' && 'isAxiosError' in error),
} }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }), useSearchParams: () => params }));
vi.mock('sonner', () => ({ toast: { error: mocks.toastError, success: mocks.toastSuccess } }));
vi.mock('@/components/providers/language-provider', () => ({ useLanguage: () => ({ language: mocks.language }) }));
vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({ auth: {
  onAuthStateChange: (listener: (event: string, session: unknown) => void) => {
    mocks.listeners.add(listener);
    if (mocks.initialOwner !== undefined) listener('INITIAL_SESSION', mocks.initialOwner ? { user: { id: mocks.initialOwner } } : null);
    return { data: { subscription: { unsubscribe: () => mocks.listeners.delete(listener) } } };
  },
} }) }));

type Result = { status: number; data: { success?: boolean; error?: string } };
const success: Result = { status: 200, data: { success: true } };
let pending: Array<() => void>;
function deferred() {
  let resolve!: (value: Result) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<Result>((yes, no) => { resolve = yes; reject = no; });
  pending.push(() => resolve(success));
  return { promise, resolve, reject };
}
function owner(event: string, id: string | null) {
  for (const listener of [...mocks.listeners]) listener(event, id ? { user: { id } } : null);
}
async function submit() {
  const user = userEvent.setup();
  await user.type(screen.getByRole('textbox'), ' jazzfree ');
  await user.click(screen.getByRole('button', { name: /Redeem access|Canjear acceso|Activer l’accès|Resgatar acesso/ }));
}
beforeEach(() => {
  vi.clearAllMocks(); mocks.listeners.clear(); mocks.initialOwner = OWNER; mocks.language = 'en'; pending = [];
  params.delete('code'); params.set('courseId', 'synthetic-course');
  mocks.fetch.mockImplementation(() => { throw new Error('External traffic prohibited in closed redemption fixture'); });
  vi.stubGlobal('fetch', mocks.fetch);
});
afterEach(async () => {
  cleanup();
  await act(async () => { for (const finish of pending) finish(); });
  vi.useRealTimers(); mocks.listeners.clear();
  expect(mocks.fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals();
});

describe('redemption intent captures the resolved SDK owner without changing voucher input', () => {
  test('real submit carries exactly one captured owner hint and the original normalized body', async () => {
    const work = deferred(); mocks.post.mockReturnValue(work.promise); render(<RedeemPage />); await submit();
    expect(mocks.post).toHaveBeenCalledExactlyOnceWith(`/api/vouchers/redeem?expectedUserId=${OWNER}`, {
      courseId: 'synthetic-course', voucherCode: 'JAZZFREE',
    });
  });
  test.each([undefined, null])('unresolved or signed-out owner receives sign-in guidance without a mutation (%s)', async initialOwner => {
    mocks.initialOwner = initialOwner; render(<RedeemPage />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'JAZZFREE' } });
    fireEvent.submit(screen.getByRole('textbox').closest('form')!);
    expect(mocks.post).not.toHaveBeenCalled();
    expect(screen.getByText('Sign in to redeem this code.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Sign in' }).getAttribute('href')).toBe('/auth');
  });
  test('same-owner refresh retains genuine success and delayed dashboard navigation', async () => {
    const work = deferred(); mocks.post.mockReturnValue(work.promise); render(<RedeemPage />); await submit();
    vi.useFakeTimers(); await act(async () => owner('TOKEN_REFRESHED', OWNER));
    await act(async () => work.resolve(success));
    expect(screen.getByRole('status').textContent).toBe('Voucher redeemed successfully.');
    expect(mocks.toastSuccess).toHaveBeenCalledExactlyOnceWith('Access granted successfully.');
    await act(async () => vi.advanceTimersByTime(1500));
    expect(mocks.push).toHaveBeenCalledExactlyOnceWith('/dashboard');
  });
});

const refreshCopy = [
  ['es', 'Tu sesión cambió. Actualiza la página antes de continuar.'],
  ['en', 'Your session changed. Refresh the page before continuing.'],
  ['fr', 'Votre session a changé. Actualisez la page avant de continuer.'],
  ['pt', 'Sua sessão mudou. Atualize a página antes de continuar.'],
] as const;
describe('specific consistency conflicts have local manual-refresh guidance', () => {
  test.each(refreshCopy)('JSON Session changed409 is localized in %s without retry or granting success', async (language, message) => {
    mocks.language = language;
    mocks.post.mockRejectedValue({ isAxiosError: true, response: { status: 409, data: { error: 'Session changed' } } });
    render(<RedeemPage />); await submit();
    expect(screen.getByRole('alert').textContent).toBe(message);
    expect(mocks.toastError).toHaveBeenCalledExactlyOnceWith(message);
    expect(mocks.post).toHaveBeenCalledOnce(); expect(mocks.toastSuccess).not.toHaveBeenCalled(); expect(mocks.push).not.toHaveBeenCalled();
  });
  test('retained consistency feedback follows the visible language without another request', async () => {
    mocks.post.mockRejectedValue({ isAxiosError: true, response: { status: 409, data: { error: 'Session changed' } } });
    const view = render(<RedeemPage />); await submit();
    mocks.language = 'fr'; view.rerender(<RedeemPage />);
    expect(screen.getByRole('alert').textContent).toBe(refreshCopy[2][1]); expect(mocks.post).toHaveBeenCalledOnce();
  });
  test('unrelated409 keeps ordinary voucher feedback rather than becoming session guidance', async () => {
    mocks.post.mockRejectedValue({ isAxiosError: true, response: { status: 409, data: { reason: 'Max uses per user reached', error: 'Redeem failed' } } });
    render(<RedeemPage />); await submit();
    expect(screen.getByRole('alert').textContent).toBe('You have already reached your usage limit for this code.');
    expect(mocks.post).toHaveBeenCalledOnce(); expect(mocks.push).not.toHaveBeenCalled();
  });
  test('server401 retains the existing anonymous guidance', async () => {
    mocks.post.mockRejectedValue({ isAxiosError: true, response: { status: 401, data: 'Unauthorized' } });
    render(<RedeemPage />); await submit();
    expect(screen.getByRole('alert').textContent).toBe('Sign in to redeem this code.'); expect(mocks.push).not.toHaveBeenCalled();
  });
});

const retirements = ['switch', 'sign-out', 'unmount'] as const;
describe('late redemption work cannot affect a retired owner or page', () => {
  test.each(retirements)('late success is ignored after %s', async retirement => {
    const work = deferred(); mocks.post.mockReturnValue(work.promise); const view = render(<RedeemPage />); await submit();
    vi.useFakeTimers();
    await act(async () => retirement === 'unmount' ? view.unmount() : owner(retirement === 'switch' ? 'SIGNED_IN' : 'SIGNED_OUT', retirement === 'switch' ? OTHER : null));
    await act(async () => work.resolve(success)); await act(async () => vi.advanceTimersByTime(1500));
    expect(mocks.toastSuccess).not.toHaveBeenCalled(); expect(mocks.push).not.toHaveBeenCalled();
    expect(screen.queryByText('Voucher redeemed successfully.')).toBeNull();
  });
  test.each(retirements)('late failure is ignored after %s', async retirement => {
    const work = deferred(); mocks.post.mockReturnValue(work.promise); const view = render(<RedeemPage />); await submit();
    await act(async () => retirement === 'unmount' ? view.unmount() : owner(retirement === 'switch' ? 'SIGNED_IN' : 'SIGNED_OUT', retirement === 'switch' ? OTHER : null));
    await act(async () => work.reject({ isAxiosError: true, response: { status: 409, data: { error: 'Session changed' } } }));
    expect(mocks.toastError).not.toHaveBeenCalled(); expect(mocks.push).not.toHaveBeenCalled();
    expect(screen.queryByText(refreshCopy[1][1])).toBeNull();
  });
  test.each(retirements)('already scheduled success navigation and feedback retire after %s', async retirement => {
    const work = deferred(); mocks.post.mockReturnValue(work.promise); const view = render(<RedeemPage />); await submit();
    vi.useFakeTimers(); await act(async () => work.resolve(success));
    expect(screen.getByRole('status').textContent).toBe('Voucher redeemed successfully.');
    await act(async () => retirement === 'unmount' ? view.unmount() : owner(retirement === 'switch' ? 'SIGNED_IN' : 'SIGNED_OUT', retirement === 'switch' ? OTHER : null));
    expect(screen.queryByText('Voucher redeemed successfully.')).toBeNull();
    await act(async () => vi.advanceTimersByTime(1500)); expect(mocks.push).not.toHaveBeenCalled();
  });
  test('old owner finalization cannot clear the new owner pending submission', async () => {
    const oldWork = deferred(), newWork = deferred(); mocks.post.mockReturnValueOnce(oldWork.promise).mockReturnValueOnce(newWork.promise);
    render(<RedeemPage />); await submit(); await act(async () => owner('SIGNED_IN', OTHER));
    const submitButton = screen.getByRole('button', { name: 'Redeem access' });
    expect(submitButton.hasAttribute('disabled')).toBe(false);
    await userEvent.setup().click(submitButton);
    expect(mocks.post).toHaveBeenLastCalledWith(`/api/vouchers/redeem?expectedUserId=${OTHER}`, { courseId: 'synthetic-course', voucherCode: 'JAZZFREE' });
    await act(async () => oldWork.resolve(success));
    expect(screen.getByRole('button', { name: 'Redeeming…' }).hasAttribute('disabled')).toBe(true);
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
  });
  test('returning to the original owner cannot resurrect work from its earlier generation', async () => {
    const work = deferred(); mocks.post.mockReturnValue(work.promise); render(<RedeemPage />); await submit();
    await act(async () => owner('SIGNED_IN', OTHER)); await act(async () => owner('SIGNED_IN', OWNER));
    await act(async () => work.resolve(success));
    expect(mocks.toastSuccess).not.toHaveBeenCalled(); expect(screen.queryByText('Voucher redeemed successfully.')).toBeNull();
  });
  test('changing then restoring the course query cannot resurrect an old redemption result', async () => {
    const work = deferred(); mocks.post.mockReturnValue(work.promise); const view = render(<RedeemPage />); await submit();
    params.set('courseId', 'synthetic-other-course'); view.rerender(<RedeemPage />);
    params.set('courseId', 'synthetic-course'); view.rerender(<RedeemPage />);
    await act(async () => work.resolve(success));
    expect(mocks.toastSuccess).not.toHaveBeenCalled(); expect(screen.queryByText('Voucher redeemed successfully.')).toBeNull();
  });
  test('a changed redemption-link code cancels already scheduled dashboard navigation', async () => {
    const work = deferred(); mocks.post.mockReturnValue(work.promise); const view = render(<RedeemPage />); await submit();
    vi.useFakeTimers(); await act(async () => work.resolve(success));
    params.set('code', 'OTHER'); view.rerender(<RedeemPage />);
    await act(async () => vi.advanceTimersByTime(1500)); expect(mocks.push).not.toHaveBeenCalled();
  });
});

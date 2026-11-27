// @vitest-environment jsdom
// Actual page with closed SDK/HTTP fixtures; these are display/owner tests,
// not evidence of provider currency configuration or remote payment success.
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import PaymentPage from '@/app/dashboard/payment/page';

type Session = { user: { id: string } } | null;
const mocks = vi.hoisted(() => ({ get: vi.fn(), fetch: vi.fn(), language: 'en', listeners: new Set<(event: string, session: Session) => void>() }));
vi.mock('axios', () => ({ default: { get: mocks.get } }));
vi.mock('@/components/providers/language-provider', () => ({ useLanguage: () => ({ language: mocks.language }) }));
vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({ auth: {
  onAuthStateChange: (listener: (event: string, session: Session) => void) => {
    mocks.listeners.add(listener);
    queueMicrotask(() => { if (mocks.listeners.has(listener)) listener('INITIAL_SESSION', { user: { id: 'synthetic-money-owner' } }); });
    return { data: { subscription: { unsubscribe: () => mocks.listeners.delete(listener) } } };
  },
} }) }));

function record(amount: number | null, currency: unknown, amountMinor: unknown, title = 'Synthetic money record') {
  return { id: title, itemType: 'Curso', itemTitle: title, createdAt: '2026-01-15T10:00:00.000Z', amount, currency, amountMinor };
}
function normalized(value: string | null) { return value?.replace(/[\u00a0\u202f]/g, ' ').replace(/\s+/g, ' ').trim(); }
async function money(title = 'Synthetic money record') {
  const heading = await screen.findByText(title);
  return heading.parentElement!.parentElement!.lastElementChild as HTMLElement;
}
beforeEach(() => {
  vi.clearAllMocks(); mocks.listeners.clear(); mocks.language = 'en';
  mocks.fetch.mockImplementation(() => { throw new Error('External traffic prohibited in closed money fixture'); });
  vi.stubGlobal('fetch', mocks.fetch);
});
afterEach(() => { cleanup(); mocks.listeners.clear(); expect(mocks.fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });

describe('verified currency/minor-unit pairs in actual payment history', () => {
  test.each([
    ['EUR', '2990', 29.9, 'EUR 29.90'],
    ['JPY', '2990', 2990, 'JPY 2,990'],
    ['KWD', '1234', 1.234, 'KWD 1.234'],
    ['IQD', '1234', 1.234, 'IQD 1.234'],
    ['MGA', '1234', 12.34, 'MGA 12.34'],
  ] as const)('%s uses the explicit ISO scale rather than a universal two-decimal format', async (currency, amountMinor, amount, expected) => {
    mocks.get.mockResolvedValue({ data: [record(amount, currency, amountMinor)] }); render(<PaymentPage />);
    expect(normalized((await money()).textContent)).toBe(expected);
    expect(screen.queryByRole('alert')).toBeNull(); expect(mocks.get).toHaveBeenCalledOnce();
  });
  test.each([
    ['EUR', 'EUR 0.00'], ['JPY', 'JPY 0'], ['KWD', 'KWD 0.000'],
  ] as const)('real %s zero is distinct from missing money', async (currency, expected) => {
    mocks.get.mockResolvedValue({ data: [record(0, currency, '0')] }); render(<PaymentPage />);
    expect(normalized((await money()).textContent)).toBe(expected);
    expect(screen.queryByText('Amount unavailable')).toBeNull();
  });
  test('large canonical integer text remains exact instead of passing through an unsafe Number', async () => {
    mocks.get.mockResolvedValue({ data: [record(null, 'JPY', '9007199254740993')] }); render(<PaymentPage />);
    expect(normalized((await money()).textContent)).toBe('JPY 9,007,199,254,740,993');
  });
  test('the exact pair takes precedence over an incompatible legacy rounded numeric value', async () => {
    mocks.get.mockResolvedValue({ data: [record(12.34, 'KWD', '12345')] }); render(<PaymentPage />);
    const value = await money(); expect(normalized(value.textContent)).toBe('KWD 12.345');
    expect(value.textContent).not.toContain('12.340');
  });
});

const guidance = {
  es: { currency: 'Moneda no disponible', amount: 'Importe no disponible' },
  en: { currency: 'Currency unavailable', amount: 'Amount unavailable' },
  fr: { currency: 'Devise indisponible', amount: 'Montant indisponible' },
  pt: { currency: 'Moeda indisponível', amount: 'Valor indisponível' },
};
describe('unproved legacy units never become euro or another guessed currency', () => {
  test.each(['es', 'en', 'fr', 'pt'] as const)('%s preserves known numeric facts and distinguishes real zero from unavailable money', async language => {
    mocks.language = language;
    mocks.get.mockResolvedValue({ data: [
      record(80, null, null, 'Legacy positive record'), record(0, null, null, 'Legacy zero record'),
      record(null, null, null, 'Unknown money record'),
    ] }); render(<PaymentPage />);
    const positive = await money('Legacy positive record'), zero = await money('Legacy zero record'), unknown = await money('Unknown money record');
    expect(within(positive).getByText('80')).toBeTruthy(); expect(within(positive).getByText(guidance[language].currency)).toBeTruthy();
    expect(within(zero).getByText('0')).toBeTruthy(); expect(within(zero).getByText(guidance[language].currency)).toBeTruthy();
    expect(within(unknown).getByText(guidance[language].amount)).toBeTruthy();
    for (const value of [positive, zero, unknown]) expect(value.textContent).not.toMatch(/€|EUR|null|undefined/);
    expect(screen.queryByRole('alert')).toBeNull(); expect(mocks.get).toHaveBeenCalledOnce();
  });
  test('unknown positive raw units cannot be displayed as a major-unit charge', async () => {
    mocks.get.mockResolvedValue({ data: [record(null, 'ZZZ', '1234')] }); render(<PaymentPage />);
    const value = await money(); expect(within(value).getByText(guidance.en.amount)).toBeTruthy();
    expect(value.textContent).not.toMatch(/ZZZ|1234|12\.34|€/);
  });
  test('canonical zero remains a zero fact even when its currency cannot be established', async () => {
    mocks.get.mockResolvedValue({ data: [record(null, null, '0')] }); render(<PaymentPage />);
    const value = await money(); expect(within(value).getByText('0')).toBeTruthy();
    expect(within(value).getByText(guidance.en.currency)).toBeTruthy(); expect(value.textContent).not.toMatch(/€|EUR/);
  });
  test('a legacy float is not relabeled with a currency whose exact pair is missing', async () => {
    mocks.get.mockResolvedValue({ data: [record(80, 'EUR', null)] }); render(<PaymentPage />);
    const value = await money(); expect(within(value).getByText('80')).toBeTruthy();
    expect(within(value).getByText(guidance.en.currency)).toBeTruthy(); expect(value.textContent).not.toMatch(/€|EUR/);
  });
  test('currency-unavailable guidance follows locale changes without another owner request', async () => {
    mocks.get.mockResolvedValue({ data: [record(80, null, null)] }); const view = render(<PaymentPage />);
    await money(); expect(screen.getByText(guidance.en.currency)).toBeTruthy();
    mocks.language = 'fr'; view.rerender(<PaymentPage />);
    expect(screen.getByText(guidance.fr.currency)).toBeTruthy(); expect(screen.queryByText(guidance.en.currency)).toBeNull();
    expect(mocks.get).toHaveBeenCalledOnce();
  });
});

describe('malformed API money stays unavailable or triggers the existing retry contract', () => {
  test.each(['00123', '-1', '1.23'])('malformed canonical text %s does not invent a charge', async amountMinor => {
    mocks.get.mockResolvedValue({ data: [record(null, 'EUR', amountMinor)] }); render(<PaymentPage />);
    const value = await money(); expect(within(value).getByText(guidance.en.amount)).toBeTruthy();
    expect(value.textContent).not.toContain('€'); expect(mocks.get).toHaveBeenCalledOnce();
  });
  test.each([Number.MAX_SAFE_INTEGER + 1, { minor: '1234' }])('wrong DTO minor type remains a generic load failure (%j)', async amountMinor => {
    mocks.get.mockResolvedValue({ data: [record(12.34, 'EUR', amountMinor)] }); render(<PaymentPage />);
    expect((await screen.findByRole('alert')).textContent).toContain('Unable to load your payment history.');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
    expect(screen.queryByText('Synthetic money record')).toBeNull(); expect(mocks.get).toHaveBeenCalledOnce();
  });
});

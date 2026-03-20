import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/lib/supabase-config.ts',
        'src/lib/test-mode.ts',
        'src/lib/mux-playback.ts',
        'src/lib/pricing.ts',
        'src/lib/language.ts',
        'src/lib/profile-avatars.ts',
        'src/lib/utils.ts',
        'src/lib/admin/permissions.ts',
        'src/app/api/mux/promo-playback/route.ts',
        'src/app/api/checkout/route.ts',
        'src/app/api/dashboard/pdf-count/route.ts',
        'src/app/api/messages/unread-count/route.ts',
        'src/app/api/purchases/route.ts',
        'src/app/api/lesson-checkout/route.ts',
        'src/app/api/webhooks/lemon-squeezy/route.ts',
        'src/app/api/dev/reset-test-purchases/route.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 90,
        lines: 80,
      },
    },
  },
});

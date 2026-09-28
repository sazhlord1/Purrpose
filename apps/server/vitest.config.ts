import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL_TEST ??
        'postgresql://purrpose:purrpose@localhost:5433/purrpose?schema=public',
      NODE_ENV: 'test',
      PAYMENTS_MODE: 'sandbox',
      VAPID_PUBLIC_KEY: '',
      VAPID_PRIVATE_KEY: '',
    },
    pool: 'forks',
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Stable env vars so modules that validate them on load don't throw
    env: {
      NODE_ENV: 'test',
      ANTHROPIC_API_KEY: 'test-api-key',
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      PORT: '3099',
    },
  },
});

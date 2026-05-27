/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone output is needed for Docker/Railway but requires symlink
  // privileges on Windows. Only enable it in CI where that's guaranteed.
  ...(process.env.CI ? { output: 'standalone' } : {}),

  transpilePackages: ['@artifact-hub/types'],

  // Allow <img> tags to load from any Supabase storage origin
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

module.exports = nextConfig;

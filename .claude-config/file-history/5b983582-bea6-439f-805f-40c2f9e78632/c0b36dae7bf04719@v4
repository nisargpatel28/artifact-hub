/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces a self-contained build under .next/standalone — required for
  // Docker / Railway deploys. Vercel ignores this and uses its own output.
  output: 'standalone',

  transpilePackages: ['@artifact-hub/types'],

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? '',
  },

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

export default nextConfig;

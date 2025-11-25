import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize resource loading to reduce preload warnings
  experimental: {
    // Only preload resources that are actually needed
    optimizePackageImports: ['@supabase/supabase-js', '@supabase/ssr'],
  },
  // Reduce aggressive prefetching
  reactStrictMode: true,
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;

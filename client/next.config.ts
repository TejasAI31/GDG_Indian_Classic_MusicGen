

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export', // Required for static deployment on Netlify
  images: { unoptimized: true }, // Disable Image Optimization (static export)
};

export default nextConfig;

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@transitops/shared-types'],
};

export default nextConfig;

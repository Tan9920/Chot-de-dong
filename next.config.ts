import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: path.resolve(process.cwd()),
  outputFileTracingExcludes: {
    '*': [
      './artifacts/**/*',
      './scripts/**/*',
      './docs/**/*',
      './*.md',
      './*.zip',
      './.git/**/*',
      './.next/cache/**/*'
    ]
  },
  staticPageGenerationTimeout: 90,
  // Batch125: do not let production builds silently skip TypeScript/ESLint checks.
  typescript: {
    ignoreBuildErrors: false
  },
  eslint: {
    ignoreDuringBuilds: false
  },
  // Batch121 marker: disable webpack filesystem cache during production build diagnostics so full verify does not leave heavy .next/cache/webpack packs in constrained CI/sandbox runs.
  webpack: (config) => {
    config.cache = false;
    return config;
  },
  experimental: {
    cpus: 1,
    workerThreads: false,
    webpackBuildWorker: false,
    parallelServerCompiles: false,
    parallelServerBuildTraces: false,
    serverMinification: false
  }
};

export default nextConfig;

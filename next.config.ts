import path from 'node:path';
import type { NextConfig } from 'next';

const skipRedundantBuildChecks = process.env.GIAOAN_SKIP_REDUNDANT_NEXT_BUILD_CHECKS === '1';

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
  // Batch149: default production builds still check TypeScript/ESLint. The max-closure runner may set GIAOAN_SKIP_REDUNDANT_NEXT_BUILD_CHECKS=1 only after a separate typecheck/source validate stage has passed, so constrained local evidence runs do not duplicate the same checks inside next build.
  typescript: {
    ignoreBuildErrors: skipRedundantBuildChecks
  },
  eslint: {
    ignoreDuringBuilds: skipRedundantBuildChecks
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

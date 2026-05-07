import type {NextConfig} from 'next';

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:4000';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    devtoolSegmentExplorer: false,
    optimizePackageImports: ['lucide-react', 'motion/react', '@monaco-editor/react'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production'
          ? 'https://YOUR-RAILWAY-URL.up.railway.app/api/:path*'
          : 'http://localhost:4000/api/:path*',
      },
    ];
  },
  output: 'standalone',
  transpilePackages: ['motion'],
};

// Only attach a custom webpack config when explicitly requested. This
// avoids the Next.js warning about a custom webpack configuration when
// Turbopack is preferred/used by Next.js.
if (process.env.FORCE_WEBPACK === 'true') {
  (nextConfig as any).webpack = (config: any, {dev}: {dev: boolean}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // File watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  };
}

export default nextConfig;

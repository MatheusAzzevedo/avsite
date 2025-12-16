/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      }
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Rewrite de rotas admin para o raiz
        {
          source: '/admin/:path*',
          destination: '/admin/:path*',
        },
        {
          source: '/api/:path*',
          destination: '/api/:path*',
        }
      ]
    }
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig

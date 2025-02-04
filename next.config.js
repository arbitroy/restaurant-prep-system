/** @type {import('next').NextConfig} */
const nextConfig = {
    poweredByHeader: false,
    compress: true,
    generateEtags: true,
    distDir: '.next',
    typescript: {
        ignoreBuildErrors: true // Optional: only if you want builds to succeed with TS errors
    },
    serverRuntimeConfig: {
        port: process.env.PORT || 10000
    },

    headers: async () => [
        {
            source: '/:path*',
            headers: [
                {
                    key: 'X-DNS-Prefetch-Control',
                    value: 'on'
                },
                {
                    key: 'Strict-Transport-Security',
                    value: 'max-age=31536000; includeSubDomains'
                },
                {
                    key: 'X-Frame-Options',
                    value: 'SAMEORIGIN'
                },
                {
                    key: 'X-Content-Type-Options',
                    value: 'nosniff'
                }
            ]
        }
    ],

    // Cache optimization
    onDemandEntries: {
        maxInactiveAge: 60 * 60 * 1000,
        pagesBufferLength: 2
    },

    experimental: {
        optimizeCss: true,
        scrollRestoration: true,
        forceSwcTransforms: true
    }
};

module.exports = nextConfig;
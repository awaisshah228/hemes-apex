/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    staticPageGenerationTimeout: 1000,
    webpack(config, opts) {
        if (!opts.isServer) {
            // don't resolve 'fs' module on the client to prevent this error on build --> Error: Can't resolve 'fs'
            config.resolve.fallback = {
                fs: false,
            }
        }

        config.module.rules.push({
            test: /\.svg$/,
            use: [{ loader: '@svgr/webpack', options: { icon: true } }],
        })
        return config
    },
    eslint: {
        ignoreDuringBuilds: true,
    }
};

export default nextConfig;


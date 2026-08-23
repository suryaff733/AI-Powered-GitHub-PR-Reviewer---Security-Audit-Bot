/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['bullmq', 'ioredis', '@prisma/client']
  }
};

export default nextConfig;

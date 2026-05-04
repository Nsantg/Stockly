/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['typeorm', 'pg', 'pg-native', 'reflect-metadata', 'bcryptjs'],
};

module.exports = nextConfig;

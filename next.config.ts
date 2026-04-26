import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  // Vercel 서버리스 함수 payload 제한 대응 (관리자 파일 첨부용)
  serverExternalPackages: [],
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
};
export default nextConfig;

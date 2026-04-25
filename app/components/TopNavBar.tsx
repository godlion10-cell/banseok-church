"use client";
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function TopNavBar() {
  const router = useRouter();
  const pathname = usePathname();

  // 메인 홈페이지('/')에서는 뒤로가기 바를 숨김
  if (pathname === '/') return null;

  return (
    <div style={{ 
      position: 'sticky', top: 0, zIndex: 50, 
      background: 'rgba(255, 255, 255, 0.9)', 
      backdropFilter: 'blur(10px)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '15px 20px', borderBottom: '1px solid #E2E8F0'
    }}>
      {/* ⬅️ 뒤로 가기 버튼 */}
      <button 
        onClick={() => router.back()} 
        style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: '#475569' }}
      >
        <span>⬅️</span> 이전
      </button>

      {/* 🏠 홈으로 버튼 */}
      <Link href="/" style={{ textDecoration: 'none', fontSize: '1.2rem', color: '#1E3A8A', fontWeight: 'bold' }}>
        🏠 반석교회 홈
      </Link>
    </div>
  );
}

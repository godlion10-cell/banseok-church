"use client";
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function TopNavBar() {
  const router = useRouter();
  const pathname = usePathname();

  // 메인 홈페이지('/')에서는 숨김
  if (pathname === '/') return null;

  return (
    <nav className="premium-nav">
      {/* 🔙 고품격 뒤로 가기 버튼 */}
      <button 
        onClick={() => router.back()} 
        className="premium-nav-btn"
        aria-label="이전 페이지로 이동"
      >
        <div className="premium-nav-icon-wrap">
          <Image src="/icons/realistic-back.png" alt="뒤로" width={32} height={32} style={{ objectFit: 'contain' }} />
        </div>
        <span className="premium-nav-label">이전</span>
      </button>

      {/* ⛪ 고품격 홈(성전) 버튼 */}
      <Link href="/" className="premium-nav-btn" aria-label="반석교회 홈으로 이동">
        <div className="premium-nav-icon-wrap church">
          <Image src="/icons/realistic-church.png" alt="홈으로" width={38} height={38} style={{ objectFit: 'contain' }} />
        </div>
        <span className="premium-nav-label church-label">성전 로비</span>
      </Link>
    </nav>
  );
}

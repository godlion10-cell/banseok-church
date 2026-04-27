// @ts-nocheck
"use client";
import { useState, useRef } from 'react';

/**
 * 👑 관리자 전용 — 찬송가 악보 일괄 업로드 도구
 * 
 * 사장님이 찬송가 이미지 팩을 준비하면 이 페이지에서 한번에 업로드합니다.
 * 파일명이 {번호}.jpg 형식이면 자동으로 /public/assets/hymns/에 배치됩니다.
 * 
 * ⚠️ Vercel/Next.js의 static 파일 배포 특성상, 
 * 실제 운영에서는 이 페이지에서 업로드한 파일을 외부 스토리지(S3, Cloudinary 등)에 
 * 저장하거나 git push로 배포하는 것이 권장됩니다.
 */

export default function HymnUploadPage() {
  const [files, setFiles] = useState<{ name: string; number: number; status: string; preview?: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 📂 파일 선택 핸들러
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;

    const parsed: typeof files = [];
    for (let i = 0; i < selected.length; i++) {
      const file = selected[i];
      // 파일명에서 번호 추출 (28.jpg, hymn_94.jpg, 찬송가_370.png 등)
      const match = file.name.match(/(\d{1,3})/);
      const hymnNumber = match ? parseInt(match[1], 10) : 0;
      
      parsed.push({
        name: file.name,
        number: (hymnNumber >= 1 && hymnNumber <= 645) ? hymnNumber : 0,
        status: (hymnNumber >= 1 && hymnNumber <= 645) ? '✅ 준비됨' : '⚠️ 번호 인식 불가',
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      });
    }

    // 번호 순으로 정렬
    parsed.sort((a, b) => a.number - b.number);
    setFiles(parsed);
    setUploadResult(null);
  };

  // 📤 일괄 업로드 실행
  const handleBulkUpload = async () => {
    const validFiles = files.filter(f => f.number > 0);
    if (validFiles.length === 0) {
      alert('유효한 찬송가 파일이 없습니다!');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const input = fileInputRef.current;
      if (!input?.files) return;

      const formData = new FormData();
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        const match = file.name.match(/(\d{1,3})/);
        const num = match ? parseInt(match[1], 10) : 0;
        if (num >= 1 && num <= 645) {
          formData.append('hymns', file, `${num}.jpg`);
        }
      }

      const res = await fetch('/api/admin/hymn-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setUploadResult(`✅ ${data.uploaded}개 찬송가 악보가 업로드되었습니다!`);
        setFiles(prev => prev.map(f => f.number > 0 ? { ...f, status: '✅ 업로드 완료' } : f));
      } else {
        setUploadResult(`❌ 업로드 실패: ${data.error}`);
      }
    } catch (err: any) {
      setUploadResult(`❌ 네트워크 오류: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const validCount = files.filter(f => f.number > 0).length;
  const invalidCount = files.filter(f => f.number === 0).length;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1012 0%, #2a1a1e 60%, #3a252a 100%)', fontFamily: "'Inter', sans-serif" }}>
      {/* 헤더 */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(193,156,114,0.15)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.8rem' }}>🎵</span>
          <div>
            <h1 style={{ margin: 0, color: '#fff', fontSize: '1.3rem', fontWeight: 700 }}>찬송가 악보 일괄 업로드</h1>
            <p style={{ margin: 0, color: 'rgba(193,156,114,0.8)', fontSize: '0.78rem' }}>새찬송가 1~645장 악보 이미지 일괄 등록</p>
          </div>
        </div>
        <a href="/admin" style={{ color: '#c19c72', textDecoration: 'none', fontSize: '0.85rem', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(193,156,114,0.3)' }}>← 관리자</a>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* 📋 사용 가이드 */}
        <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ color: '#60A5FA', margin: '0 0 0.8rem', fontSize: '1rem' }}>📋 악보 이미지 준비 가이드</h3>
          <ul style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: '2', margin: 0, paddingLeft: '1.2rem' }}>
            <li>파일명에 <strong style={{ color: '#A78BFA' }}>찬송가 번호</strong>가 포함되어야 합니다 (예: <code style={{ color: '#4ADE80' }}>28.jpg</code>, <code style={{ color: '#4ADE80' }}>hymn_94.png</code>)</li>
            <li>지원 형식: JPG, PNG, WebP</li>
            <li>권장 해상도: 800×1200px 이상</li>
            <li>한번에 최대 645개 파일 선택 가능</li>
            <li>기존 악보가 있으면 자동으로 덮어씁니다</li>
          </ul>
        </div>

        {/* 📂 파일 선택 */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '20px', border: '2px dashed rgba(193,156,114,0.3)', padding: '3rem 2rem', textAlign: 'center', marginBottom: '2rem', cursor: 'pointer', transition: 'all 0.2s' }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'rgba(139,92,246,0.6)'; }}
          onDragLeave={e => { e.currentTarget.style.borderColor = 'rgba(193,156,114,0.3)'; }}
          onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'rgba(193,156,114,0.3)'; if (fileInputRef.current) { fileInputRef.current.files = e.dataTransfer.files; handleFilesSelected({ target: fileInputRef.current } as any); } }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFilesSelected}
            accept="image/*"
            multiple
            style={{ display: 'none' }}
          />
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📁</div>
          <p style={{ color: '#c19c72', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            {files.length > 0 ? `${files.length}개 파일 선택됨` : '클릭하여 악보 이미지 선택'}
          </p>
          <p style={{ color: '#64748B', fontSize: '0.85rem' }}>또는 파일을 여기에 드래그 & 드롭</p>
        </div>

        {/* 📊 선택 결과 요약 */}
        {files.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '120px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <div style={{ color: '#4ADE80', fontSize: '2rem', fontWeight: 800 }}>{validCount}</div>
              <div style={{ color: '#86EFAC', fontSize: '0.8rem' }}>유효한 파일</div>
            </div>
            {invalidCount > 0 && (
              <div style={{ flex: 1, minWidth: '120px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <div style={{ color: '#FCA5A5', fontSize: '2rem', fontWeight: 800 }}>{invalidCount}</div>
                <div style={{ color: '#FCA5A5', fontSize: '0.8rem' }}>번호 인식 불가</div>
              </div>
            )}
            <div style={{ flex: 1, minWidth: '120px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <div style={{ color: '#A78BFA', fontSize: '2rem', fontWeight: 800 }}>{645 - validCount}</div>
              <div style={{ color: '#A78BFA', fontSize: '0.8rem' }}>아직 없는 곡</div>
            </div>
          </div>
        )}

        {/* 🚀 업로드 버튼 */}
        {validCount > 0 && (
          <button
            onClick={handleBulkUpload}
            disabled={uploading}
            style={{
              width: '100%', padding: '1.2rem',
              background: uploading ? '#555' : 'linear-gradient(135deg, #5B272F, #8B4513)',
              color: 'white', border: 'none', borderRadius: '14px',
              fontSize: '1.1rem', fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer',
              boxShadow: uploading ? 'none' : '0 6px 20px rgba(91,39,47,0.4)',
              marginBottom: '1.5rem',
            }}
          >
            {uploading ? `⏳ 업로드 중... (${validCount}개)` : `🚀 ${validCount}개 악보 일괄 업로드`}
          </button>
        )}

        {/* 업로드 결과 */}
        {uploadResult && (
          <div style={{
            padding: '16px 20px', borderRadius: '12px', marginBottom: '1.5rem',
            background: uploadResult.startsWith('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${uploadResult.startsWith('✅') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: uploadResult.startsWith('✅') ? '#4ADE80' : '#FCA5A5',
            fontSize: '1rem', fontWeight: 600,
          }}>
            {uploadResult}
          </div>
        )}

        {/* 📋 파일 목록 */}
        {files.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(193,156,114,0.1)' }}>
            <h3 style={{ color: '#c19c72', fontSize: '1rem', marginBottom: '1rem' }}>📋 파일 목록 ({files.length}개)</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {files.map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  {/* 미니 프리뷰 */}
                  {f.preview && (
                    <img src={f.preview} alt="" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  {/* 번호 배지 */}
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: f.number > 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: f.number > 0 ? '#4ADE80' : '#FCA5A5',
                    fontWeight: 800, fontSize: '0.8rem', flexShrink: 0,
                  }}>
                    {f.number > 0 ? f.number : '?'}
                  </div>
                  {/* 파일명 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#e8e0d8', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                  </div>
                  {/* 상태 */}
                  <div style={{ color: f.number > 0 ? '#4ADE80' : '#FCA5A5', fontSize: '0.78rem', flexShrink: 0 }}>{f.status}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 📂 현재 등록 현황 — CLI 가이드 */}
        <div style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(193,156,114,0.08)' }}>
          <h3 style={{ color: 'rgba(193,156,114,0.5)', fontSize: '0.9rem', marginBottom: '0.8rem' }}>🔧 수동 등록 (CLI)</h3>
          <pre style={{ color: '#64748B', fontSize: '0.78rem', lineHeight: '1.8', margin: 0, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
{`# 1. 이미지 파일을 번호.jpg 형식으로 준비
# 2. public/assets/hymns/ 폴더에 복사
copy *.jpg d:\\banseok-church\\public\\assets\\hymns\\

# 3. git commit & push (Vercel 자동 배포)
cd d:\\banseok-church
git add public/assets/hymns/
git commit -m "feat: 찬송가 악보 이미지 추가"
git push origin main`}
          </pre>
        </div>
      </div>
    </div>
  );
}

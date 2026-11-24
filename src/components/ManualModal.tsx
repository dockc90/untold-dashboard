import React, { useEffect, useState } from 'react';
import { X, BookOpen, Download, Copy, Check } from 'lucide-react';

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MANUAL_MARKDOWN = `# 🎬 Untold 쇼츠·릴스·틱톡 제작 및 업로드 실전 매뉴얼

> **작업 목표:** 하루 정해진 편수(1-2편)를 1편당 15-20분 내외로 제작해 **유튜브 쇼츠 · 인스타그램(릴스/캐러셀) · 틱톡**에 동시 업로드합니다.  
> **접속 주소:** https://untold-dashboard.vercel.app (별도 API 키 입력 불필요)

---

## 0. 필수 사전 준비 (처음 1회만 세팅)

1. **브라우저는 반드시 '구글 크롬(Google Chrome)' 사용**
   - 영상 렌더링, 사진 검색, 파일 다운로드 호환성이 가장 안정적입니다.
2. **크롬 확장프로그램 '드래그프리(DragFree)' 설치 필수**
   - 크롬 웹스토어에서 **\`드래그프리\`**를 검색해 설치한 뒤, 우측 상단 확장프로그램 아이콘을 눌러 **\`자동\` 스위치를 ON(초록색)**으로 켜두세요.
   - 언론 기사·블로그 등에 걸린 우클릭·드래그 방지를 자동으로 풀어주어, **\`🔍 사진 찾기\`**로 찾은 인물·기사 사진을 1초 만에 편하게 저장할 수 있습니다.

---

## ⚠️ 작업 전 절대 원칙 3가지

1. **한 채널에 카테고리 섞지 않기**
   - 상단 **\`🎯 내 채널 단일 카테고리 고정\`**에서 담당 채널 카테고리(예: \`경제·기업인\`)만 고정해 제작합니다.
2. **비난 · 악인전 · 사생활 폭로 · 루머 절대 금지**
   - 철저히 **"이 기업/인물의 홍보팀 직원"**이라는 마인드로 **미담, 위기 극복, 소박한 인간미, 통 큰 결단**만 다룹니다.
   - 부정적 이슈가 있는 인물이라면 카드 하단 **\`🛡️ 논란 우회 공략\`** 버튼을 눌러 추천된 **긍정 대안 인물**로 제작하세요.
3. **외부 BGM 넣지 말기 (유튜브 기본 음원 모드 유지)**
   - 영상 제작(3단계)에서 **\`🎵 유튜브 기본 음원 모드 ON\`**을 유지해 성우 목소리만 들어간 영상을 뽑고, 업로드 시 유튜브/인스타/틱톡 앱 내 기본 음원을 선택합니다.

---

## 1단계: 화제 인물 선정 (약 2분)

1. **카테고리 고정 확인**: \`내 채널 단일 카테고리 고정\` 드롭다운에서 담당 채널 카테고리를 선택합니다.
2. **시간 필터 활용**: 최신 이슈는 **\`24시간 / 48시간\`**, 꾸준히 터지는 스테디·역주행 인물은 **\`30일(월간)\`** 탭에서 고릅니다.
3. **연관 인물 추가 공략**: 반응이 좋은 인물은 카드 안의 **\`동반 떡상 세트\`**(\`+ 인물명\`)를 눌러 바로 다음 편으로 제작합니다.
4. 원하는 인물 카드의 **\`🎬 쇼츠 제작\`** 버튼을 누릅니다.

---

## 2단계: 대본 생성 & 사진/영상 채우기 (약 7분)

처음 들어가면 **\`[📖 대본 생성 가이드]\`** 화면이 보입니다. (아직 AI 대본 생성 전 상태입니다.)

1. **AI 대본 생성하기**
   - 상단에서 **[기획 포맷]**과 **[대본 말투]**(\`친근한 썰풀이\` / \`직설·다큐 쇼츠체\` / \`뉴스 브리핑체\`)를 선택합니다.
   - 필요 시 **[강조 키워드]**를 입력하거나, 동일 인물로 여러 편을 만들 때는 **\`🎭 1인 3각도 연작\`**(\`① 무명·초창기\` / \`② 소박한 반전\` / \`③ 눈물·감동\`) 중 하나를 누릅니다.
   - **\`✨ 대본 생성\`** (또는 **\`지금 맞춤 대본 생성하기\`**) 버튼을 누릅니다.
2. **대본 3초 검수 (휴먼 터치)**
   - 하단 **\`⚠️ 팩트 & 초상권 체크\`**와 **\`✨ 휴먼 터치 3초 점검\`** 배지를 확인합니다.
   - **Scene 1(첫 3초 훅)**이 20-30자 이내로 짧고 강렬한지 확인하고 필요하면 다듬습니다.
3. **씬별 실제 사진 & 동영상 넣기 (드래그프리 활용)**
   - 각 Scene의 **\`🔍 사진 찾기\`** 버튼을 눌러 구글 이미지 검색창에서 **실제 과거 사진 · 기사 사진 · 현장 사진**을 찾습니다.
   - 크롬 **\`드래그프리(자동 ON)\`** 덕분에 우클릭 금지된 사이트 사진도 바로 저장해 **\`사진 업로드\`**로 넣을 수 있습니다. (최소 6-10장 이상 교체 권장)
   - **다른 쇼츠/릴스 영상 클립 첨부 시 (\`동영상 편집\`)**:
     - **\`화면 자르기\` 탭**: \`📱 쇼츠/릴스 자막·UI 컷\` 프리셋 또는 상/하/좌/우 슬라이더로 기존 자막·워터마크를 잘라냅니다.
     - **\`음성/BGM\` 탭**: **\`🎛️ 배경음악(BGM) · 음성 분리 실행\`**으로 목소리와 배경음악을 분리해 원하는 트랙만 남기거나, AI 성우만 쓸 경우 \`음소거\`를 체크합니다.

---

## 3단계: 쇼츠 영상 렌더링 & 다운로드 (약 3분)

2단계 하단 **\`🎬 쇼츠 영상 제작 (3단계) ➔\`** 버튼을 누릅니다.

1. 우측 **9:16 미리보기**에서 자막이 잘리지 않는지 확인합니다. (초보자는 **\`✨ 쇼츠 바이럴 추천 세팅 적용\`** 1클릭)
2. **\`🎵 유튜브 기본 음원 모드 ON\`** 상태를 확인하고, 필요 시 **\`🎚️ 씬별 음소거·볼륨\`**에서 씬별 목소리 크기를 조절합니다.
3. **\`🎬 맞춤 자막 & 음성 포함 쇼츠 영상 제작 시작\`** 버튼을 누릅니다. *(진행 중 **\`✕ 제작 취소\`**로 언제든 중단 가능)*
4. 완료 후 **\`1080p 다운로드\`**를 눌러 저장합니다.

---

## 4단계: 인스타 캐러셀(카드뉴스) 제작 (약 2분)

1. 상단 **\`캐러셀\`** 탭으로 이동합니다.
2. 방금 제작한 대본·사진이 자동 연동된 카드뉴스를 확인하고 전체 이미지를 다운로드합니다.

---

## 5단계: 유튜브 · 인스타 · 틱톡 동시 업로드 체크리스트 (약 3분)

- **유튜브 쇼츠**: 9:16 영상 업로드 + **[사운드 추가]에서 유튜브 기본 음원 선택(볼륨 10-15%)** + 제목/해시태그 3-5개 + 업로드 직후 **고정 댓글** 작성
- **인스타그램**:
  - **릴스**: 동일 영상 업로드 + 인스타 추천 음원(낮은 볼륨) + 캡션
  - **캐러셀**: 4단계에서 저장한 카드뉴스 여러 장 피드 업로드
- **틱톡**: 동일 영상 업로드 + 틱톡 트렌딩 음원(볼륨 10% 내외) + 해시태그 3-5개
`;

export const ManualModal: React.FC<ManualModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownloadMarkdown = () => {
    const blob = new Blob(['\uFEFF' + MANUAL_MARKDOWN], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Untold_쇼츠_제작_매뉴얼.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadHtml = () => {
    const escaped = MANUAL_MARKDOWN
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Untold 쇼츠 제작 실전 매뉴얼</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Pretendard", "Malgun Gothic", sans-serif; max-width: 820px; margin: 32px auto; padding: 0 20px; line-height: 1.7; color: #191919; background: #fbfbfa; }
  pre { white-space: pre-wrap; font-family: inherit; background: #fff; border: 1px solid #e3e2de; border-radius: 14px; padding: 24px; }
  @media print { body { background: #fff; margin: 0; } pre { border: none; padding: 0; } }
</style>
</head>
<body>
<pre>${escaped}</pre>
</body>
</html>`;
    const blob = new Blob(['\uFEFF' + html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Untold_쇼츠_제작_매뉴얼.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(MANUAL_MARKDOWN).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto"
    >
      <div className="bg-white border border-[#E3E2DE] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-[#EDEDEB] bg-[#FBFBFA] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold text-[#191919] truncate">
                📖 Untold 쇼츠·릴스·틱톡 제작 실전 매뉴얼
              </h2>
              <p className="text-[11px] text-[#787774] truncate">
                크롬 + 드래그프리 세팅부터 3대 플랫폼 업로드까지 한눈에 보고 파일로 저장하세요.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
              title="웹/모바일에서 바로 열어볼 수 있는 HTML 파일로 다운로드"
            >
              <Download className="w-3.5 h-3.5" />
              <span>매뉴얼 다운로드 (.html)</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadMarkdown}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#F1F1EF] hover:bg-[#E3E2DE] border border-[#E3E2DE] text-[#37352F] text-xs font-bold transition cursor-pointer"
              title="마크다운(.md) 파일로 다운로드"
            >
              <Download className="w-3.5 h-3.5" />
              <span>.md</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#23272A] hover:bg-black text-white text-xs font-bold transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '복사됨' : '복사'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#787774] hover:text-[#191919] hover:bg-[#F1F1EF] transition cursor-pointer"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Highlight Banner for Chrome + DragFree */}
        <div className="px-4 sm:px-6 pt-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
            <div className="font-extrabold flex items-center gap-1.5">
              <span>🧩 필수 세팅: 구글 크롬(Chrome) + 확장프로그램 ‘드래그프리(DragFree)’</span>
            </div>
            <p className="text-[11px] text-emerald-900 leading-relaxed">
              웹 브라우저로 <strong>구글 크롬</strong>을 사용하고 크롬 웹스토어에서 <strong>‘드래그프리’</strong>를 설치한 뒤 <strong>[자동] 스위치</strong>를 켜두세요. 기사·블로그의 우클릭 방지가 해제되어 인터넷상의 인물·기사 사진을 1초 만에 편하게 저장할 수 있습니다.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <pre className="whitespace-pre-wrap font-sans text-xs sm:text-[13px] leading-relaxed text-[#37352F] bg-[#FBFBFA] border border-[#E3E2DE] rounded-2xl p-4 sm:p-5">
            {MANUAL_MARKDOWN}
          </pre>
        </div>
      </div>
    </div>
  );
};

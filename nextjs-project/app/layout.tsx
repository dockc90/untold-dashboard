import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AutoShorts - 화제의 인물 유튜브 쇼츠 제작 SaaS',
  description: 'AI 기반 화제의 인물 발굴, 3초 후킹 대본 및 씬별 에셋 가이드 자동화 플랫폼',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}

# AutoShorts (우체국) - Next.js & Supabase & Vercel 배포 가이드

## 1. 개요
화제의 인물 스토리텔링 쇼츠 제작 자동화 SaaS의 Next.js App Router 프로덕션 템플릿입니다.

## 2. 필수 환경 변수 (.env.local / Vercel Environment Variables)
```bash
GEMINI_API_KEY="your_gemini_api_key"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"
```

## 3. Supabase 데이터베이스 세팅
1. [Supabase 대시보드](https://supabase.com)에서 새 프로젝트 생성
2. 좌측 메뉴 **SQL Editor**로 이동
3. 프로젝트 내 `/supabase/schema.sql` 전체 내용을 복사하여 실행 (Run)
4. 완료 시 `profiles`, `trending_figures`, `shorts_projects`, `project_hooks`, `project_scenes`, `project_metadata` 테이블 및 RLS 보안 정책이 자동 구성됩니다.

## 4. 로컬 실행
```bash
npm install
npm run dev
```
브라우저에서 `http://localhost:3000` 접속

## 5. Vercel 원클릭 배포
1. 본 레포지토리를 GitHub에 Push
2. [Vercel](https://vercel.com)에서 **Add New Project** 선택 후 레포지토리 Import
3. Environment Variables에 위의 3개 환경변수 등록
4. **Deploy** 클릭 ➔ 약 1분 내 프로덕션 URL 생성 완료!

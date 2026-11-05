import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary fallbackTitle="대시보드를 불러오는 중 일시적인 오류가 발생했습니다">
    <App />
  </ErrorBoundary>
);

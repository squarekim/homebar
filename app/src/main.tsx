import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { ensureSeeded } from './db/migrate';
import { App } from './ui/App';
import { ErrorBoundary, StorageBlocked } from './ui/Boot';
import './styles.css';

try { registerSW({ immediate: true }); } catch { /* SW 미지원 환경(데모 등)에서는 무시 */ }

async function boot() {
  const root = createRoot(document.getElementById('root')!);
  try {
    await ensureSeeded();
  } catch (e) {
    // IndexedDB 가 막힌 브라우저(인앱 브라우저·시크릿 모드) — 흰 화면 대신 이유를 보여준다
    root.render(<StorageBlocked detail={(e as Error)?.message} />);
    return;
  }
  root.render(
    <React.StrictMode>
      <ErrorBoundary><App /></ErrorBoundary>
    </React.StrictMode>,
  );
}

boot();

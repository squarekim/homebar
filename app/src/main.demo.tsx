/** 데모(단일 파일) 진입점 — 서비스워커 없이 부팅. 라이브 링크/아티팩트용. */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ensureSeeded } from './db/migrate';
import { App } from './ui/App';
import './styles.css';

async function boot() {
  try { await ensureSeeded(); } catch (e) { console.warn('seed skipped', e); }
  const root = createRoot(document.getElementById('root')!);
  root.render(<React.StrictMode><App /></React.StrictMode>);
}

boot();

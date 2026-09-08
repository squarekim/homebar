import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { ensureSeeded } from './db/migrate';
import { App } from './ui/App';
import './styles.css';

registerSW({ immediate: true });

async function boot() {
  await ensureSeeded();
  const root = createRoot(document.getElementById('root')!);
  root.render(<React.StrictMode><App /></React.StrictMode>);
}

boot();

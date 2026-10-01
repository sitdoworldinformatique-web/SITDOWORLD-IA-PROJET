import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Automatically inject session authentication header to all internal API calls
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  if (url.startsWith('/api') || url.includes('/api/')) {
    const userId = localStorage.getItem('sitdoworld_user_id');
    if (userId) {
      init = init || {};
      const headers = new Headers(init.headers || {});
      if (!headers.has('x-user-id')) {
        headers.set('x-user-id', userId);
      }
      init.headers = headers;
    }
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

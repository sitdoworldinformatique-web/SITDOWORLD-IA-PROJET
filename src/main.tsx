import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Automatically inject session authentication header to all internal API calls
const originalFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  try {
    let url = '';
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else if (input && typeof input === 'object' && 'url' in input) {
      url = input.url;
    }

    if (url.startsWith('/api') || url.includes('/api/')) {
      const userId = localStorage.getItem('sitdoworld_user_id');
      if (userId && userId !== 'guest') {
        init = init || {};
        const headers = new Headers(init.headers || {});
        if (!headers.has('x-user-id')) {
          headers.set('x-user-id', userId);
        }
        init.headers = headers;
      }
    }
  } catch (err) {
    console.warn('[Fetch Interceptor] Error injecting auth header:', err);
  }

  return originalFetch(input, init);
};

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}

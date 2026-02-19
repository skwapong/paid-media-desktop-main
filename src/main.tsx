import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/manrope/300.css';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/geist-mono/400.css';
import '@fontsource/geist-mono/500.css';
import '@fontsource/geist-mono/600.css';
import '@fontsource/geist-mono/700.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/globals.css';

console.log('🚀 Paid Media Suite - Renderer process starting...');
console.log('📍 Location:', window.location.href);
console.log('🔧 Environment:', import.meta.env.MODE);

try {
  console.log('📦 Getting root element...');
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    throw new Error('Root element not found! Check index.html for <div id="root"></div>');
  }

  console.log('✅ Root element found:', rootElement);
  console.log('🎨 Creating React root...');

  const root = ReactDOM.createRoot(rootElement);

  console.log('✅ React root created');
  console.log('🎬 Rendering App component...');

  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );

  console.log('✅ App render initiated');
} catch (error) {
  console.error('❌ Fatal error in main.tsx:', error);
  console.error('Stack:', error instanceof Error ? error.stack : 'No stack available');

  // Display error directly in DOM as fallback
  document.body.innerHTML = `
    <div style="
      padding: 20px;
      margin: 20px;
      border: 2px solid #dc2626;
      border-radius: 8px;
      background-color: #fee;
      font-family: monospace;
    ">
      <h1 style="color: #dc2626;">⚠️ Fatal Startup Error</h1>
      <p><strong>Error:</strong> ${error instanceof Error ? error.message : String(error)}</p>
      <pre style="
        margin-top: 10px;
        padding: 10px;
        background-color: #fff;
        overflow: auto;
        font-size: 12px;
      ">${error instanceof Error ? error.stack : 'No stack trace available'}</pre>
    </div>
  `;
}

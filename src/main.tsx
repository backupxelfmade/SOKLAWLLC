import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { initializeAccessibility } from './utils/accessibility';
import { initializePerformanceOptimizations } from './utils/performanceOptimization';
import { setupGlobalErrorHandling } from './utils/errorHandling';

// Initialize global utilities
setupGlobalErrorHandling();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initializeAccessibility();
  initializePerformanceOptimizations();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
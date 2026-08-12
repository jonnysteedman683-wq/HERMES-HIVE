import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {applyTheme, getStoredTheme} from './client/theme/HiveTheme.tsx';

// Apply persisted theme before first paint to avoid a flash of the wrong palette.
applyTheme(getStoredTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

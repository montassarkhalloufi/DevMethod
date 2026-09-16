import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('Racine de l’application absente.');
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

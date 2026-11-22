import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PopupApp } from '../../ui/components/PopupApp';
import '../../ui/styles/app.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <PopupApp />
    </StrictMode>,
  );
}

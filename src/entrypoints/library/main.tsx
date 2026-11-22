import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LibraryApp } from '../../ui/components/LibraryApp';
import '../../ui/styles/app.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <LibraryApp />
    </StrictMode>,
  );
}

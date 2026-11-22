import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ToastHost } from '../../ui/components/controls';
import { SettingsPage } from '../../ui/components/SettingsPage';
import { useLibrary } from '../../ui/state/library';
import { useSettings } from '../../ui/state/settings';
import '../../ui/styles/app.css';

function OptionsApp() {
  useEffect(() => {
    void useSettings.getState().init();
    void useLibrary.getState().init();
  }, []);
  return (
    <div className="library options-page">
      <main className="main options-main">
        <div className="reading">
          <SettingsPage />
        </div>
      </main>
      <ToastHost />
    </div>
  );
}

const root = document.getElementById('root');
if (root)
  createRoot(root).render(
    <StrictMode>
      <OptionsApp />
    </StrictMode>,
  );

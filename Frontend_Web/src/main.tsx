import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <AuthProvider>
      <WorkspaceProvider>
        <App />
      </WorkspaceProvider>
    </AuthProvider>
  </ThemeProvider>,
);

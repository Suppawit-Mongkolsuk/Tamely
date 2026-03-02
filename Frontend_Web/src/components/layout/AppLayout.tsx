// ===== App Layout =====
// Sidebar + Header + Page content area

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppLayoutProps {
  onLogout: () => void;
}

export function AppLayout({ onLogout }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-muted">
      <Sidebar isOpen={sidebarOpen} onLogout={onLogout} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-auto bg-muted">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

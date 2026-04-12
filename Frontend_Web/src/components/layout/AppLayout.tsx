// ===== App Layout =====
// Sidebar + Header + Page content area
// Mobile: Sidebar เป็น overlay drawer พร้อม backdrop
// Desktop: Sidebar push content แบบเดิม (toggle ได้)

import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppLayoutProps {
  onLogout: () => void;
}

export function AppLayout({ onLogout }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // ตรวจจับขนาดหน้าจอ — mobile (< 768px) ปิด sidebar เป็น default
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const apply = (matches: boolean) => {
      setIsMobile(matches);
      setSidebarOpen(!matches); // mobile = closed, desktop = open
    };
    apply(mq.matches);
    const handler = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen overflow-hidden bg-muted">
      {/* Backdrop — แสดงเฉพาะ mobile เมื่อ sidebar เปิด */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={closeSidebar}
          aria-label="Close sidebar"
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        isMobile={isMobile}
        onLogout={onLogout}
        onNavigate={isMobile ? closeSidebar : undefined}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-auto bg-muted">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

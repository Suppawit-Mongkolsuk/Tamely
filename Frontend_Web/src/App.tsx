import { useState } from 'react';
import {
  Home,
  MessageSquare,
  Brain,
  FolderKanban,
  Settings,
  Menu,
  Calendar,
  LogOut,
} from 'lucide-react';
import { Toaster } from 'sonner';
import { LoginRegisterPage } from './Pages/LoginRegisterPage';
import { ForgotPasswordPage } from './Pages/ForgotPasswordPage';
import { LandingPage } from './Pages/LandingPage';
import { HomePage } from './Pages/HomePage';
import { ChatRoomsPage } from './Pages/ChatRoomsPage';
import { AIChatPage } from './Pages/AIChatPage';
import { CalendarPage } from './Pages/CalendarPage';
import { ManagementPage } from './Pages/ManagementPage';
import { SettingsPage } from './Pages/SettingsPage';

type Page =
  | 'home'
  | 'chat-rooms'
  | 'ai-chat'
  | 'calendar'
  | 'management'
  | 'settings';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [hasJoinedWorkspace, setHasJoinedWorkspace] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setHasJoinedWorkspace(false);
    setCurrentPage('home');
  };

  // Show forgot password page
  if (showForgotPassword) {
    return <ForgotPasswordPage onBack={() => setShowForgotPassword(false)} />;
  }

  // Show login/register page if user is not logged in
  if (!isLoggedIn) {
    return (
      <LoginRegisterPage
        onComplete={() => setIsLoggedIn(true)}
        onForgotPassword={() => setShowForgotPassword(true)}
      />
    );
  }

  // Show landing page if user hasn't joined/created a workspace
  if (!hasJoinedWorkspace) {
    return <LandingPage onComplete={() => setHasJoinedWorkspace(true)} />;
  }

  const navigation = [
    { id: 'home', name: 'Home / Feed', icon: Home },
    { id: 'chat-rooms', name: 'Chat Rooms', icon: MessageSquare },
    { id: 'ai-chat', name: 'AI Chat', icon: Brain },
    { id: 'calendar', name: 'Calendar', icon: Calendar },
    { id: 'management', name: 'Workspace Management', icon: FolderKanban },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'chat-rooms':
        return <ChatRoomsPage />;
      case 'ai-chat':
        return <AIChatPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'management':
        return <ManagementPage />;
      case 'settings':
        return <SettingsPage onLogout={handleLogout} />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-muted">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 bg-[#003366] text-white flex flex-col overflow-hidden`}
      >
        <div className="p-6">
          <h1 className="text-white">TamelyChat</h1>
          <p className="text-sm text-white/70 mt-1">AI-Powered Workspace</p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as Page)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  currentPage === item.id
                    ? 'bg-[#174978] text-white'
                    : 'text-white/70 hover:bg-[#174978]/50 hover:text-white'
                }`}
              >
                <Icon className="size-5" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-[#5EBCAD] flex items-center justify-center">
              <span>JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">John Doe</p>
              <p className="text-xs text-white/60">Admin</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-border px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-foreground">
              {navigation.find((item) => item.id === currentPage)?.name}
            </h2>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-muted">{renderPage()}</main>
      </div>
      <Toaster richColors />
    </div>
  );
}

export default App;

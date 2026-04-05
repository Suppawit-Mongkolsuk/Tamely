import { useState } from 'react';
import { PageTabs, type PageTab } from '@/components/ui/page-tabs';
import { ProfileTab } from './settings/ProfileTab';

const SETTINGS_TABS: PageTab[] = [
  { key: 'profile', label: 'Profile' },
  // เพิ่ม tab อื่นได้ในอนาคต เช่น:
  // { key: 'notifications', label: 'Notifications' },
  // { key: 'security', label: 'Security' },
];

interface SettingsPageProps {
  onLogout: () => void;
}

export function SettingsPage({ onLogout }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <p className="text-muted-foreground">จัดการบัญชีและโปรไฟล์ของคุณ</p>
      </div>

      <PageTabs
        tabs={SETTINGS_TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'profile' && <ProfileTab onLogout={onLogout} />}
    </div>
  );
}
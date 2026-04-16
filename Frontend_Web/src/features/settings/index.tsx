import { useState } from 'react';
import { PageTabs, type PageTab } from '@/components/ui/page-tabs';
import { ProfileTab } from './ProfileTab';

const SETTINGS_TABS: PageTab[] = [
  { key: 'profile', label: 'Profile' },
];

interface SettingsPageProps {
  onLogout: () => void;
}

export function SettingsPage({ onLogout }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-5xl mx-auto">
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
import { useState } from 'react';
import { Mail, Smartphone, Bell } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function NotificationsTab() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [mentionNotifications, setMentionNotifications] = useState(true);

  return (
    <Card className="p-6 bg-white">
      <h3 className="mb-6">Notification Preferences</h3>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Mail className="size-5 text-[#003366] mt-0.5" />
            <div>
              <p>Email Notifications</p>
              <p className="text-sm text-muted-foreground mt-1">
                Receive email updates about your activity
              </p>
            </div>
          </div>
          <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Smartphone className="size-5 text-[#003366] mt-0.5" />
            <div>
              <p>Push Notifications</p>
              <p className="text-sm text-muted-foreground mt-1">
                Get push notifications on your devices
              </p>
            </div>
          </div>
          <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Bell className="size-5 text-[#003366] mt-0.5" />
            <div>
              <p>Mention Notifications</p>
              <p className="text-sm text-muted-foreground mt-1">
                Get notified when someone mentions you
              </p>
            </div>
          </div>
          <Switch checked={mentionNotifications} onCheckedChange={setMentionNotifications} />
        </div>

        <Separator />

        <div>
          <h4 className="mb-4">Email Frequency</h4>
          <Select defaultValue="instant">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instant">Instant</SelectItem>
              <SelectItem value="hourly">Hourly Digest</SelectItem>
              <SelectItem value="daily">Daily Digest</SelectItem>
              <SelectItem value="weekly">Weekly Digest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline">Cancel</Button>
          <Button className="bg-primary hover:bg-primary/90">Save Preferences</Button>
        </div>
      </div>
    </Card>
  );
}

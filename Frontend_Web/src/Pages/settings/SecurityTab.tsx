import { Lock, Shield, Globe, Smartphone, LogOut } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface SecurityTabProps {
  onLogout: () => void;
}

export function SecurityTab({ onLogout }: SecurityTabProps) {
  return (
    <Card className="p-6 bg-white">
      <h3 className="mb-6">Security Settings</h3>
      <div className="space-y-6">
        <div>
          <h4 className="mb-4 flex items-center gap-2">
            <Lock className="size-4 text-[#003366]" />
            Change Password
          </h4>
          <div className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input id="confirmNewPassword" type="password" className="mt-1.5" />
            </div>
            <Button className="bg-primary hover:bg-primary/90">Update Password</Button>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="mb-4 flex items-center gap-2">
            <Shield className="size-4 text-[#003366]" />
            Two-Factor Authentication
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            Add an extra layer of security to your account
          </p>
          <Button variant="outline">Enable 2FA</Button>
        </div>

        <Separator />

        <div>
          <h4 className="mb-4">Active Sessions</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-[#003366]/10 flex items-center justify-center">
                  <Globe className="size-5 text-[#003366]" />
                </div>
                <div>
                  <p className="text-sm">Chrome on MacOS</p>
                  <p className="text-xs text-muted-foreground">Current session</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" disabled>Active</Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-[#003366]/10 flex items-center justify-center">
                  <Smartphone className="size-5 text-[#003366]" />
                </div>
                <div>
                  <p className="text-sm">Mobile App on iPhone</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Revoke</Button>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="mb-2 flex items-center gap-2 text-red-600">
            <LogOut className="size-4" />
            Sign Out
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            Sign out of your account on this device.
          </p>
          <Button
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            onClick={onLogout}
          >
            <LogOut className="size-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </Card>
  );
}

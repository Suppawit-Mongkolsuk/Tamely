import React, { useState } from 'react';
import {
  User,
  Bell,
  Lock,
  Palette,
  Globe,
  Shield,
  Mail,
  Smartphone,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Separator } from '../components/ui/separator';

export function SettingsPage({ onLogout }: { onLogout: () => void }) {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [mentionNotifications, setMentionNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-white border border-border">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="p-6 bg-white">
            <h3 className="mb-6">Profile Information</h3>

            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="size-24 rounded-full bg-[#5EBCAD] flex items-center justify-center text-white">
                  <span className="text-2xl">JD</span>
                </div>
                <div className="space-y-2">
                  <Button variant="outline">Change Avatar</Button>
                  <p className="text-sm text-muted-foreground">
                    JPG, PNG or GIF. Max size 2MB.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    defaultValue="John"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="Doe" className="mt-1.5" />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue="john.doe@company.com"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  defaultValue="Product Manager passionate about building great products"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select defaultValue="utc-7">
                  <SelectTrigger id="timezone" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc-7">Pacific Time (UTC-7)</SelectItem>
                    <SelectItem value="utc-5">Eastern Time (UTC-5)</SelectItem>
                    <SelectItem value="utc+0">GMT (UTC+0)</SelectItem>
                    <SelectItem value="utc+1">
                      Central European Time (UTC+1)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline">Cancel</Button>
                <Button className="bg-primary hover:bg-primary/90">
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
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
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
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
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
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
                <Switch
                  checked={mentionNotifications}
                  onCheckedChange={setMentionNotifications}
                />
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
                <Button className="bg-primary hover:bg-primary/90">
                  Save Preferences
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
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
                    <Input
                      id="currentPassword"
                      type="password"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      className="mt-1.5"
                    />
                  </div>
                  <Button className="bg-primary hover:bg-primary/90">
                    Update Password
                  </Button>
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
                        <p className="text-xs text-muted-foreground">
                          San Francisco, CA • Current session
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" disabled>
                      Active
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-[#003366]/10 flex items-center justify-center">
                        <Smartphone className="size-5 text-[#003366]" />
                      </div>
                      <div>
                        <p className="text-sm">Mobile App on iPhone</p>
                        <p className="text-xs text-muted-foreground">
                          San Francisco, CA • 2 hours ago
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Revoke
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Logout Section */}
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-red-600">
                  <LogOut className="size-4" />
                  Sign Out
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Sign out of your account on this device. You will need to log
                  in again to access your workspace.
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
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="p-6 bg-white">
            <h3 className="mb-6">Appearance Settings</h3>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="size-10 rounded-lg bg-[#003366]/10 flex items-center justify-center">
                    {darkMode ? (
                      <Moon className="size-5 text-[#003366]" />
                    ) : (
                      <Sun className="size-5 text-[#003366]" />
                    )}
                  </div>
                  <div>
                    <p>Dark Mode</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Toggle dark mode on or off
                    </p>
                  </div>
                </div>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>

              <Separator />

              <div>
                <h4 className="mb-4 flex items-center gap-2">
                  <Palette className="size-4 text-[#003366]" />
                  Theme Color
                </h4>
                <div className="grid grid-cols-6 gap-3">
                  {[
                    '#003366',
                    '#174978',
                    '#2F5F8A',
                    '#46769B',
                    '#5EBCAD',
                    '#75A2BF',
                  ].map((color) => (
                    <button
                      key={color}
                      className="size-12 rounded-lg border-2 border-border hover:border-primary transition-colors"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="mb-4">Font Size</h4>
                <Select defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline">Reset to Default</Button>
                <Button className="bg-primary hover:bg-primary/90">
                  Save Appearance
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card className="p-6 bg-white">
            <h3 className="mb-6">General Preferences</h3>

            <div className="space-y-6">
              <div>
                <Label htmlFor="language">Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger id="language" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="th">ไทย (Thai)</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div>
                <Label htmlFor="startPage">Default Start Page</Label>
                <Select defaultValue="home">
                  <SelectTrigger id="startPage" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Home / Feed</SelectItem>
                    <SelectItem value="chat">Chat Rooms</SelectItem>
                    <SelectItem value="ai">AI Insights</SelectItem>
                    <SelectItem value="workspace">
                      Workspace Management
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div>
                <Label htmlFor="messageStyle">Message Display Style</Label>
                <Select defaultValue="comfortable">
                  <SelectTrigger id="messageStyle" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="comfortable">Comfortable</SelectItem>
                    <SelectItem value="spacious">Spacious</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p>Show unread badge count</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Display badge count for unread messages
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p>Enable keyboard shortcuts</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Use keyboard shortcuts for quick navigation
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline">Cancel</Button>
                <Button className="bg-primary hover:bg-primary/90">
                  Save Preferences
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

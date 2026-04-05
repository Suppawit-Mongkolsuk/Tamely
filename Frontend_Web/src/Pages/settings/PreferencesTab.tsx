import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function PreferencesTab() {
  return (
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
              <SelectItem value="workspace">Workspace Management</SelectItem>
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
          <Button className="bg-primary hover:bg-primary/90">Save Preferences</Button>
        </div>
      </div>
    </Card>
  );
}

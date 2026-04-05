import { useState } from 'react';
import { Moon, Sun, Palette } from 'lucide-react';
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
import { BRAND_COLORS } from '@/lib/constants';

const THEME_COLORS = Object.values(BRAND_COLORS);

export function AppearanceTab() {
  const [darkMode, setDarkMode] = useState(false);

  return (
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
              <p className="text-sm text-muted-foreground mt-1">Toggle dark mode on or off</p>
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
            {THEME_COLORS.map((color) => (
              <button
                key={color}
                className="size-12 rounded-lg border-2 border-border hover:border-primary transition-colors"
                style={{ backgroundColor: color }}
                title={color}
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
          <Button className="bg-primary hover:bg-primary/90">Save Appearance</Button>
        </div>
      </div>
    </Card>
  );
}

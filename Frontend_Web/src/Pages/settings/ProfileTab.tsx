import { useState } from 'react';
import { User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ProfileTab() {
  return (
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
            <Input id="firstName" defaultValue="John" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" defaultValue="Doe" className="mt-1.5" />
          </div>
        </div>

        <div>
          <Label htmlFor="profileEmail">Email Address</Label>
          <Input
            id="profileEmail"
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
              <SelectItem value="utc+1">Central European Time (UTC+1)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline">Cancel</Button>
          <Button className="bg-primary hover:bg-primary/90">Save Changes</Button>
        </div>
      </div>
    </Card>
  );
}

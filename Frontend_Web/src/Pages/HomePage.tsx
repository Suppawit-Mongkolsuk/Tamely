import React, { useState } from 'react';
import { Plus, Filter, Pin, Users, Calendar, MoreVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Announcement {
  id: string;
  title: string;
  content: string;
  workspace: string;
  room: string;
  author: string;
  timestamp: string;
  isPinned: boolean;
  views: number;
}

export function HomePage() {
  const [filter, setFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: '1',
      title: 'Q1 Product Roadmap Review',
      content:
        'Please review the updated Q1 roadmap. Key priorities include feature enhancements, performance optimization, and user experience improvements. Your feedback is crucial for our planning.',
      workspace: 'Engineering',
      room: 'General',
      author: 'Sarah Johnson',
      timestamp: '2 hours ago',
      isPinned: true,
      views: 124,
    },
    {
      id: '2',
      title: 'Team Building Event - Friday 5PM',
      content:
        "Join us for a team building activity this Friday at 5PM. We'll have games, food, and fun activities. Please RSVP by Wednesday.",
      workspace: 'Company-wide',
      room: 'Announcements',
      author: 'HR Team',
      timestamp: '5 hours ago',
      isPinned: true,
      views: 89,
    },
    {
      id: '3',
      title: 'New Design System Components Released',
      content:
        'The design team has released new components for the design system. Check out the updated documentation and start implementing them in your projects.',
      workspace: 'Design',
      room: 'Design Systems',
      author: 'Mike Chen',
      timestamp: '1 day ago',
      isPinned: false,
      views: 67,
    },
    {
      id: '4',
      title: 'Security Update Required',
      content:
        'All team members must complete the security training module by end of week. This is mandatory for compliance purposes.',
      workspace: 'Company-wide',
      room: 'Security',
      author: 'IT Department',
      timestamp: '2 days ago',
      isPinned: false,
      views: 156,
    },
  ]);

  const filteredAnnouncements =
    filter === 'all'
      ? announcements
      : announcements.filter((a) =>
          a.workspace.toLowerCase().includes(filter.toLowerCase()),
        );

  const pinnedAnnouncements = filteredAnnouncements.filter((a) => a.isPinned);
  const regularAnnouncements = filteredAnnouncements.filter((a) => !a.isPinned);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Stay updated with the latest announcements
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48 bg-white">
              <Filter className="size-4 mr-2" />
              <SelectValue placeholder="Filter by workspace" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Workspaces</SelectItem>
              <SelectItem value="engineering">Engineering</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="company-wide">Company-wide</SelectItem>
            </SelectContent>
          </Select>

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="size-4 mr-2" />
                Create Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-150">
              <DialogHeader>
                <DialogTitle>Create New Announcement</DialogTitle>
                <DialogDescription>
                  Share important updates with your team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter announcement title"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Enter announcement content"
                    rows={5}
                    className="mt-1.5"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workspace">Workspace</Label>
                    <Select>
                      <SelectTrigger id="workspace" className="mt-1.5">
                        <SelectValue placeholder="Select workspace" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="engineering">Engineering</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="company-wide">
                          Company-wide
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="room">Room</Label>
                    <Select>
                      <SelectTrigger id="room" className="mt-1.5">
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="announcements">
                          Announcements
                        </SelectItem>
                        <SelectItem value="random">Random</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button className="bg-primary hover:bg-primary/90">
                    Publish
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pinned Announcements */}
      {pinnedAnnouncements.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Pin className="size-4 text-[#003366]" />
            <h3 className="text-[#003366]">Pinned Announcements</h3>
          </div>
          <div className="grid gap-4">
            {pinnedAnnouncements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Announcements */}
      <div className="space-y-3">
        {pinnedAnnouncements.length > 0 && (
          <h3 className="text-foreground">Recent Announcements</h3>
        )}
        <div className="grid gap-4">
          {regularAnnouncements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  return (
    <Card className="p-5 hover:shadow-md transition-shadow bg-white">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            {announcement.isPinned && (
              <Pin className="size-4 text-[#003366] fill-[#003366]" />
            )}
            <h4 className="flex-1">{announcement.title}</h4>
            <button className="p-1 hover:bg-muted rounded">
              <MoreVertical className="size-4 text-muted-foreground" />
            </button>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {announcement.content}
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <Badge
              variant="secondary"
              className="bg-[#5EBCAD]/10 text-[#003366] hover:bg-[#5EBCAD]/20"
            >
              {announcement.workspace}
            </Badge>
            <Badge
              variant="outline"
              className="border-[#75A2BF] text-[#003366]"
            >
              {announcement.room}
            </Badge>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="size-4" />
              <span>{announcement.views} views</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t border-border">
            <span>By {announcement.author}</span>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="size-4" />
              <span>{announcement.timestamp}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

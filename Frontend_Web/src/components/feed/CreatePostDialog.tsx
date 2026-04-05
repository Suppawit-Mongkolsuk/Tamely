import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onTitleChange: (value: string) => void;
  body: string;
  onBodyChange: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}

export function CreatePostDialog({
  open,
  onOpenChange,
  title,
  onTitleChange,
  body,
  onBodyChange,
  onSubmit,
  submitting,
}: CreatePostDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle>Create New Announcement</DialogTitle>
          <DialogDescription>
            Share important updates with your team
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="announcement-title">Title</Label>
            <Input
              id="announcement-title"
              placeholder="Enter announcement title"
              className="mt-1.5"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="announcement-content">Content</Label>
            <Textarea
              id="announcement-content"
              placeholder="Enter announcement content"
              rows={5}
              className="mt-1.5"
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              disabled={submitting || !title.trim() || !body.trim()}
              onClick={onSubmit}
            >
              {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              Publish
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===== Create Room Dialog =====
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRoomDialog({
  open,
  onOpenChange,
}: CreateRoomDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm text-muted-foreground">
          <div className="size-8 rounded-lg bg-[#5EBCAD] flex items-center justify-center">
            <Plus className="size-4 text-white" />
          </div>
          <span>Create New Room</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Create New Room</DialogTitle>
          <DialogDescription>
            Set up a new chat room for your team
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="roomName">Room Name</Label>
            <Input
              id="roomName"
              placeholder="e.g., Project Updates"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="workspace">Workspace</Label>
            <Select>
              <SelectTrigger id="workspace" className="mt-1">
                <SelectValue placeholder="Select workspace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="company">Company-wide</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What's this room about?"
              className="mt-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="private" />
            <Label htmlFor="private" className="cursor-pointer">
              Make this room private
            </Label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="bg-linear-to-r from-[#5EBCAD] to-[#46769B] hover:opacity-90 text-white"
              onClick={() => onOpenChange(false)}
            >
              Create Room
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

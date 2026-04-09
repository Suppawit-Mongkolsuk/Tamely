import { useRef } from 'react';
import { Loader2, ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { MentionInput } from './MentionInput';

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onTitleChange: (value: string) => void;
  body: string;
  onBodyChange: (value: string) => void;
  images: File[];
  onImagesChange: (files: File[]) => void;
  uploadingImages: boolean;
  onSubmit: () => void;
  submitting: boolean;
  workspaceId?: string;
}

export function CreatePostDialog({
  open,
  onOpenChange,
  title,
  onTitleChange,
  body,
  onBodyChange,
  images,
  onImagesChange,
  uploadingImages,
  onSubmit,
  submitting,
  workspaceId,
}: CreatePostDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const combined = [...images, ...files].slice(0, 10);
    onImagesChange(combined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

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
            <Label htmlFor="announcement-content">Content</Label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">
              พิมพ์ <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">@</kbd> เพื่อแท็กสมาชิกหรือยศ
            </p>
            <MentionInput
              value={body}
              onChange={onBodyChange}
              workspaceId={workspaceId}
              placeholder="Enter announcement content"
              multiline
              rows={5}
              className="mt-1.5"
            />
          </div>

          {/* Image upload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>รูปภาพ (ไม่บังคับ)</Label>
              {images.length > 0 && (
                <span className="text-xs text-muted-foreground">{images.length}/10 รูป</span>
              )}
            </div>

            {/* Preview grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {images.map((file, idx) => (
                  <div key={idx} className="relative group aspect-square">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`preview-${idx}`}
                      className="rounded-lg object-cover w-full h-full"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Drop zone */}
            {images.length < 10 && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 rounded-xl py-6 flex flex-col items-center gap-2 transition-colors group"
                >
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <ImagePlus className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">คลิกเพื่อเลือกรูปภาพ</p>
                    <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WEBP · สูงสุด 5 MB/รูป · ไม่เกิน 10 รูป</p>
                  </div>
                </button>
              </>
            )}

            {/* Tips */}
            <div className="mt-2 flex items-start gap-1.5 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <span className="text-blue-400 text-sm mt-0.5"></span>
              <p className="text-xs text-blue-600/80 leading-relaxed">
                แนะนำให้ใช้รูปแนวนอน <span className="font-medium">อัตราส่วน 16:9</span> (เช่น 1280×720px) หรือแนวตั้ง <span className="font-medium">4:3</span> เพื่อให้รูปแสดงผลพอดีโดยไม่ถูกครอป
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              disabled={submitting || uploadingImages || !body.trim()}
              onClick={onSubmit}
            >
              {(submitting || uploadingImages) && (
                <Loader2 className="size-4 mr-2 animate-spin" />
              )}
              {uploadingImages ? 'Uploading...' : 'Publish'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Pin, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { apiClient } from '@/services/api';
import type { ApiSuccessResponse } from '@/types';
import { toast } from 'sonner';
import { PostCard, type PostData } from '@/components/feed/PostCard';
import { CreatePostDialog } from '@/components/feed/CreatePostDialog';
import { useAuthContext } from '@/contexts/AuthContext';

export function HomePage() {
  const { currentWorkspace } = useWorkspaceContext();
  const { user } = useAuthContext();
  const wsId = currentWorkspace?.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightPostId = searchParams.get('post');
  const postRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newImages, setNewImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = useCallback(async () => {
    if (!wsId) return;
    setLoading(true);
    try {
      const res = await apiClient.get<{
        success: boolean;
        data: PostData[];
        total: number;
      }>(`/workspaces/${wsId}/posts`);
      setPosts(res.data);
    } catch {
      toast.error('โหลดโพสต์ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [wsId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  /* ── Scroll to highlighted post (from notification click) ── */
  useEffect(() => {
    if (!highlightPostId || loading) return;
    const el = postRefs.current[highlightPostId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // ล้าง ?post= param หลัง 2.5 วิ เพื่อไม่ให้ highlight ค้าง
      const timer = setTimeout(() => {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete('post');
          return next;
        });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [highlightPostId, loading, setSearchParams]);

  const handleCreate = async () => {
    if (!wsId || !newBody.trim()) return;
    setSubmitting(true);

    try {
      // 1. Upload images ก่อน (ถ้ามี)
      let imageUrls: string[] = [];
      if (newImages.length > 0) {
        setUploadingImages(true);
        const formData = new FormData();
        newImages.forEach((file) => formData.append('images', file));

        const uploadRes = await apiClient.upload<{
          success: boolean;
          data: { urls: string[] };
        }>('/posts/upload-images', formData);
        imageUrls = uploadRes.data.urls;
        setUploadingImages(false);
      }

      // 2. สร้างโพสต์
      await apiClient.post<ApiSuccessResponse<PostData>>(
        `/workspaces/${wsId}/posts`,
        { title: newBody.substring(0, 100), body: newBody, imageUrls },
      );

      setIsCreateDialogOpen(false);
      setNewTitle('');
      setNewBody('');
      setNewImages([]);
      fetchPosts();
    } catch (err) {
      setUploadingImages(false);
      toast.error(err instanceof Error ? err.message : 'สร้างโพสต์ไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  const pinnedPosts = posts.filter((p) => p.isPinned);
  const regularPosts = posts.filter((p) => !p.isPinned);

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleTogglePin = (postId: string, isPinned: boolean) => {
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, isPinned } : p));
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Stay updated with the latest announcements
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="size-4 mr-2" />
          Create Announcement
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            ยังไม่มีโพสต์ใน workspace นี้ เริ่มสร้างโพสต์แรกเลย!
          </p>
        </Card>
      ) : (
        <>
          {pinnedPosts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Pin className="size-4 text-[#003366]" />
                <h3 className="text-[#003366]">Pinned Announcements</h3>
              </div>
              <div className="grid gap-4">
                {pinnedPosts.map((post) => (
                  <div
                    key={post.id}
                    ref={(el) => { postRefs.current[post.id] = el; }}
                  >
                    <PostCard
                      post={post}
                      currentUserId={user?.id}
                      currentUserRole={currentWorkspace?.role}
                      onDelete={handleDeletePost}
                      onTogglePin={handleTogglePin}
                      highlighted={highlightPostId === post.id}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {pinnedPosts.length > 0 && (
              <h3 className="text-foreground">Recent Announcements</h3>
            )}
            <div className="grid gap-4">
              {regularPosts.map((post) => (
                <div
                  key={post.id}
                  ref={(el) => { postRefs.current[post.id] = el; }}
                >
                  <PostCard
                    post={post}
                    currentUserId={user?.id}
                    currentUserRole={currentWorkspace?.role}
                    onDelete={handleDeletePost}
                    onTogglePin={handleTogglePin}
                    highlighted={highlightPostId === post.id}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <CreatePostDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        title={newTitle}
        onTitleChange={setNewTitle}
        body={newBody}
        onBodyChange={setNewBody}
        images={newImages}
        onImagesChange={setNewImages}
        uploadingImages={uploadingImages}
        onSubmit={handleCreate}
        submitting={submitting}
        workspaceId={wsId}
      />
    </div>
  );
}

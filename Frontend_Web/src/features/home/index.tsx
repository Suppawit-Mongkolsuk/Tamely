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
  const { currentWorkspace } = useWorkspaceContext(); // ข้อมูล workspace ที่กำลังใช้งานอยู่ (เช่น ชื่อ workspace, สิทธิ์ของผู้ใช้ใน workspace นั้นๆ เป็นต้น)
  const { user } = useAuthContext(); // ข้อมูลผู้ใช้ที่เข้าสู่ระบบอยู่ (เช่น ชื่อ, อีเมล, รูปโปรไฟล์ เป็นต้น)
  const wsId = currentWorkspace?.id; // id ของ workspace ที่กำลังใช้งานอยู่ (ถ้าไม่มี workspace ที่ถูกเลือกอยู่จะเป็น undefined)
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightPostId = searchParams.get('post'); // ถ้ามี ?post= ใน URL แปลว่าต้องการ highlight โพสต์ที่มี id ตรงกับค่าของ post= นั้นๆ
  const postRefs = useRef<Record<string, HTMLDivElement | null>>({}); // เก็บ ref ของแต่ละโพสต์เพื่อให้สามารถ scroll เข้าไปที่โพสต์นั้นได้เมื่อมีการคลิก notification ที่เกี่ยวข้อง หรือเมื่อมี ?post= ใน URL

  const [posts, setPosts] = useState<PostData[]>([]); // รายการโพสต์ทั้งหมดใน workspace นี้ (รวมทั้ง pinned และ regular)
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false); // state สำหรับควบคุมการแสดง dialog สร้างโพสต์
  const [newTitle, setNewTitle] = useState(''); // state สำหรับเก็บชื่อโพสต์ที่ผู้ใช้กรอกใน dialog สร้างโพสต์
  const [newBody, setNewBody] = useState(''); // state สำหรับเก็บเนื้อหาของโพสต์ที่ผู้ใช้กรอกใน dialog สร้างโพสต์
  const [newImages, setNewImages] = useState<File[]>([]); // state สำหรับเก็บไฟล์รูปภาพที่ผู้ใช้เลือกใน dialog สร้างโพสต์
  const [uploadingImages, setUploadingImages] = useState(false); // state สำหรับบอกว่ากำลังอัปโหลดรูปภาพอยู่หรือไม่
  const [submitting, setSubmitting] = useState(false); // state สำหรับบอกว่ากำลังส่งโพสต์อยู่หรือไม่

  const fetchPosts = useCallback(async () => { // โหลดโพสต์ทั้งหมดใน workspace นี้จาก API และเก็บไว้ใน state เพื่อแสดงในหน้า home
    if (!wsId) return; // ถ้าไม่มี workspace ที่ถูกเลือกอยู่ → ไม่ต้องโหลดโพสต์
    setLoading(true);
    try {
      const res = await apiClient.get<{ // API จะคืนค่าเป็น { success, data: PostData[], total } โดย data เป็น array ของโพสต์ทั้งหมดใน workspace นี้
        success: boolean;
        data: PostData[];
        total: number;
      }>(`/workspaces/${wsId}/posts`);
      setPosts(res.data); // เก็บโพสต์ทั้งหมดที่ได้จาก API ลงใน state เพื่อให้ component สามารถแสดงรายการโพสต์เหล่านี้ได้
    } catch {
      toast.error('โหลดโพสต์ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [wsId]);

  useEffect(() => { // โหลดโพสต์เมื่อเข้าหน้านี้ครั้งแรก หรือเมื่อ workspace ที่เลือกเปลี่ยนไป
    fetchPosts();
  }, [fetchPosts]);

  // ถ้ามี ?post= ใน URL และไม่กำลังโหลดโพสต์ ให้ scroll เข้าไปที่โพสต์นั้น
  useEffect(() => { // เมื่อโพสต์ถูกโหลดเสร็จแล้ว (loading = false) ถ้ามี ?post= ใน URL จะทำการ scroll เข้าไปที่โพสต์ที่มี id ตรงกับค่าของ post= นั้นๆ เพื่อให้ผู้ใช้เห็นโพสต์นั้นได้เลย (เช่น เมื่อคลิก notification ที่เกี่ยวข้อง หรือเมื่อมีลิงก์ที่นำไปสู่โพสต์นั้นๆ)
    if (!highlightPostId || loading) return;
    const el = postRefs.current[highlightPostId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // ล้าง ?post= param หลัง 2.5 วิ เพื่อไม่ให้ highlight ค้าง
      const timer = setTimeout(() => {
        setSearchParams((prev) => { // ลบ ?post= ออกจาก URL หลังจาก scroll เข้าไปที่โพสต์นั้นแล้ว เพื่อไม่ให้ highlight ค้างอยู่ตลอดเวลา
          const next = new URLSearchParams(prev); //
          next.delete('post');  // ลบ param post= ออกจาก URL
          return next;
        });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [highlightPostId, loading, setSearchParams]); //

  const handleCreate = async () => { // สร้างโพส
    if (!wsId || !newBody.trim()) return;
    setSubmitting(true); // ตั้งค่า state ว่ากำลังส่งโพสต์

    try {
      // 1. Upload images ก่อน (ถ้ามี)
      let imageUrls: string[] = [];
      if (newImages.length > 0) { // ถ้ามีรูปภาพที่ผู้ใช้เลือกใน dialog สร้างโพสต์ ให้ทำการอัปโหลดรูปภาพเหล่านั้นไปยัง server ก่อน เพื่อให้ได้ URL ของรูปภาพเหล่านั้นมาเก็บไว้ในโพสต์
        setUploadingImages(true);
        const formData = new FormData();
        newImages.forEach((file) => formData.append('images', file)); // นำไฟล์รูปภาพที่ผู้ใช้เลือกมาใส่ใน FormData เพื่อส่งไปยัง API สำหรับอัปโหลดรูปภาพ

        const uploadRes = await apiClient.upload<{ // API สำหรับอัปโหลดรูปภาพ
          data: { urls: string[] };
        }>('/posts/upload-images', formData);
        imageUrls = uploadRes.data.urls; // เก็บ URL ของรูปภาพที่ได้จาก API มาไว้ในตัวแปร imageUrls เพื่อที่จะนำไปใช้เมื่อสร้างโพสต์
        setUploadingImages(false);
      }

      // 2. สร้างโพสต์
      await apiClient.post<ApiSuccessResponse<PostData>>( // เรียก API เพื่อสร้างโพสต์ใหม่ใน workspace นี้ โดยส่งข้อมูลชื่อโพสต์ เนื้อหาโพสต์ และ URL ของรูปภาพที่อัปโหลด (ถ้ามี) ไปยัง server
        `/workspaces/${wsId}/posts`,
        { title: newBody.substring(0, 100), body: newBody, imageUrls }, //
      );

      setIsCreateDialogOpen(false);
      setNewTitle('');
      setNewBody('');
      setNewImages([]);
      fetchPosts(); // หลังจากสร้างโพสต์เสร็จแล้ว ให้โหลดโพสต์ทั้งหมดใหม่อีกครั้งเพื่อให้โพสต์ที่เพิ่งสร้างเสร็จแสดงขึ้นมาในหน้า home ได้เลย
    } catch (err) {
      setUploadingImages(false);
      toast.error(err instanceof Error ? err.message : 'สร้างโพสต์ไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  const pinnedPosts = posts.filter((p) => p.isPinned); // แยกโพสต์ที่ถูกปักหมุดออกมา
  const regularPosts = posts.filter((p) => !p.isPinned); // แยกโพสต์ปกติออกมา

  const handleDeletePost = (postId: string) => { // ลบโพสต์ออกจาก state เมื่อมีการลบโพสต์สำเร็จ เพื่อให้โพสต์นั้นหายไปจากหน้า home เลยโดยไม่ต้องรอโหลดโพสต์ทั้งหมดใหม่
    setPosts((prev) => prev.filter((p) => p.id !== postId)); // ลบโพสต์ที่มี id ตรงกับ postId ออกจาก state
  };

  const handleTogglePin = (postId: string, isPinned: boolean) => { // สลับสถานะการปักหมุดของโพสต์
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, isPinned } : p)); // อัปเดตสถานะการปักหมุดของโพสต์ใน state
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm sm:text-base">
            Stay updated with the latest announcements
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
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
                      workspaceId={currentWorkspace?.id ?? ''}
                      currentUserId={user?.id}
                      currentUserRole={currentWorkspace?.role}
                      currentUserPermissions={currentWorkspace?.myPermissions}
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
                    workspaceId={currentWorkspace?.id ?? ''}
                    currentUserId={user?.id}
                    currentUserRole={currentWorkspace?.role}
                    currentUserPermissions={currentWorkspace?.myPermissions}
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

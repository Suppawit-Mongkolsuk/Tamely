import { useState, useEffect, useCallback, useRef } from 'react';
import { Pin, Users, MoreVertical, ChevronDown, ChevronUp, Send, Loader2, Trash2, X, ChevronLeft, ChevronRight, PinOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/services/api';
import { toast } from 'sonner';
import { MentionInput } from './MentionInput';
import { MentionText } from './MentionText';

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: { id: string; Name: string; avatarUrl?: string | null };
}

export interface PostData {
  id: string;
  workspaceId: string;
  title: string;
  body: string;
  isPinned: boolean;
  imageUrls?: string[];
  createdAt: string;
  updatedAt: string;
  author: { id: string; Name: string; avatarUrl?: string | null };
  commentCount?: number;
  _count?: { comments: number };
}

interface PostCardProps {
  post: PostData;
  currentUserId?: string;
  currentUserRole?: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
  onDelete?: (postId: string) => void;
  onTogglePin?: (postId: string, isPinned: boolean) => void;
  /** เมื่อ true → แสดง ring ไฮไลต์ชั่วคราว (มาจาก notification click) */
  highlighted?: boolean;
}

/* ── Image Lightbox ── */
function ImageLightbox({
  images,
  startIndex,
  onClose,
}: {
  images: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(startIndex);

  const prev = useCallback(() => setCurrent((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, prev, next]);

  return (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
      style={{ width: '100vw', height: '100vh' }}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        onClick={onClose}
      >
        <X className="size-5" />
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/40 px-3 py-1 rounded-full">
          {current + 1} / {images.length}
        </span>
      )}

      {/* Prev */}
      {images.length > 1 && (
        <button
          className="absolute left-4 size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          onClick={(e) => { e.stopPropagation(); prev(); }}
        >
          <ChevronLeft className="size-6" />
        </button>
      )}

      {/* Image */}
      <img
        src={images[current]}
        alt={`Image ${current + 1}`}
        className="max-w-[90vw] max-h-[88vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next */}
      {images.length > 1 && (
        <button
          className="absolute right-4 size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          onClick={(e) => { e.stopPropagation(); next(); }}
        >
          <ChevronRight className="size-6" />
        </button>
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              className={`size-1.5 rounded-full transition-all ${i === current ? 'bg-white w-4' : 'bg-white/50'}`}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Image Grid ── */
function ImageGrid({ images, onOpen }: { images: string[]; onOpen: (idx: number) => void }) {
  const count = images.length;

  if (count === 1) {
    return (
      <div
        className="rounded-xl overflow-hidden cursor-pointer group relative"
        onClick={() => onOpen(0)}
      >
        <img
          src={images[0]}
          alt="Post image"
          className="w-full max-h-105 object-cover group-hover:brightness-95 transition-all duration-200"
        />
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
        {images.map((url, i) => (
          <div key={i} className="cursor-pointer group relative aspect-square" onClick={() => onOpen(i)}>
            <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover group-hover:brightness-95 transition-all duration-200" />
          </div>
        ))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden" style={{ gridTemplateRows: '200px 200px' }}>
        <div className="cursor-pointer group row-span-2" onClick={() => onOpen(0)}>
          <img src={images[0]} alt="Image 1" className="w-full h-full object-cover group-hover:brightness-95 transition-all duration-200" />
        </div>
        {images.slice(1, 3).map((url, i) => (
          <div key={i} className="cursor-pointer group" onClick={() => onOpen(i + 1)}>
            <img src={url} alt={`Image ${i + 2}`} className="w-full h-full object-cover group-hover:brightness-95 transition-all duration-200" />
          </div>
        ))}
      </div>
    );
  }

  // 4+ images — show first 3 + overlay for rest
  const shown = images.slice(0, 3);
  const extra = count - 3;
  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden" style={{ gridTemplateRows: '180px' }}>
      {shown.map((url, i) => (
        <div key={i} className="cursor-pointer group relative" onClick={() => onOpen(i)}>
          <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover group-hover:brightness-95 transition-all duration-200" />
          {i === 2 && extra > 0 && (
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">+{extra}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Avatar helper ── */
function Avatar({ name, avatarUrl, size = 'md' }: { name: string; avatarUrl?: string | null; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'size-8' : 'size-10';
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className={`${cls} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div className={`${cls} rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function PostCard({ post, currentUserId, currentUserRole, onDelete, onTogglePin, highlighted = false }: PostCardProps) {
  const commentCount = post.commentCount ?? post._count?.comments ?? 0;
  const canModerate = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';
  const timeAgo = new Date(post.createdAt).toLocaleDateString('th-TH');

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(commentCount);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // ปิด menu เมื่อคลิกข้างนอก
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleTogglePin = async () => {
    setMenuOpen(false);
    setPinLoading(true);
    try {
      await apiClient.patch(`/posts/${post.id}/pin`, { isPinned: !post.isPinned });
      onTogglePin?.(post.id, !post.isPinned);
      toast.success(post.isPinned ? 'เลิกปักหมุดแล้ว' : 'ปักหมุดแล้ว');
    } catch {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setPinLoading(false);
    }
  };

  const handleDeletePost = async () => {
    setMenuOpen(false);
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/posts/${post.id}`);
      onDelete?.(post.id);
      toast.success('ลบโพสต์แล้ว');
    } catch {
      toast.error('ลบโพสต์ไม่สำเร็จ');
    } finally {
      setDeleteLoading(false);
    }
  };

  const loadComments = async () => {
    if (commentsLoaded) return;
    setLoadingComments(true);
    try {
      const res = await apiClient.get<{ success: boolean; data: PostComment[] }>(
        `/posts/${post.id}/comments`,
      );
      setComments(res.data);
      setCommentsLoaded(true);
    } catch {
      toast.error('โหลดคอมเมนต์ไม่สำเร็จ');
    } finally {
      setLoadingComments(false);
    }
  };

  const toggleComments = async () => {
    if (!showComments && !commentsLoaded) await loadComments();
    setShowComments((prev) => !prev);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await apiClient.post<{ success: boolean; data: PostComment }>(
        `/posts/${post.id}/comments`,
        { content: newComment.trim() },
      );
      setComments((prev) => [...prev, res.data]);
      setLocalCommentCount((c) => c + 1);
      setNewComment('');
    } catch {
      toast.error('เพิ่มคอมเมนต์ไม่สำเร็จ');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await apiClient.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setLocalCommentCount((c) => Math.max(0, c - 1));
    } catch {
      toast.error('ลบคอมเมนต์ไม่สำเร็จ');
    }
  };

  return (
    <Card className={`overflow-visible hover:shadow-md transition-all bg-white ${
      highlighted
        ? 'ring-2 ring-primary shadow-md shadow-primary/20 animate-pulse-once'
        : ''
    }`}>
      <div className="p-5 space-y-3">
        {/* ── Post Header ── */}
        <div className="flex items-start gap-3">
          <Avatar name={post.author.Name} avatarUrl={post.author.avatarUrl} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {post.isPinned && <Pin className="size-3.5 text-[#003366] fill-[#003366] shrink-0" />}
              <span className="font-semibold text-sm text-foreground">{post.author.Name}</span>
              <span className="text-xs text-muted-foreground ml-auto shrink-0">{timeAgo}</span>
              {/* ── 3-dot menu (เห็นได้ทุกคน แต่ function เฉพาะ OWNER/ADMIN) ── */}
              <div className="relative shrink-0" ref={menuRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 -mr-1"
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  {(pinLoading || deleteLoading) ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : (
                    <MoreVertical className="size-4 text-muted-foreground" />
                  )}
                </Button>
                {menuOpen && (
                  <div className="absolute right-0 top-8 z-20 min-w-36 bg-white border border-border rounded-xl shadow-lg py-1 overflow-hidden">
                    <button
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted/60 transition-colors text-foreground"
                      onClick={handleTogglePin}
                    >
                      {post.isPinned ? (
                        <><PinOff className="size-4 text-muted-foreground" /> เลิกปักหมุด</>
                      ) : (
                        <><Pin className="size-4 text-[#003366]" /> ปักหมุด</>
                      )}
                    </button>
                    <div className="h-px bg-border mx-2" />
                    <button
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-red-50 transition-colors text-destructive"
                      onClick={handleDeletePost}
                    >
                      <Trash2 className="size-4" /> ลบโพสต์
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* ── เนื้อหา ── */}
            <div className="font-semibold text-foreground mt-0.5">
              <MentionText text={post.body} />
            </div>
          </div>
        </div>

        {/* ── Images ── */}
        {post.imageUrls && post.imageUrls.length > 0 && (
          <div className="pl-13">
            <ImageGrid images={post.imageUrls} onOpen={(idx) => setLightboxIndex(idx)} />
          </div>
        )}

        {/* Lightbox */}
        {lightboxIndex !== null && post.imageUrls && (
          <ImageLightbox
            images={post.imageUrls}
            startIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}

        {/* ── Comment toggle button ── */}
        <div className="pl-13">
          <button
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={toggleComments}
          >
            <Users className="size-4" />
            <span>{localCommentCount} comments</span>
            {showComments ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
        </div>
      </div>

      {/* ── Comments Section ── */}
      {showComments && (
        <div className="border-t border-border bg-muted/20 px-5 py-4 space-y-4">
          {loadingComments ? (
            <div className="flex justify-center py-4">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Comment list */}
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  ยังไม่มีคอมเมนต์ เป็นคนแรกที่แสดงความคิดเห็น!
                </p>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-3 group">
                      <Avatar name={comment.user.Name} avatarUrl={comment.user.avatarUrl} size="sm" />
                      <div className="flex-1 min-w-0">
                        {/* Bubble */}
                        <div className="bg-blue-200 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm border border-blue-100 inline-block max-w-full">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-foreground leading-tight">
                              {comment.user.Name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString('th-TH')}
                            </span>
                          </div>
                          <div className="text-sm text-foreground mt-0.5 wrap-break-word">
                            <MentionText text={comment.content} />
                          </div>
                        </div>
                        {/* Delete — เจ้าของ comment หรือ OWNER/ADMIN ลบได้ */}
                        {(currentUserId === comment.userId || canModerate) && (
                          <button
                            className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive align-middle"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 className="size-3.5 inline" />
                            <span className="text-xs ml-0.5">ลบ</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Input box ── */}
              <div className="flex items-center gap-2 pt-1 border border-blue-200 rounded-xl bg-white px-4 py-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
                <MentionInput
                  value={newComment}
                  onChange={setNewComment}
                  workspaceId={post.workspaceId}
                  placeholder="เขียนคอมเมนต์... (พิมพ์ @ เพื่อแท็ก)"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground border-none shadow-none rounded-none ring-0 focus-visible:ring-0 focus-visible:border-none px-0 py-0"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                />
                <button
                  disabled={!newComment.trim() || submittingComment}
                  onClick={handleAddComment}
                  className="size-8 rounded-lg bg-primary flex items-center justify-center text-white disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0"
                >
                  {submittingComment ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

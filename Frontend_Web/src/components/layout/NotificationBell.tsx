// ===== Notification Bell =====
// กระดิ่งแจ้งเตือน — แสดง badge นับ unread + dropdown รายการ notification

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Loader2 } from 'lucide-react';
import { apiClient } from '@/services/api';
import { useWorkspaceContext } from '@/contexts';
import { MentionText } from '@/components/feed/MentionText';
import { UserAvatar } from '@/components/ui/UserAvatar';

interface Notification {
  id: string;
  type: 'USER' | 'ROLE';
  targetRole?: string | null;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: { id: string; Name: string; avatarUrl?: string | null } | null;
  post?: { id: string; title: string } | null;
  comment?: { id: string; content: string } | null;
}

export function NotificationBell() {
  const { currentWorkspace } = useWorkspaceContext();
  const wsId = currentWorkspace?.id;
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  /* ── Fetch notifications ── */
  const fetchNotifications = useCallback(async (showLoader = true) => {
    if (!wsId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    if (showLoader) setLoading(true);
    try {
      // API returns: { success, notifications, total, unreadCount }
      const res = await apiClient.get<{
        success: boolean;
        notifications: Notification[];
        total: number;
        unreadCount: number;
      }>(`/workspaces/${wsId}/notifications`);
      const list = res.notifications ?? [];
      setNotifications(list);
      setUnreadCount(res.unreadCount ?? list.filter((n) => !n.isRead).length);
    } catch (err) {
      console.warn('[NotificationBell] Failed to fetch notifications:', err);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [wsId]);

  /* Poll every 30s + initial fetch */
  useEffect(() => {
    void fetchNotifications(false);
    const interval = setInterval(() => {
      void fetchNotifications(false);
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  /* Close panel on outside click */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  /* ── Mark single as read ── */
  const markRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.warn('[NotificationBell] Failed to mark notification as read:', err);
    }
  };

  /* ── Mark all as read ── */
  const markAllRead = async () => {
    if (!wsId) return;
    try {
      await apiClient.patch(`/workspaces/${wsId}/notifications/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('[NotificationBell] Failed to mark all notifications as read:', err);
    }
  };

  /* ── Click notification → navigate to post ── */
  const handleClickNotification = async (n: Notification) => {
    // Mark as read ถ้ายังไม่ได้อ่าน
    if (!n.isRead) await markRead(n.id);

    // ถ้ามี postId → navigate ไป /home?post=<id>
    if (n.post?.id) {
      setOpen(false);
      navigate(`/home?post=${n.post.id}`);
    }
  };

  /* ── Time ago helper ── */
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'เมื่อสักครู่';
    if (mins < 60) return `${mins} นาทีที่แล้ว`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ชม.ที่แล้ว`;
    const days = Math.floor(hrs / 24);
    return `${days} วันที่แล้ว`;
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* ── Bell button ── */}
      <button
        onClick={() => {
          setOpen((prevOpen) => {
            if (!prevOpen) void fetchNotifications();
            return !prevOpen;
          });
        }}
        className="relative p-2 hover:bg-muted rounded-lg transition-colors"
      >
        <Bell className="size-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 flex items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 bg-white border border-border rounded-xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-sm">การแจ้งเตือน</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <CheckCheck className="size-3.5" />
                อ่านทั้งหมด
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                ยังไม่มีการแจ้งเตือน
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleClickNotification(n)}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-b-0 transition-colors cursor-pointer ${
                    n.isRead ? 'bg-white hover:bg-muted/40' : 'bg-primary/5 hover:bg-primary/10'
                  } ${n.post?.id ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {/* Sender avatar */}
                  <UserAvatar
                    displayName={n.sender?.Name ?? 'ระบบ'}
                    avatarUrl={n.sender?.avatarUrl}
                    size="sm"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug">
                      <span className="font-semibold">{n.sender?.Name ?? 'ระบบ'}</span>{' '}
                      แท็กคุณ{n.type === 'ROLE' && n.targetRole ? ` (ในฐานะ ${n.targetRole})` : ''}
                    </p>
                    {n.content && (
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        <MentionText text={n.content} />
                      </div>
                    )}
                    <span className="text-[11px] text-muted-foreground/70 mt-1 block">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>

                  {/* Mark read — stop propagation ไม่ให้ navigate */}
                  {!n.isRead && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                      className="shrink-0 p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                      title="อ่านแล้ว"
                    >
                      <Check className="size-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

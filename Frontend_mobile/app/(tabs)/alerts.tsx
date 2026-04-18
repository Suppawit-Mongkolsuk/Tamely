import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BellOff, Check, MessageCircle, FileText, AtSign } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/ui/Header';

/* ======================= TYPES ======================= */

interface Sender {
  id: string;
  Name: string;
  avatarUrl: string | null;
}

interface Post {
  id: string;
  title: string;
  body: string;
}

interface Comment {
  id: string;
  content: string;
}

interface Notification {
  id: string;
  type: 'USER' | 'ROLE';
  targetRole?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: Sender;
  post?: Post | null;
  comment?: Comment | null;
}

interface NotificationsResponse {
  success: boolean;
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

/* ======================= CONFIG ======================= */

import { API_BASE } from '@/lib/config';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner', ADMIN: 'Admin', MODERATOR: 'Moderator', MEMBER: 'Member',
};

/* ======================= HELPERS ======================= */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'เมื่อกี้';
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} วันที่แล้ว`;
  return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

/* ======================= AVATAR ======================= */

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const colors = ['#425C95', '#7C3AED', '#059669', '#DC2626', '#D97706'];
  const colorIndex = name.charCodeAt(0) % colors.length;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors[colorIndex], alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontSize: size * 0.35, fontWeight: '700' }}>{getInitials(name)}</Text>
    </View>
  );
}

/* ======================= NOTIFICATION CARD ======================= */

function NotificationCard({ notification, onPress }: { notification: Notification; onPress: () => void }) {
  const isRole = notification.type === 'ROLE';
  const hasPost = !!notification.post;
  const hasComment = !!notification.comment;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ flexDirection: 'row', gap: 12, padding: 16, backgroundColor: notification.isRead ? '#fff' : '#f0f4ff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
      <View style={{ position: 'relative' }}>
        <Avatar name={notification.sender.Name} size={44} />
        <View style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: isRole ? '#7C3AED' : '#425C95', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' }}>
          <AtSign size={11} color="#fff" />
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, color: '#111827', lineHeight: 20, marginBottom: 4 }}>
          <Text style={{ fontWeight: '700' }}>{notification.sender.Name}</Text>
          <Text style={{ color: '#374151' }}>{' '}{notification.content.replace(notification.sender.Name, '').trim()}</Text>
        </Text>

        {hasPost && notification.post && (
          <View style={{ backgroundColor: '#f9fafb', borderRadius: 8, padding: 8, marginBottom: 6, borderLeftWidth: 3, borderLeftColor: '#425C95' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <FileText size={11} color="#9ca3af" />
              <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '600' }}>โพสต์</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#374151', fontWeight: '600' }} numberOfLines={1}>{notification.post.title}</Text>
            {hasComment && notification.comment && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, marginBottom: 2 }}>
                  <MessageCircle size={11} color="#9ca3af" />
                  <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '600' }}>comment</Text>
                </View>
                <Text style={{ fontSize: 12, color: '#6b7280' }} numberOfLines={2}>{notification.comment.content}</Text>
              </>
            )}
          </View>
        )}

        {isRole && notification.targetRole && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <View style={{ backgroundColor: '#ede9fe', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }}>
              <Text style={{ fontSize: 11, color: '#7c3aed', fontWeight: '700' }}>@{notification.targetRole}</Text>
            </View>
          </View>
        )}

        <Text style={{ fontSize: 12, color: '#9ca3af' }}>{timeAgo(notification.createdAt)}</Text>
      </View>

      {!notification.isRead && (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#425C95', marginTop: 6 }} />
      )}
    </TouchableOpacity>
  );
}

/* ======================= SKELETON ======================= */

function SkeletonCard() {
  return (
    <View style={{ flexDirection: 'row', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#f3f4f6' }} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={{ height: 13, width: '80%', backgroundColor: '#f3f4f6', borderRadius: 6 }} />
        <View style={{ height: 11, width: '60%', backgroundColor: '#f9fafb', borderRadius: 6 }} />
        <View style={{ height: 11, width: '30%', backgroundColor: '#f9fafb', borderRadius: 6 }} />
      </View>
    </View>
  );
}

/* ======================= ALERTS SCREEN ======================= */

type FilterType = 'all' | 'unread' | 'mentions';

export default function AlertsScreen() {
  const [token, setToken] = useState('');
  const [wsId, setWsId] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [role, setRole] = useState('');
  const [storageLoaded, setStorageLoaded] = useState(false);

  useEffect(() => {
    const loadFromStorage = async () => {
      const t = await AsyncStorage.getItem('token') ?? '';
      const w = await AsyncStorage.getItem('wsId') ?? '';
      const u = await AsyncStorage.getItem('user') ?? '';
      const r = await AsyncStorage.getItem('role') ?? '';
      setToken(t);
      setWsId(w);
      setUserData(u ? JSON.parse(u) : null);
      setRole(r);
      setStorageLoaded(true);
      console.log('userData from storage:', u);
    };
    loadFromStorage();
  }, []);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [markingAll, setMarkingAll] = useState(false);

  /* ===== LOAD ===== */
  const loadNotifications = useCallback(async (isRefresh = false) => {
    if (!token || !wsId) { setLoading(false); return; }
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const unreadOnly = filter === 'unread';
      const res = await fetch(
        `${API_BASE}/api/workspaces/${wsId}/notifications?limit=50&offset=0${unreadOnly ? '&unreadOnly=true' : ''}`,
        { headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' } },
      );
      if (!res.ok) throw new Error();
      const json: NotificationsResponse = await res.json();
      setNotifications(json.notifications ?? []);
      setUnreadCount(json.unreadCount ?? 0);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, wsId, filter]);

  // โหลด notification เมื่อ storage โหลดเสร็จ
  useEffect(() => {
    if (storageLoaded) loadNotifications();
  }, [storageLoaded, loadNotifications]);

  /* ===== MARK READ ===== */
  const handleMarkRead = async (notification: Notification) => {
    if (notification.isRead) return;
    try {
      await fetch(`${API_BASE}/api/notifications/${notification.id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
      });
      setNotifications((prev) => prev.map((n) => n.id === notification.id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  /* ===== MARK ALL READ ===== */
  const handleMarkAllRead = async () => {
    if (!wsId || !token || unreadCount === 0) return;
    try {
      setMarkingAll(true);
      await fetch(`${API_BASE}/api/workspaces/${wsId}/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      Alert.alert('เกิดข้อผิดพลาด', 'ทำเครื่องหมายว่าอ่านแล้วไม่สำเร็จ');
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['top']}>

      <Header
        subtitle="การแจ้งเตือนของคุณ"
        userName={userData?.displayName ?? 'Your Name'}
        userEmail={userData?.email ?? ''}
        userInitials={(userData?.displayName ?? 'YO').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
        userRole={ROLE_LABELS[role] ?? 'Member'}
        workspaceId={wsId}
        role={role}
        token={token}
        currentUserId={userData?.id ?? ''}
      />

      {/* Filter + Mark all */}
      <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['all', 'unread', 'mentions'] as FilterType[]).map((f) => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, backgroundColor: filter === f ? '#425C95' : '#f3f4f6' }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: filter === f ? '#fff' : '#6b7280' }}>
                {f === 'all' ? 'ทั้งหมด' : f === 'unread' ? `ยังไม่อ่าน${unreadCount > 0 ? ` (${unreadCount})` : ''}` : 'Mentions'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} disabled={markingAll} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {markingAll ? <ActivityIndicator size="small" color="#425C95" /> : <Check size={14} color="#425C95" />}
            <Text style={{ fontSize: 12, color: '#425C95', fontWeight: '600' }}>อ่านทั้งหมด</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {loading ? (
        <View><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></View>
      ) : notifications.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
            <BellOff size={28} color="#9ca3af" />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#374151' }}>
            {filter === 'unread' ? 'อ่านหมดแล้ว' : 'ยังไม่มีการแจ้งเตือน'}
          </Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingHorizontal: 32 }}>
            {filter === 'unread' ? 'ไม่มีการแจ้งเตือนที่ยังไม่ได้อ่าน' : 'เมื่อมีคน @ คุณในโพสต์หรือ comment จะแสดงที่นี่'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadNotifications(true)} tintColor="#425C95" colors={['#425C95']} />}
          renderItem={({ item }) => <NotificationCard notification={item} onPress={() => handleMarkRead(item)} />}
          ListFooterComponent={<Text style={{ textAlign: 'center', fontSize: 12, color: '#d1d5db', padding: 20 }}>{notifications.length} รายการ</Text>}
        />
      )}
    </SafeAreaView>
  );
}
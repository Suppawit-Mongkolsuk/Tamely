import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  RefreshControl, TextInput, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Hash, Lock, Plus, X, Search } from 'lucide-react-native';
import Header from '../../components/ui/Header';

/* ======================= TYPES ======================= */

interface Room {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  memberCount: number;
  createdAt: string;
}

interface DmUser {
  id: string;
  Name: string;
  avatarUrl: string | null;
}

interface WorkspaceMember {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
}

interface DmConversation {
  id: string;
  userA: DmUser;
  userB: DmUser;
  unreadCount: number;
  lastMessage?: { content: string; createdAt: string; sender: DmUser } | null;
}

type ChatItem =
  | { kind: 'section'; title: string }
  | { kind: 'room'; data: Room }
  | { kind: 'dm'; data: DmConversation }
  | { kind: 'member'; data: WorkspaceMember };

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
  if (mins < 60) return `${mins} นาที`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชม.`;
  return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

function getInitials(name: string): string {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0] ?? '').join('').toUpperCase().slice(0, 2) || '?';
}

/* ======================= AVATAR ======================= */

function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const colors = ['#425C95', '#7C3AED', '#059669', '#DC2626', '#D97706'];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors[colorIndex], alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontSize: size * 0.35, fontWeight: '700' }}>{getInitials(name)}</Text>
    </View>
  );
}

/* ======================= CHATS SCREEN ======================= */

export default function ChatsScreen() {
  const router = useRouter();

  const [token, setToken] = useState('');
  const [wsId, setWsId] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [role, setRole] = useState('');
  const [storageLoaded, setStorageLoaded] = useState(false);

  const [search, setSearch] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [dms, setDms] = useState<DmConversation[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create room modal
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomDesc, setRoomDesc] = useState('');
  const [roomPrivate, setRoomPrivate] = useState(false);
  const [creating, setCreating] = useState(false);

  /* ===== Load from AsyncStorage ===== */
  useEffect(() => {
    const load = async () => {
      const t = await AsyncStorage.getItem('token') ?? '';
      const w = await AsyncStorage.getItem('wsId') ?? '';
      const u = await AsyncStorage.getItem('user') ?? '';
      const r = await AsyncStorage.getItem('role') ?? '';
      setToken(t); setWsId(w);
      setUserData(u ? (() => { try { return JSON.parse(u); } catch { return null; } })() : null);
      setRole(r);
      setStorageLoaded(true);
    };
    load();
  }, []);

  /* ===== Load all ===== */
  const loadAll = useCallback(async (isRefresh = false) => {
    if (!token || !wsId) { setLoading(false); return; }
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [roomRes, dmRes, memberRes] = await Promise.all([
        fetch(`${API_BASE}/api/workspaces/${wsId}/rooms`, {
          headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
        }),
        fetch(`${API_BASE}/api/workspaces/${wsId}/dm`, {
          headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
        }),
        fetch(`${API_BASE}/api/workspaces/${wsId}/members`, {
          headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
        }),
      ]);

      if (roomRes.ok) { const j = await roomRes.json(); setRooms(j.data ?? []); }
      if (dmRes.ok) { const j = await dmRes.json(); setDms(j.data ?? []); }
      if (memberRes.ok) { const j = await memberRes.json(); setMembers(j.data ?? []); }
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [token, wsId]);

  useEffect(() => {
    if (storageLoaded) loadAll();
  }, [storageLoaded, loadAll]);

  /* ===== Create room ===== */
  const handleCreateRoom = async () => {
    if (!roomName.trim()) { Alert.alert('กรุณากรอกชื่อห้อง'); return; }
    try {
      setCreating(true);
      const res = await fetch(`${API_BASE}/api/workspaces/${wsId}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ name: roomName.trim(), description: roomDesc.trim(), isPrivate: roomPrivate }),
      });
      if (!res.ok) { const j = await res.json(); Alert.alert('เกิดข้อผิดพลาด', j.message ?? 'สร้างห้องไม่สำเร็จ'); return; }
      setShowCreateRoom(false); setRoomName(''); setRoomDesc(''); setRoomPrivate(false);
      loadAll();
    } catch { Alert.alert('Network Error', 'ไม่สามารถเชื่อมต่อ server'); }
    finally { setCreating(false); }
  };

  /* ===== Navigate ===== */
  const goToRoom = (room: Room) => {
    router.push({ pathname: '/(screensDetail)/chat-room', params: { roomId: room.id, roomName: room.name, token, wsId, currentUserId: userData?.id ?? '' } });
  };

  const goToDm = (dm: DmConversation) => {
    const other = dm.userA.id === userData?.id ? dm.userB : dm.userA;
    router.push({ pathname: '/(screensDetail)/chat-dm', params: {
      conversationId: dm.id,
      otherName: other.Name,
      otherUserId: other.id,
      token,
      wsId,
    }});
  };

  const goToDmWithMember = async (member: WorkspaceMember) => {
    try {
      const res = await fetch(`${API_BASE}/api/workspaces/${wsId}/dm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ targetUserId: member.userId }),
      });
      const j = await res.json();
      const conv = j.data;
      if (conv?.id) {
        router.push({ pathname: '/(screensDetail)/chat-dm', params: {
          conversationId: conv.id,
          otherName: member.displayName,
          otherUserId: member.userId,
          token,
          wsId,
        }});
      }
    } catch {}
  };

  /* ===== Build combined list ===== */
  const filteredRooms = rooms.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
  const filteredDms = dms.filter((d) => {
    const other = d.userA.id === userData?.id ? d.userB : d.userA;
    return other.Name.toLowerCase().includes(search.toLowerCase());
  });
  const filteredMembers = members.filter((m) =>
    m.userId !== userData?.id &&
    (m.displayName.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()))
  );

  const listData: ChatItem[] = [
    ...(filteredRooms.length > 0 ? [{ kind: 'section' as const, title: 'ห้องแชท' }] : []),
    ...filteredRooms.map((r) => ({ kind: 'room' as const, data: r })),
    ...(filteredDms.length > 0 ? [{ kind: 'section' as const, title: 'ข้อความส่วนตัว' }] : []),
    ...filteredDms.map((d) => ({ kind: 'dm' as const, data: d })),
    ...(filteredMembers.length > 0 ? [{ kind: 'section' as const, title: 'สมาชิกใน workspace' }] : []),
    ...filteredMembers.map((m) => ({ kind: 'member' as const, data: m })),
  ];

  /* ===== Render item ===== */
  const renderItem = ({ item }: { item: ChatItem }) => {
    if (item.kind === 'section') {
      return (
        <View style={{ paddingHorizontal: 16, paddingVertical: 8, paddingTop: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#9ca3af', letterSpacing: 0.5, textTransform: 'uppercase' }}>{item.title}</Text>
        </View>
      );
    }

    if (item.kind === 'room') {
      const room = item.data;
      return (
        <TouchableOpacity onPress={() => goToRoom(room)} activeOpacity={0.8} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f9fafb', gap: 12 }}>
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: room.isPrivate ? '#fef3c7' : '#eff6ff', alignItems: 'center', justifyContent: 'center' }}>
            {room.isPrivate ? <Lock size={22} color="#d97706" /> : <Hash size={22} color="#425C95" />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>
              {room.isPrivate ? '' : '#'}{room.name}
            </Text>
            <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }} numberOfLines={1}>
              {room.description || `${room.memberCount} สมาชิก`}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (item.kind === 'dm') {
      const dm = item.data;
      const other = dm.userA.id === userData?.id ? dm.userB : dm.userA;
      return (
        <TouchableOpacity onPress={() => goToDm(dm)} activeOpacity={0.8} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f9fafb', gap: 12 }}>
          <View style={{ position: 'relative' }}>
            <Avatar name={other.Name} size={48} />
            {dm.unreadCount > 0 && (
              <View style={{ position: 'absolute', top: -4, right: -4, backgroundColor: '#ef4444', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#f9fafb' }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{dm.unreadCount}</Text>
              </View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>{other.Name}</Text>
              {dm.lastMessage && <Text style={{ fontSize: 11, color: '#9ca3af' }}>{timeAgo(dm.lastMessage.createdAt)}</Text>}
            </View>
            <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }} numberOfLines={1}>
              {dm.lastMessage
                ? `${dm.lastMessage.sender.id === userData?.id ? 'คุณ: ' : ''}${dm.lastMessage.content}`
                : 'เริ่มบทสนทนา'}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (item.kind === 'member') {
      const m = item.data;
      return (
        <TouchableOpacity onPress={() => goToDmWithMember(m)} activeOpacity={0.8} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f9fafb', gap: 12 }}>
          <Avatar name={m.displayName || m.email} size={48} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>{m.displayName || m.email.split('@')[0]}</Text>
            <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{m.email} · {m.role}</Text>
          </View>
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['top']}>

      <Header
        subtitle="ห้องแชทและข้อความส่วนตัว"
        userName={userData?.displayName ?? 'Your Name'}
        userEmail={userData?.email ?? ''}
        userInitials={(userData?.displayName ?? 'YO').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
        userRole={ROLE_LABELS[role] ?? 'Member'}
        workspaceId={wsId}
        role={role}
        token={token}
        currentUserId={userData?.id ?? ''}
      />

      {/* Search bar */}
      <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, gap: 8, borderWidth: 1, borderColor: '#f3f4f6' }}>
          <Search size={15} color="#9ca3af" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="ค้นหาห้องแชทหรือบทสนทนา..."
            placeholderTextColor="#d1d5db"
            style={{ flex: 1, fontSize: 14, color: '#111827' }}
          />
        </View>
      </View>

      {/* Combined list */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#425C95" />
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item, index) => `${item.kind}-${index}`}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadAll(true)} tintColor="#425C95" colors={['#425C95']} />}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
              <Hash size={40} color="#d1d5db" />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151', marginTop: 12 }}>ยังไม่มีแชท</Text>
              <Text style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>กด + เพื่อสร้างห้องแชทใหม่</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setShowCreateRoom(true)}
        style={{ position: 'absolute', bottom: 24, right: 20, backgroundColor: '#425C95', width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: '#425C95', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 }}
        activeOpacity={0.85}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      {/* Create Room Modal */}
      <Modal visible={showCreateRoom} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreateRoom(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <TouchableOpacity onPress={() => setShowCreateRoom(false)}><X size={22} color="#6b7280" /></TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>สร้างห้องแชท</Text>
            <TouchableOpacity onPress={handleCreateRoom} disabled={creating || !roomName.trim()} style={{ backgroundColor: roomName.trim() ? '#425C95' : '#e5e7eb', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}>
              {creating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>สร้าง</Text>}
            </TouchableOpacity>
          </View>

          <View style={{ padding: 16, gap: 16 }}>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>ชื่อห้อง <Text style={{ color: '#ef4444' }}>*</Text></Text>
              <TextInput value={roomName} onChangeText={setRoomName} placeholder="เช่น general, engineering..." placeholderTextColor="#d1d5db" style={{ backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', borderWidth: 1, borderColor: '#f3f4f6' }} />
            </View>

            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>คำอธิบาย (ไม่บังคับ)</Text>
              <TextInput value={roomDesc} onChangeText={setRoomDesc} placeholder="อธิบายวัตถุประสงค์ของห้อง..." placeholderTextColor="#d1d5db" style={{ backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#f3f4f6' }} />
            </View>

            <TouchableOpacity onPress={() => setRoomPrivate((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f3f4f6' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Lock size={18} color={roomPrivate ? '#d97706' : '#9ca3af'} />
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>ห้องส่วนตัว</Text>
                  <Text style={{ fontSize: 12, color: '#9ca3af' }}>ต้องได้รับเชิญเท่านั้น</Text>
                </View>
              </View>
              <View style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: roomPrivate ? '#425C95' : '#e5e7eb', justifyContent: 'center', paddingHorizontal: 3 }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignSelf: roomPrivate ? 'flex-end' : 'flex-start' }} />
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}
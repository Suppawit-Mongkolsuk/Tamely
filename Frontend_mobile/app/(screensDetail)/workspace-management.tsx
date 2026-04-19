import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
  Alert, TextInput, Modal, Image, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft, Users, Hash, Settings, ChevronRight,
  Crown, ChevronDown, RefreshCw, Copy, X, Trash2,
  Edit3, UserPlus, Shield, Plus, Check,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

/* ======================= CONFIG ======================= */

import { API_BASE } from '@/lib/config';

/* ======================= TYPES ======================= */

interface WorkspaceMember {
  userId: string;
  role: string;
  joinedAt?: string;
  user: { id: string; Name: string; email: string; avatarUrl: string | null };
}

interface Room {
  id: string;
  name: string;
  type: 'public' | 'private';
  memberCount?: number;
  description?: string;
  createdAt?: string;
}

interface RoomMember {
  userId: string;
  user: { id: string; Name: string; email: string; avatarUrl: string | null };
}

interface CustomRole {
  id: string;
  name: string;
  color?: string;
  permissions?: string[];
}

interface WorkspaceInfo {
  id: string;
  name: string;
  description?: string;
  inviteCode?: string;
  iconUrl?: string | null;
}

/* ======================= CONSTANTS ======================= */

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner', ADMIN: 'Admin', MODERATOR: 'Moderator', MEMBER: 'Member',
};

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  OWNER:     { bg: '#fef3c7', text: '#d97706' },
  ADMIN:     { bg: '#dbeafe', text: '#1d4ed8' },
  MODERATOR: { bg: '#ede9fe', text: '#7c3aed' },
  MEMBER:    { bg: '#f3f4f6', text: '#374151' },
};

// อัปเดตรายการสิทธิ์ให้ตรงกับ Backend Zod Validation 100%
const AVAILABLE_PERMISSIONS = [
  { key: 'MANAGE_WORKSPACE', label: 'จัดการ workspace' },
  { key: 'MANAGE_ROLES', label: 'จัดการยศและสิทธิ์' },
  { key: 'MANAGE_MEMBERS', label: 'จัดการสมาชิก' },
  { key: 'REGENERATE_INVITE', label: 'สร้าง invite code ใหม่' },
  { key: 'MANAGE_CHANNELS', label: 'จัดการห้องแชท' },
  { key: 'VIEW_PRIVATE_CHANNELS', label: 'เข้าถึงห้องแชทส่วนตัว' },
  { key: 'SEND_MESSAGES', label: 'ส่งข้อความ' },
  { key: 'DELETE_OWN_MESSAGES', label: 'ลบข้อความของตนเอง' },
  { key: 'DELETE_ANY_MESSAGE', label: 'ลบข้อความของผู้อื่น' },
  { key: 'CREATE_POST', label: 'สร้างโพสต์' },
  { key: 'DELETE_ANY_POST', label: 'ลบโพสต์ของผู้อื่น' },
  { key: 'PIN_POST', label: 'ปักหมุดโพสต์' },
  { key: 'DELETE_ANY_COMMENT', label: 'ลบคอมเมนต์ของผู้อื่น' },
  { key: 'CREATE_TASK', label: 'สร้างงาน (Task)' },
  { key: 'ASSIGN_TASK', label: 'มอบหมายงาน' },
  { key: 'DELETE_ANY_TASK', label: 'ลบงานของผู้อื่น' },
  { key: 'USE_AI', label: 'ใช้งาน AI' },
  { key: 'MENTION_ROLE', label: 'กล่าวถึงยศ (Mention)' },
];

const ROLE_COLORS_LIST = ['#425C95', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2'];

/* ======================= HELPERS ======================= */

function getInitials(name: string): string {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function RoleBadge({ role }: { role: string }) {
  const c = ROLE_COLORS[role] ?? ROLE_COLORS.MEMBER;
  return (
    <View style={{ backgroundColor: c.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: c.text }}>{ROLE_LABELS[role] ?? role}</Text>
    </View>
  );
}

function Avatar({ name, size = 36, uri }: { name: string; size?: number; uri?: string | null }) {
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  const colors = ['#425C95', '#7C3AED', '#059669', '#DC2626', '#D97706'];
  const bg = name ? (colors[name.charCodeAt(0) % colors.length] ?? '#425C95') : '#425C95';
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.35 }}>{getInitials(name)}</Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={{ fontSize: 11, fontWeight: '700', color: '#9ca3af', marginHorizontal: 20, marginTop: 24, marginBottom: 8, letterSpacing: 0.8 }}>
      {title}
    </Text>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[{ marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6', overflow: 'hidden' }, style]}>
      {children}
    </View>
  );
}

/* ======================= TAB TYPE ======================= */

type Tab = 'members' | 'rooms' | 'settings';

/* ======================= MAIN SCREEN ======================= */

export default function WorkspaceManagementScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ wsId: string; token: string; role: string; wsName: string }>();

  const wsId = params.wsId ?? '';
  const [token, setToken] = useState(params.token ?? '');
  const role = params.role ?? '';
  const isOwner = role === 'OWNER';
  const isAdminOrOwner = role === 'OWNER' || role === 'ADMIN';

  useEffect(() => {
    if (role && !isAdminOrOwner) {
      Alert.alert('ไม่มีสิทธิ์', 'หน้านี้สำหรับ Owner และ Admin เท่านั้น', [
        { text: 'ตกลง', onPress: () => router.back() },
      ]);
    }
  }, [role]);

  useEffect(() => {
    if (!token) AsyncStorage.getItem('token').then((t) => { if (t) setToken(t); });
  }, []);

  const [activeTab, setActiveTab] = useState<Tab>('members');

  /* ======================= MEMBERS STATE ======================= */
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(null);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [memberCustomRoles, setMemberCustomRoles] = useState<CustomRole[]>([]);

  /* ======================= ROOMS STATE ======================= */
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [roomName, setRoomName] = useState('');
  const [roomDesc, setRoomDesc] = useState('');
  const [savingRoom, setSavingRoom] = useState(false);
  const [showRoomMembersModal, setShowRoomMembersModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);
  const [loadingRoomMembers, setLoadingRoomMembers] = useState(false);

  /* ======================= SETTINGS STATE ======================= */
  const [wsInfo, setWsInfo] = useState<WorkspaceInfo | null>(null);
  const [loadingWs, setLoadingWs] = useState(false);
  const [wsName, setWsName] = useState('');
  const [wsDesc, setWsDesc] = useState('');
  const [savingWs, setSavingWs] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#425C95');
  const [creatingRole, setCreatingRole] = useState(false);

  const [showEditRole, setShowEditRole] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editRoleName, setEditRoleName] = useState('');
  const [editRoleColor, setEditRoleColor] = useState('#425C95');
  const [editRolePermissions, setEditRolePermissions] = useState<string[]>([]);
  const [updatingCustomRole, setUpdatingCustomRole] = useState(false);

  /* ======================= LOAD USER ======================= */
  useEffect(() => {
    AsyncStorage.getItem('user').then((u) => {
      if (u) {
        try {
          const parsed = JSON.parse(u);
          setCurrentUserId(parsed.id ?? '');
        } catch {}
      }
    });
  }, []);

  /* ======================= FETCH ======================= */

  const fetchMembers = useCallback(async () => {
    if (!wsId || !token) return;
    setLoadingMembers(true);
    try {
      const res = await fetch(`${API_BASE}/api/workspaces/${wsId}/members`, {
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
      });
      const json = await res.json();
      if (res.ok) setMembers(json.data ?? []);
    } catch {
      Alert.alert('Error', 'โหลดสมาชิกไม่สำเร็จ');
    } finally {
      setLoadingMembers(false);
    }
  }, [wsId, token]);

  const fetchRooms = useCallback(async () => {
    if (!wsId || !token) return;
    setLoadingRooms(true);
    try {
      const res = await fetch(`${API_BASE}/api/workspaces/${wsId}/management/rooms`, {
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
      });
      const json = await res.json();
      if (res.ok) setRooms(json.data ?? []);
    } catch {
      Alert.alert('Error', 'โหลดห้องไม่สำเร็จ');
    } finally {
      setLoadingRooms(false);
    }
  }, [wsId, token]);

  const fetchWsInfo = useCallback(async () => {
    if (!wsId || !token) return;
    setLoadingWs(true);
    try {
      const res = await fetch(`${API_BASE}/api/workspaces/${wsId}`, {
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
      });
      const json = await res.json();
      if (res.ok) {
        const data = json.data;
        setWsInfo(data);
        setWsName(data.name ?? '');
        setWsDesc(data.description ?? '');
      }
    } catch {
      Alert.alert('Error', 'โหลดข้อมูล Workspace ไม่สำเร็จ');
    } finally {
      setLoadingWs(false);
    }
  }, [wsId, token]);

  const fetchCustomRoles = useCallback(async () => {
    if (!wsId || !token) return;
    setLoadingRoles(true);
    try {
      const res = await fetch(`${API_BASE}/api/workspaces/${wsId}/roles`, {
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
      });
      const json = await res.json();
      if (res.ok) setCustomRoles(json.data ?? []);
    } catch {
    } finally {
      setLoadingRoles(false);
    }
  }, [wsId, token]);

  useEffect(() => {
    if (!token || !wsId) return;
    if (activeTab === 'members') fetchMembers();
    else if (activeTab === 'rooms') fetchRooms();
    else if (activeTab === 'settings') { fetchWsInfo(); fetchCustomRoles(); }
  }, [activeTab, token, wsId]);

  /* ======================= MEMBERS ACTIONS ======================= */

  const assignableRoles = isOwner
    ? ['ADMIN', 'MODERATOR', 'MEMBER']
    : ['MODERATOR', 'MEMBER'];

  const handleOpenRolePicker = async (member: WorkspaceMember) => {
    if (member.role === 'OWNER') return;
    if (!isOwner && member.role === 'ADMIN') {
      Alert.alert('ไม่มีสิทธิ์', 'Admin ไม่สามารถเปลี่ยน role ของ Admin ด้วยกันได้');
      return;
    }
    setSelectedMember(member);
    setMemberCustomRoles([]);
    setShowRolePicker(true);

    try {
      const res = await fetch(`${API_BASE}/api/workspaces/${wsId}/members/${member.userId}/roles`, {
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
      });
      const json = await res.json();
      if (res.ok) {
        setMemberCustomRoles(json.data ?? []);
      }
    } catch {}
  };

  const handleUpdateRole = async (newRole: string) => {
    if (!selectedMember) return;
    setUpdatingRole(true);
    try {
      const res = await fetch(`${API_BASE}/api/workspaces/${wsId}/members/${selectedMember.userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
         const errorData = await res.json().catch(() => ({}));
         throw new Error(errorData.message || errorData.error || `HTTP Error: ${res.status}`);
      }
      setShowRolePicker(false);
      setSelectedMember(null);
      fetchMembers();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'เปลี่ยน role ไม่สำเร็จ');
    } finally {
      setUpdatingRole(false);
    }
  };

  const toggleCustomRole = async (customRole: CustomRole) => {
    if (!selectedMember) return;
    const hasRole = memberCustomRoles.some((r) => r.id === customRole.id);
    setUpdatingRole(true);
    try {
      if (hasRole) {
        const res = await fetch(`${API_BASE}/api/workspaces/${wsId}/members/${selectedMember.userId}/roles/${customRole.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
        });
        if (!res.ok) {
           const errorData = await res.json().catch(() => ({}));
           throw new Error(errorData.message || errorData.error || `HTTP Error: ${res.status}`);
        }
        setMemberCustomRoles((prev) => prev.filter((r) => r.id !== customRole.id));
      } else {
        const res = await fetch(`${API_BASE}/api/workspaces/${wsId}/members/${selectedMember.userId}/roles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({ roleId: customRole.id }),
        });
        if (!res.ok) {
           const errorData = await res.json().catch(() => ({}));
           throw new Error(errorData.message || errorData.error || `HTTP Error: ${res.status}`);
        }
        setMemberCustomRoles((prev) => [...prev, customRole]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'อัปเดต Custom Role ไม่สำเร็จ');
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleKickMember = (member: WorkspaceMember) => {
    Alert.alert(
      'นำสมาชิกออก',
      `ต้องการนำ ${member.user.Name} ออกจาก workspace?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'นำออก', style: 'destructive', onPress: async () => {
            try {
              const res = await fetch(`${API_BASE}/api/workspaces/${wsId}/members/${member.userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
              });
              if (!res.ok) throw new Error();
              fetchMembers();
            } catch {
              Alert.alert('Error', 'นำสมาชิกออกไม่สำเร็จ');
            }
          },
        },
      ]
    );
  };

  /* ======================= ROOMS ACTIONS ======================= */

  const openCreateRoom = () => {
    setEditRoom(null);
    setRoomName('');
    setRoomDesc('');
    setShowRoomModal(true);
  };

  const openEditRoom = (room: Room) => {
    setEditRoom(room);
    setRoomName(room.name);
    setRoomDesc(room.description ?? '');
    setShowRoomModal(true);
  };

  const handleSaveRoom = async () => {
    if (!roomName.trim()) { Alert.alert('กรุณากรอกชื่อห้อง'); return; }
    setSavingRoom(true);
    try {
      let res: Response;
      if (editRoom) {
        res = await fetch(`${API_BASE}/api/rooms/${editRoom.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({ name: roomName.trim(), description: roomDesc.trim() }),
        });
      } else {
        res = await fetch(`${API_BASE}/api/workspaces/${wsId}/rooms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({ name: roomName.trim(), description: roomDesc.trim(), type: 'public' }),
        });
      }
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'ไม่สำเร็จ');
      }
      setShowRoomModal(false);
      fetchRooms();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'บันทึกไม่สำเร็จ');
    } finally {
      setSavingRoom(false);
    }
  };

  const handleDeleteRoom = (room: Room) => {
    Alert.alert('ลบห้อง', `ต้องการลบห้อง #${room.name}? ข้อมูลทั้งหมดจะหายไป`, [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ', style: 'destructive', onPress: async () => {
          try {
            const res = await fetch(`${API_BASE}/api/rooms/${room.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
            });
            if (!res.ok) throw new Error();
            fetchRooms();
          } catch {
            Alert.alert('Error', 'ลบห้องไม่สำเร็จ');
          }
        },
      },
    ]);
  };

  const openRoomMembers = async (room: Room) => {
    setSelectedRoom(room);
    setShowRoomMembersModal(true);
    setLoadingRoomMembers(true);
    try {
      const res = await fetch(`${API_BASE}/api/workspaces/${wsId}/members`, {
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
      });
      const json = await res.json();
      if (res.ok) {
        setRoomMembers(
          (json.data ?? []).map((m: WorkspaceMember) => ({
            userId: m.userId,
            user: m.user,
          }))
        );
      }
    } catch {
      Alert.alert('Error', 'โหลดสมาชิกไม่สำเร็จ');
    } finally {
      setLoadingRoomMembers(false);
    }
  };

  const handleAddToRoom = async (userId: string) => {
    if (!selectedRoom) return;
    try {
      const res = await fetch(`${API_BASE}/api/rooms/${selectedRoom.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error();
      Alert.alert('สำเร็จ', 'เพิ่มสมาชิกเข้าห้องแล้ว');
    } catch {
      Alert.alert('Error', 'เพิ่มสมาชิกไม่สำเร็จ (อาจมีอยู่แล้ว)');
    }
  };

  const handleRemoveFromRoom = async (userId: string) => {
    if (!selectedRoom) return;
    Alert.alert('นำออกจากห้อง', 'ต้องการนำสมาชิกออกจากห้องนี้?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'นำออก', style: 'destructive', onPress: async () => {
          try {
            const res = await fetch(`${API_BASE}/api/rooms/${selectedRoom.id}/members/${userId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
            });
            if (!res.ok) throw new Error();
          } catch {
            Alert.alert('Error', 'นำออกไม่สำเร็จ');
          }
        },
      },
    ]);
  };

  /* ======================= SETTINGS ACTIONS ======================= */

  const handleSaveWs = async () => {
    if (!wsName.trim()) { Alert.alert('กรุณากรอกชื่อ Workspace'); return; }
    setSavingWs(true);
    try {
      const res = await fetch(`${API_BASE}/api/workspaces/${wsId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ name: wsName.trim(), description: wsDesc.trim() }),
      });
      if (!res.ok) throw new Error();
      Alert.alert('สำเร็จ', 'บันทึกข้อมูล Workspace แล้ว');
      fetchWsInfo();
    } catch {
      Alert.alert('Error', 'บันทึกไม่สำเร็จ');
    } finally {
      setSavingWs(false);
    }
  };

  const handleRegenerate = () => {
    Alert.alert('สร้าง Code ใหม่?', 'Code เดิมจะใช้งานไม่ได้อีก', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'สร้างใหม่', style: 'destructive', onPress: async () => {
          setRegenerating(true);
          try {
            const res = await fetch(`${API_BASE}/api/workspaces/${wsId}/regenerate-invite`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
            });
            const json = await res.json();
            if (!res.ok) throw new Error();
            setWsInfo((prev) => prev ? { ...prev, inviteCode: json.data?.inviteCode } : prev);
          } catch {
            Alert.alert('Error', 'สร้าง code ใหม่ไม่สำเร็จ');
          } finally {
            setRegenerating(false);
          }
        },
      },
    ]);
  };

  const handleCopyCode = async () => {
    if (!wsInfo?.inviteCode) return;
    await Clipboard.setStringAsync(wsInfo.inviteCode);
    Alert.alert('คัดลอกแล้ว', 'Invite code ถูกคัดลอกไปยัง clipboard');
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) { Alert.alert('กรุณากรอกชื่อ Role'); return; }
    setCreatingRole(true);
    try {
      const res = await fetch(`${API_BASE}/api/workspaces/${wsId}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ name: newRoleName.trim(), color: newRoleColor }),
      });
      if (!res.ok) {
         const errorData = await res.json().catch(() => ({}));
         throw new Error(errorData.message || errorData.error || `HTTP Error: ${res.status}`);
      }
      setShowCreateRole(false);
      setNewRoleName('');
      setNewRoleColor('#425C95');
      fetchCustomRoles();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'สร้าง Role ไม่สำเร็จ');
    } finally {
      setCreatingRole(false);
    }
  };

  const openEditRole = (roleItem: CustomRole) => {
    setEditingRoleId(roleItem.id);
    setEditRoleName(roleItem.name);
    setEditRoleColor(roleItem.color ?? '#425C95');
    setEditRolePermissions(roleItem.permissions ?? []);
    setShowEditRole(true);
  };

  const togglePermission = (permKey: string) => {
    setEditRolePermissions((prev) =>
      prev.includes(permKey) ? prev.filter((k) => k !== permKey) : [...prev, permKey]
    );
  };

  const handleSaveEditRole = async () => {
    if (!editRoleName.trim()) { Alert.alert('กรุณากรอกชื่อ Role'); return; }
    setUpdatingCustomRole(true);
    try {
      const res = await fetch(`${API_BASE}/api/workspaces/${wsId}/roles/${editingRoleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          name: editRoleName.trim(),
          color: editRoleColor,
          permissions: editRolePermissions,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP Error: ${res.status}`);
      }

      setShowEditRole(false);
      fetchCustomRoles();
    } catch (err: any) {
      Alert.alert('Error จาก Backend', err.message || 'แก้ไข Role ไม่สำเร็จ');
    } finally {
      setUpdatingCustomRole(false);
    }
  };

  const handleDeleteRole = (roleItem: CustomRole) => {
    Alert.alert('ลบ Role', `ต้องการลบ role "${roleItem.name}"?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ', style: 'destructive', onPress: async () => {
          try {
            const res = await fetch(`${API_BASE}/api/workspaces/${wsId}/roles/${roleItem.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
            });

            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}));
              throw new Error(errorData.message || errorData.error || `HTTP Error: ${res.status}`);
            }

            fetchCustomRoles();
          } catch (err: any) {
            Alert.alert('Error จาก Backend', err.message || 'ลบ Role ไม่สำเร็จ');
          }
        },
      },
    ]);
  };

  /* ======================= RENDER TABS ======================= */

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: 'members', label: 'สมาชิก', icon: Users },
    { key: 'rooms', label: 'ห้องแชท', icon: Hash },
    { key: 'settings', label: 'ตั้งค่า', icon: Settings },
  ];

  /* ======================= MAIN RENDER ======================= */

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['top']}>

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827' }}>Workspace Management</Text>
          <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{params.wsName ?? 'จัดการ Workspace'}</Text>
        </View>
        <RoleBadge role={role} />
      </View>

      {/* Tab Bar */}
      <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderBottomWidth: 2.5, borderBottomColor: active ? '#425C95' : 'transparent' }}
            >
              <Icon size={16} color={active ? '#425C95' : '#9ca3af'} />
              <Text style={{ fontSize: 13, fontWeight: active ? '700' : '500', color: active ? '#425C95' : '#9ca3af' }}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

        {/* ===== TAB: MEMBERS ===== */}
        {activeTab === 'members' && (
          <>
            <SectionHeader title={`สมาชิก (${members.length} คน)`} />
            <Card>
              {loadingMembers ? (
                <ActivityIndicator color="#425C95" style={{ marginVertical: 24 }} />
              ) : members.length === 0 ? (
                <Text style={{ color: '#9ca3af', textAlign: 'center', padding: 24 }}>ไม่พบสมาชิก</Text>
              ) : (
                members.map((member, index) => {
                  const isMe = member.userId === currentUserId;
                  const isThisOwner = member.role === 'OWNER';
                  const canChangeRole = !isMe && !isThisOwner && (isOwner || (isAdminOrOwner && member.role !== 'ADMIN'));
                  const canKick = !isMe && !isThisOwner && (isOwner || (isAdminOrOwner && member.role !== 'ADMIN'));

                  return (
                    <View key={member.userId} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: index < members.length - 1 ? 1 : 0, borderBottomColor: '#f9fafb', gap: 12 }}>
                      <View style={{ position: 'relative' }}>
                        <Avatar name={member.user.Name} size={40} uri={member.user.avatarUrl} />
                        <View style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: 6, backgroundColor: '#d1d5db', borderWidth: 2, borderColor: '#fff' }} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{member.user.Name}</Text>
                          {isMe && <Text style={{ fontSize: 11, color: '#9ca3af' }}>(คุณ)</Text>}
                          {isThisOwner && <Crown size={13} color="#d97706" />}
                        </View>
                        <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{member.user.email}</Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {canChangeRole ? (
                          <TouchableOpacity
                            onPress={() => handleOpenRolePicker(member)}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: ROLE_COLORS[member.role]?.bg ?? '#f3f4f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}
                          >
                            <Text style={{ fontSize: 11, fontWeight: '700', color: ROLE_COLORS[member.role]?.text ?? '#374151' }}>
                              {ROLE_LABELS[member.role] ?? member.role}
                            </Text>
                            <ChevronDown size={11} color={ROLE_COLORS[member.role]?.text ?? '#374151'} />
                          </TouchableOpacity>
                        ) : (
                          <RoleBadge role={member.role} />
                        )}

                        {canKick && (
                          <TouchableOpacity onPress={() => handleKickMember(member)} style={{ padding: 4 }}>
                            <UserPlus size={16} color="#ef4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </Card>
            <View style={{ height: 32 }} />
          </>
        )}

        {/* ===== TAB: ROOMS ===== */}
        {activeTab === 'rooms' && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 24, marginBottom: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#9ca3af', letterSpacing: 0.8 }}>ห้องแชท ({rooms.length})</Text>
              <TouchableOpacity
                onPress={openCreateRoom}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#425C95', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 }}
              >
                <Plus size={13} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>สร้างห้อง</Text>
              </TouchableOpacity>
            </View>
            <Card>
              {loadingRooms ? (
                <ActivityIndicator color="#425C95" style={{ marginVertical: 24 }} />
              ) : rooms.length === 0 ? (
                <Text style={{ color: '#9ca3af', textAlign: 'center', padding: 24 }}>ยังไม่มีห้องแชท</Text>
              ) : (
                rooms.map((room, index) => (
                  <View key={room.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: index < rooms.length - 1 ? 1 : 0, borderBottomColor: '#f9fafb', gap: 12 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#152C53', alignItems: 'center', justifyContent: 'center' }}>
                      <Hash size={18} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{room.name}</Text>
                      <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                        {room.type === 'public' ? 'สาธารณะ' : 'ส่วนตัว'}
                        {room.memberCount !== undefined ? ` • ${room.memberCount} สมาชิก` : ''}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      <TouchableOpacity onPress={() => openRoomMembers(room)} style={{ padding: 8, backgroundColor: '#f0f4ff', borderRadius: 8 }}>
                        <Users size={15} color="#425C95" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => openEditRoom(room)} style={{ padding: 8, backgroundColor: '#f0f4ff', borderRadius: 8 }}>
                        <Edit3 size={15} color="#425C95" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteRoom(room)} style={{ padding: 8, backgroundColor: '#fef2f2', borderRadius: 8 }}>
                        <Trash2 size={15} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </Card>
            <View style={{ height: 32 }} />
          </>
        )}

        {/* ===== TAB: SETTINGS ===== */}
        {activeTab === 'settings' && (
          <>
            {loadingWs ? (
              <ActivityIndicator color="#425C95" style={{ marginTop: 40 }} />
            ) : (
              <>
                <SectionHeader title="ข้อมูล WORKSPACE" />
                <Card style={{ padding: 16 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>ชื่อ Workspace</Text>
                  <TextInput
                    value={wsName}
                    onChangeText={setWsName}
                    placeholder="ชื่อ Workspace"
                    placeholderTextColor="#d1d5db"
                    style={{ borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827', marginBottom: 14 }}
                  />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>คำอธิบาย</Text>
                  <TextInput
                    value={wsDesc}
                    onChangeText={setWsDesc}
                    placeholder="คำอธิบาย (ไม่บังคับ)"
                    placeholderTextColor="#d1d5db"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    style={{ borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827', marginBottom: 16, minHeight: 70 }}
                  />
                  <TouchableOpacity
                    onPress={handleSaveWs}
                    disabled={savingWs}
                    style={{ backgroundColor: '#425C95', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}
                  >
                    {savingWs ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>บันทึก</Text>}
                  </TouchableOpacity>
                </Card>

                <SectionHeader title="รหัสเชิญ (INVITE CODE)" />
                <Card style={{ padding: 16 }}>
                  <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>แชร์ code นี้ให้สมาชิกใหม่เข้าร่วม Workspace</Text>
                  {wsInfo?.inviteCode ? (
                    <>
                      <View style={{ backgroundColor: '#f9fafb', borderRadius: 10, padding: 14, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' }}>
                        <Text style={{ fontSize: 13, color: '#9ca3af', letterSpacing: 1 }}>{wsInfo.inviteCode}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity onPress={handleCopyCode} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#425C95', paddingVertical: 11, borderRadius: 10 }}>
                          <Copy size={14} color="#fff" />
                          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>คัดลอก</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleRegenerate} disabled={regenerating} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', paddingVertical: 11, borderRadius: 10 }}>
                          {regenerating ? <ActivityIndicator size="small" color="#ef4444" /> : <RefreshCw size={14} color="#ef4444" />}
                          <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 13 }}>{regenerating ? 'กำลังสร้าง...' : 'สร้างใหม่'}</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <Text style={{ color: '#9ca3af', textAlign: 'center', padding: 12 }}>ไม่พบ invite code</Text>
                  )}
                </Card>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 24, marginBottom: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#9ca3af', letterSpacing: 0.8 }}>CUSTOM ROLES</Text>
                  {isOwner && (
                    <TouchableOpacity onPress={() => setShowCreateRole(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#425C95', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 }}>
                      <Plus size={13} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>สร้าง Role</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Card>
                  {loadingRoles ? (
                    <ActivityIndicator color="#425C95" style={{ marginVertical: 20 }} />
                  ) : customRoles.length === 0 ? (
                    <View style={{ padding: 24, alignItems: 'center' }}>
                      <Shield size={32} color="#d1d5db" />
                      <Text style={{ color: '#9ca3af', marginTop: 8, textAlign: 'center' }}>ยังไม่มี custom role</Text>
                      {isOwner && <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>กด "สร้าง Role" เพื่อเพิ่ม</Text>}
                    </View>
                  ) : (
                    customRoles.map((r, index) => (
                      <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: index < customRoles.length - 1 ? 1 : 0, borderBottomColor: '#f9fafb', gap: 12 }}>
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: r.color ?? '#425C95' }} />
                        <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' }}>{r.name}</Text>
                        {isOwner && (
                          <View style={{ flexDirection: 'row', gap: 6 }}>
                            <TouchableOpacity onPress={() => openEditRole(r)} style={{ padding: 6, backgroundColor: '#f0f4ff', borderRadius: 8 }}>
                              <Edit3 size={15} color="#425C95" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteRole(r)} style={{ padding: 6, backgroundColor: '#fef2f2', borderRadius: 8 }}>
                              <Trash2 size={15} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    ))
                  )}
                </Card>
              </>
            )}
            <View style={{ height: 40 }} />
          </>
        )}

      </ScrollView>

      {/* ===== ROLE PICKER MODAL ===== */}
      <Modal visible={showRolePicker} transparent animationType="fade" onRequestClose={() => setShowRolePicker(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 }} activeOpacity={1} onPress={() => setShowRolePicker(false)}>
          <TouchableOpacity activeOpacity={1} style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', maxHeight: '80%' }}>
            
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>จัดการ Role</Text>
              <Text style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>{selectedMember?.user.Name}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#9ca3af', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>ยศหลัก (BASE ROLE)</Text>
              {assignableRoles.map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => handleUpdateRole(r)}
                  disabled={updatingRole || r === selectedMember?.role}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f9fafb', gap: 12, opacity: r === selectedMember?.role ? 0.5 : 1 }}
                >
                  <RoleBadge role={r} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{ROLE_LABELS[r]}</Text>
                    <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                      {r === 'ADMIN' ? 'จัดการสมาชิกและโพสต์ได้' : r === 'MODERATOR' ? 'ดูแลห้องแชทได้' : 'สมาชิกทั่วไป'}
                    </Text>
                  </View>
                  {r === selectedMember?.role && <Text style={{ fontSize: 12, color: '#9ca3af' }}>role ปัจจุบัน</Text>}
                  {updatingRole && r !== selectedMember?.role && <ActivityIndicator size="small" color="#425C95" />}
                </TouchableOpacity>
              ))}

              {customRoles.length > 0 && (
                <>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#9ca3af', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>ยศเพิ่มเติม (CUSTOM ROLES)</Text>
                  {customRoles.map((cr) => {
                    const hasRole = memberCustomRoles.some((mcr) => mcr.id === cr.id);
                    return (
                      <View
                        key={cr.id}
                        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f9fafb', gap: 12 }}
                      >
                        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: cr.color ?? '#425C95' }} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{cr.name}</Text>
                        </View>
                        <Switch
                          value={hasRole}
                          onValueChange={() => toggleCustomRole(cr)}
                          disabled={updatingRole}
                          trackColor={{ false: '#e5e7eb', true: '#425C95' }}
                        />
                      </View>
                    );
                  })}
                </>
              )}
              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={{ borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
              <TouchableOpacity onPress={() => setShowRolePicker(false)} style={{ padding: 16, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: '#6b7280', fontWeight: '600' }}>ปิดหน้าต่าง</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ===== ROOM CREATE/EDIT MODAL ===== */}
      <Modal visible={showRoomModal} transparent animationType="slide" onRequestClose={() => setShowRoomModal(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setShowRoomModal(false)} />
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>{editRoom ? 'แก้ไขห้อง' : 'สร้างห้องใหม่'}</Text>
            <TouchableOpacity onPress={() => setShowRoomModal(false)}><X size={20} color="#9ca3af" /></TouchableOpacity>
          </View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>ชื่อห้อง</Text>
          <TextInput
            value={roomName}
            onChangeText={setRoomName}
            placeholder="เช่น general, announcements"
            placeholderTextColor="#d1d5db"
            autoFocus
            style={{ borderWidth: 1.5, borderColor: roomName ? '#425C95' : '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: '#111827', marginBottom: 14 }}
          />
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>คำอธิบาย (ไม่บังคับ)</Text>
          <TextInput
            value={roomDesc}
            onChangeText={setRoomDesc}
            placeholder="อธิบายห้องนี้"
            placeholderTextColor="#d1d5db"
            style={{ borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: '#111827', marginBottom: 20 }}
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => setShowRoomModal(false)} style={{ flex: 1, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, paddingVertical: 13, alignItems: 'center' }}>
              <Text style={{ color: '#6b7280', fontWeight: '600' }}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveRoom} disabled={savingRoom || !roomName.trim()} style={{ flex: 2, backgroundColor: roomName.trim() ? '#425C95' : '#d1d5db', borderRadius: 10, paddingVertical: 13, alignItems: 'center' }}>
              {savingRoom ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>{editRoom ? 'บันทึก' : 'สร้างห้อง'}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ===== ROOM MEMBERS MODAL ===== */}
      <Modal visible={showRoomMembersModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowRoomMembersModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['top']}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>จัดการสมาชิกในห้อง</Text>
              <Text style={{ fontSize: 12, color: '#9ca3af' }}>#{selectedRoom?.name}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowRoomMembersModal(false)} style={{ backgroundColor: '#f3f4f6', borderRadius: 20, padding: 8 }}>
              <X size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#9ca3af', marginHorizontal: 20, marginTop: 16, marginBottom: 8 }}>สมาชิก WORKSPACE</Text>
            <View style={{ marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6', overflow: 'hidden' }}>
              {loadingRoomMembers ? (
                <ActivityIndicator color="#425C95" style={{ marginVertical: 24 }} />
              ) : roomMembers.length === 0 ? (
                <Text style={{ color: '#9ca3af', textAlign: 'center', padding: 24 }}>ไม่พบสมาชิก</Text>
              ) : (
                roomMembers.map((rm, index) => (
                  <View key={rm.userId} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: index < roomMembers.length - 1 ? 1 : 0, borderBottomColor: '#f9fafb', gap: 12 }}>
                    <Avatar name={rm.user.Name} size={36} uri={rm.user.avatarUrl} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{rm.user.Name}</Text>
                      <Text style={{ fontSize: 11, color: '#9ca3af' }}>{rm.user.email}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity onPress={() => handleAddToRoom(rm.userId)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0f4ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                        <UserPlus size={13} color="#425C95" />
                        <Text style={{ fontSize: 11, color: '#425C95', fontWeight: '600' }}>เพิ่ม</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleRemoveFromRoom(rm.userId)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fef2f2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                        <X size={13} color="#ef4444" />
                        <Text style={{ fontSize: 11, color: '#ef4444', fontWeight: '600' }}>นำออก</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
            <View style={{ height: 32 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ===== CREATE CUSTOM ROLE MODAL ===== */}
      <Modal visible={showCreateRole} transparent animationType="slide" onRequestClose={() => setShowCreateRole(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setShowCreateRole(false)} />
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>สร้าง Custom Role</Text>
            <TouchableOpacity onPress={() => setShowCreateRole(false)}><X size={20} color="#9ca3af" /></TouchableOpacity>
          </View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>ชื่อ Role</Text>
          <TextInput
            value={newRoleName}
            onChangeText={setNewRoleName}
            placeholder="เช่น Designer, PM, Lead"
            placeholderTextColor="#d1d5db"
            style={{ borderWidth: 1.5, borderColor: newRoleName ? '#425C95' : '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: '#111827', marginBottom: 16 }}
          />
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 10 }}>สี Role</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            {ROLE_COLORS_LIST.map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => setNewRoleColor(color)}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: color, alignItems: 'center', justifyContent: 'center', borderWidth: newRoleColor === color ? 3 : 0, borderColor: '#fff', shadowColor: newRoleColor === color ? color : 'transparent', shadowOpacity: 0.5, shadowRadius: 4, elevation: 2 }}
              >
                {newRoleColor === color && <Check size={14} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => setShowCreateRole(false)} style={{ flex: 1, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, paddingVertical: 13, alignItems: 'center' }}>
              <Text style={{ color: '#6b7280', fontWeight: '600' }}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCreateRole} disabled={creatingRole || !newRoleName.trim()} style={{ flex: 2, backgroundColor: newRoleName.trim() ? '#425C95' : '#d1d5db', borderRadius: 10, paddingVertical: 13, alignItems: 'center' }}>
              {creatingRole ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>สร้าง Role</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ===== EDIT CUSTOM ROLE MODAL ===== */}
      <Modal visible={showEditRole} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowEditRole(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <TouchableOpacity onPress={() => setShowEditRole(false)}><X size={22} color="#6b7280" /></TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>แก้ไขยศ</Text>
            <TouchableOpacity onPress={handleSaveEditRole} disabled={updatingCustomRole || !editRoleName.trim()} style={{ backgroundColor: editRoleName.trim() ? '#10b981' : '#e5e7eb', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}>
              {updatingCustomRole ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>บันทึก</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }}>
            <View style={{ padding: 16, backgroundColor: '#fff', marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>ชื่อยศ</Text>
              <TextInput
                value={editRoleName}
                onChangeText={setEditRoleName}
                placeholder="ชื่อยศ..."
                style={{ borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: '#111827', marginBottom: 16 }}
              />

              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 10 }}>สี</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {ROLE_COLORS_LIST.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setEditRoleColor(color)}
                    style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: color, alignItems: 'center', justifyContent: 'center', borderWidth: editRoleColor === color ? 3 : 0, borderColor: '#fff', shadowColor: editRoleColor === color ? color : 'transparent', shadowOpacity: 0.5, shadowRadius: 4, elevation: 2 }}
                  >
                    {editRoleColor === color && <Check size={14} color="#fff" />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff' }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 12 }}>สิทธิ์</Text>
              {AVAILABLE_PERMISSIONS.map((perm) => (
                <View key={perm.key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f9fafb' }}>
                  <Text style={{ fontSize: 14, color: '#111827' }}>{perm.label}</Text>
                  <Switch
                    value={editRolePermissions.includes(perm.key)}
                    onValueChange={() => togglePermission(perm.key)}
                    trackColor={{ false: '#e5e7eb', true: '#425C95' }}
                  />
                </View>
              ))}
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, Modal,
  Alert, ActivityIndicator, ScrollView, AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User, Zap, Shield, LogOut, X, Settings,
  RefreshCw, Copy, ChevronRight, DoorOpen, Crown, ChevronDown,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import DecorativeBubble from './DecBubble';
import { API_BASE } from '../../lib/config';

/* ======================= TYPES ======================= */

interface Member {
  userId: string;
  role: string;
  user: { id: string; Name: string; email: string; avatarUrl: string | null };
}

/* ======================= HELPERS ======================= */

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MODERATOR: 'Moderator',
  MEMBER: 'Member',
};

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  OWNER:     { bg: '#fef3c7', text: '#d97706' },
  ADMIN:     { bg: '#dbeafe', text: '#1d4ed8' },
  MODERATOR: { bg: '#ede9fe', text: '#7c3aed' },
  MEMBER:    { bg: '#f3f4f6', text: '#374151' },
};

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function RoleBadge({ role }: { role: string }) {
  const color = ROLE_COLORS[role] ?? ROLE_COLORS.MEMBER;
  return (
    <View style={{ backgroundColor: color.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: color.text }}>{ROLE_LABELS[role] ?? role}</Text>
    </View>
  );
}

/* ======================= HEADER PROPS ======================= */

interface HeaderProps {
  subtitle?: string;
  userInitials?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  userAvatarUrl?: string | null;
  workspaceName?: string;
  workspaceId?: string;
  role?: string;
  token?: string;
  currentUserId?: string;
}

/* ======================= HEADER ======================= */

export default function Header({
  subtitle = 'Stay updated with announcements',
  userInitials = 'YO',
  userName = 'Your Name',
  userEmail = 'your.email@company.com',
  userRole = 'Team Member',
  workspaceName = 'Teamly Workspace',
  workspaceId,
  role,
  token,
  currentUserId,
}: HeaderProps) {
  const router = useRouter();

  // อ่าน avatarUrl จาก AsyncStorage โดยตรง ไม่ต้องรอ parent ส่งมา
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      AsyncStorage.getItem('user').then((u) => {
        if (u) {
          const parsed = JSON.parse(u);
          setLocalAvatarUrl(parsed.avatarUrl ?? null);
        }
      });
    };
    load();
    // refresh เมื่อ app กลับมา foreground (เช่น หลังเปิด image picker)
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') load();
    });
    return () => sub.remove();
  }, []);

  const [showProfile, setShowProfile] = useState(false);
  const [showWsSettings, setShowWsSettings] = useState(false);

  // Invite code state
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loadingCode, setLoadingCode] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Members state
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Role picker state
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [updatingRole, setUpdatingRole] = useState(false);

  const isOwner = role === 'OWNER';
  const isAdminOrOwner = role === 'OWNER' || role === 'ADMIN';
  const isModOrMember = role === 'MODERATOR' || role === 'MEMBER';

  /* ===== Roles ที่ assign ได้ตาม role ตัวเอง ===== */
  const assignableRoles = isOwner
    ? ['ADMIN', 'MODERATOR', 'MEMBER']
    : ['MODERATOR', 'MEMBER']; // ADMIN assign ได้แค่ MOD, MEMBER

  /* ===== โหลด invite code ===== */
  const loadInviteCode = useCallback(async () => {
    if (!workspaceId || !token) return;
    try {
      setLoadingCode(true);
      const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}`, {
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setInviteCode(json.data?.inviteCode ?? null);
    } catch {
      Alert.alert('เกิดข้อผิดพลาด', 'โหลด invite code ไม่สำเร็จ');
    } finally {
      setLoadingCode(false);
    }
  }, [workspaceId, token]);

  /* ===== โหลดสมาชิก ===== */
  const loadMembers = useCallback(async () => {
    if (!workspaceId || !token) return;
    try {
      setLoadingMembers(true);
      const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/members`, {
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setMembers(json.data ?? []);
    } catch {
      Alert.alert('เกิดข้อผิดพลาด', 'โหลดรายชื่อสมาชิกไม่สำเร็จ');
    } finally {
      setLoadingMembers(false);
    }
  }, [workspaceId, token]);

  /* ===== เปิด workspace settings ===== */
  const handleOpenWsSettings = () => {
    setShowProfile(false);
    setInviteCode(null);
    setMembers([]);
    setShowWsSettings(true);
    loadInviteCode();
    loadMembers();
  };

  /* ===== สร้าง invite code ใหม่ ===== */
  const handleRegenerate = () => {
    Alert.alert('สร้าง Code ใหม่?', 'Code เดิมจะใช้งานไม่ได้อีก', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'สร้างใหม่', style: 'destructive', onPress: async () => {
          if (!workspaceId || !token) return;
          try {
            setRegenerating(true);
            const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/regenerate-invite`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
            });
            if (!res.ok) throw new Error();
            const json = await res.json();
            setInviteCode(json.data?.inviteCode ?? null);
          } catch {
            Alert.alert('เกิดข้อผิดพลาด', 'สร้าง code ใหม่ไม่สำเร็จ');
          } finally {
            setRegenerating(false);
          }
        }
      },
    ]);
  };

  /* ===== copy code ===== */
  const handleCopy = async () => {
    if (!inviteCode) return;
    await Clipboard.setStringAsync(inviteCode);
    Alert.alert('คัดลอกแล้ว', 'Invite code ถูกคัดลอกไปยัง clipboard แล้ว');
  };

  /* ===== เปิด role picker ===== */
  const handleOpenRolePicker = (member: Member) => {
    // ไม่สามารถเปลี่ยน role ของ OWNER ได้
    if (member.role === 'OWNER') return;
    // ADMIN เปลี่ยน role ของ ADMIN ด้วยกันไม่ได้
    if (!isOwner && member.role === 'ADMIN') {
      Alert.alert('ไม่มีสิทธิ์', 'Admin ไม่สามารถเปลี่ยน role ของ Admin ด้วยกันได้');
      return;
    }
    setSelectedMember(member);
    setShowRolePicker(true);
  };

  /* ===== อัปเดต role ===== */
  const handleUpdateRole = async (newRole: string) => {
    if (!selectedMember || !workspaceId || !token) return;
    try {
      setUpdatingRole(true);
      const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/members/${selectedMember.userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error();
      setShowRolePicker(false);
      setSelectedMember(null);
      loadMembers(); // reload
    } catch {
      Alert.alert('เกิดข้อผิดพลาด', 'เปลี่ยน role ไม่สำเร็จ');
    } finally {
      setUpdatingRole(false);
    }
  };

  /* ===== ออกจาก workspace (MODERATOR/MEMBER) ===== */
  const handleLeaveWorkspace = () => {
    Alert.alert('ออกจาก Workspace?', 'คุณจะไม่สามารถกลับเข้ามาได้จนกว่าจะได้รับเชิญใหม่', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ออก', style: 'destructive', onPress: async () => {
          if (!workspaceId || !token || !currentUserId) return;
          try {
            const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/members/${currentUserId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
            });
            if (!res.ok) throw new Error();
            setShowProfile(false);
            router.replace({ pathname: '/(workspace)/workspace', params: { token } });
          } catch {
            Alert.alert('เกิดข้อผิดพลาด', 'ออกจาก Workspace ไม่สำเร็จ');
          }
        }
      },
    ]);
  };

  /* ===== เปลี่ยน workspace (OWNER/ADMIN) ===== */
  const handleSwitchWorkspace = () => {
    Alert.alert('เปลี่ยน Workspace?', 'กลับไปหน้าเลือก Workspace', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ไป', onPress: () => {
          setShowProfile(false);
          router.replace({ pathname: '/(workspace)/workspace', params: { token } });
        }
      },
    ]);
  };

  /* ======================= RENDER ======================= */

  return (
    <>
      {/* ===== GRADIENT HEADER BAR ===== */}
      <LinearGradient
        colors={['#152C53', '#234476', '#42639B']}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, position: 'relative' }}
      >
        <DecorativeBubble size={35} top={-5} right={-8} opacity={0.12} />
        <DecorativeBubble size={20} top={5} right={10} opacity={0.07} />
        <DecorativeBubble size={45} bottom={-13} left={-10} opacity={0.08} />

        <View style={{ position: 'absolute', top: -50, left: -25, width: 200, height: 200 }} pointerEvents="none">
          <Image source={require('../../assets/images/TeamlyImage/TeamlyLogo.png')} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4, zIndex: 10 }}>
          <TouchableOpacity onPress={() => setShowProfile(true)} style={{ position: 'relative' }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', overflow: 'hidden' }}>
              {localAvatarUrl
                ? <Image source={{ uri: localAvatarUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{userInitials}</Text>
              }
            </View>
            <View style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#234476' }} />
          </TouchableOpacity>
        </View>

        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2, zIndex: 10 }}>{subtitle}</Text>
      </LinearGradient>

      {/* ===== PROFILE MODAL ===== */}
      <Modal visible={showProfile} transparent animationType="fade" onRequestClose={() => setShowProfile(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={() => setShowProfile(false)}>
          <TouchableOpacity activeOpacity={1} style={{ position: 'absolute', top: 80, right: 16, left: 16, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden' }}>

            <LinearGradient colors={['#152C53', '#234476', '#42639B']} start={{ x: 0, y: 1 }} end={{ x: 1, y: 1 }} style={{ padding: 16 }}>
              <TouchableOpacity onPress={() => setShowProfile(false)} style={{ position: 'absolute', top: 12, right: 12 }}>
                <X size={18} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', overflow: 'hidden' }}>
                  {localAvatarUrl
                    ? <Image source={{ uri: localAvatarUrl }} style={{ width: 48, height: 48, borderRadius: 24 }} />
                    : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{userInitials}</Text>
                  }
                </View>
                <View>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{userName}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{userRole}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' }} />
                    <Text style={{ color: '#22c55e', fontSize: 12, fontWeight: '600' }}>Active now</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>

            <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
              <Text style={{ fontSize: 13, color: '#6b7280' }}>{userEmail}</Text>
              <Text style={{ fontSize: 13, color: '#425C95', marginTop: 4 }}>{workspaceName}</Text>
            </View>

            {[
              { icon: <User size={18} color="#425C95" />, label: 'Profile & Settings' },
              { icon: <Zap size={18} color="#f59e0b" />, label: 'Set Status', sub: 'Active now' },
              { icon: <Shield size={18} color="#8b5cf6" />, label: 'Privacy & Security' },
            ].map((item, index) => (
              <TouchableOpacity key={index} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f9fafb', gap: 12 }}>
                {item.icon}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{item.label}</Text>
                  {item.sub && <Text style={{ fontSize: 12, color: '#9ca3af' }}>{item.sub}</Text>}
                </View>
                <ChevronRight size={16} color="#d1d5db" />
              </TouchableOpacity>
            ))}

            {/* Workspace Settings — เฉพาะ OWNER/ADMIN */}
            {isAdminOrOwner && (
              <TouchableOpacity onPress={handleOpenWsSettings} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f9fafb', gap: 12 }}>
                <Settings size={18} color="#425C95" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>Workspace Settings</Text>
                  <Text style={{ fontSize: 12, color: '#9ca3af' }}>Invite code และจัดการสมาชิก</Text>
                </View>
                <ChevronRight size={16} color="#d1d5db" />
              </TouchableOpacity>
            )}

            {/* ออกจาก Workspace — เฉพาะ MODERATOR/MEMBER */}
            {isModOrMember && (
              <TouchableOpacity onPress={handleLeaveWorkspace} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f9fafb', gap: 12 }}>
                <DoorOpen size={18} color="#ef4444" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#ef4444' }}>ออกจาก Workspace</Text>
                  <Text style={{ fontSize: 12, color: '#9ca3af' }}>คุณสามารถเข้าร่วมได้อีกครั้งด้วย invite code</Text>
                </View>
                <ChevronRight size={16} color="#d1d5db" />
              </TouchableOpacity>
            )}

            {/* เปลี่ยน Workspace — OWNER/ADMIN */}
            {isAdminOrOwner && (
              <TouchableOpacity onPress={handleSwitchWorkspace} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f9fafb', gap: 12 }}>
                <RefreshCw size={18} color="#6b7280" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>เปลี่ยน Workspace</Text>
                  <Text style={{ fontSize: 12, color: '#9ca3af' }}>กลับไปหน้าเลือก Workspace</Text>
                </View>
                <ChevronRight size={16} color="#d1d5db" />
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => { setShowProfile(false); router.replace('/(auth)/login'); }} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
              <LogOut size={18} color="#ef4444" />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#ef4444' }}>Sign Out</Text>
            </TouchableOpacity>

            <Text style={{ textAlign: 'center', fontSize: 11, color: '#d1d5db', paddingBottom: 12 }}>Teamly v1.0.0</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ===== WORKSPACE SETTINGS MODAL ===== */}
      <Modal visible={showWsSettings} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowWsSettings(false)}>
        <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>

          {/* Header */}
          <LinearGradient colors={['#152C53', '#234476', '#42639B']} start={{ x: 0, y: 1 }} end={{ x: 1, y: 1 }} style={{ padding: 16, paddingTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>Workspace Settings</Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>{workspaceName}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowWsSettings(false)} style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 8 }}>
              <X size={18} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>

            {/* ===== INVITE CODE SECTION ===== */}
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f3f4f6' }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 }}>Invite Code</Text>
              <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>แชร์ code นี้ให้สมาชิกใหม่เข้าร่วม Workspace</Text>

              {loadingCode ? (
                <ActivityIndicator color="#425C95" style={{ marginVertical: 16 }} />
              ) : inviteCode ? (
                <>
                  <View style={{ backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f3f4f6', alignItems: 'center' }}>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: '#425C95', letterSpacing: 6 }}>
                      {inviteCode.slice(0, 8).toUpperCase()}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 6 }}>{inviteCode}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={handleCopy} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#425C95', paddingVertical: 12, borderRadius: 12 }}>
                      <Copy size={15} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>คัดลอก</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleRegenerate} disabled={regenerating} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', paddingVertical: 12, borderRadius: 12 }}>
                      {regenerating ? <ActivityIndicator size="small" color="#ef4444" /> : <RefreshCw size={15} color="#ef4444" />}
                      <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 13 }}>{regenerating ? 'กำลังสร้าง...' : 'สร้างใหม่'}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <Text style={{ color: '#9ca3af', textAlign: 'center', paddingVertical: 12 }}>ไม่พบ invite code</Text>
              )}
            </View>

            {/* ===== MEMBERS SECTION ===== */}
            <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6', overflow: 'hidden' }}>
              <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f9fafb', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>สมาชิก</Text>
                  <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{members.length} คน</Text>
                </View>
                <TouchableOpacity onPress={loadMembers} style={{ padding: 6 }}>
                  <RefreshCw size={16} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              {loadingMembers ? (
                <ActivityIndicator color="#425C95" style={{ marginVertical: 20 }} />
              ) : members.length === 0 ? (
                <Text style={{ color: '#9ca3af', textAlign: 'center', padding: 20 }}>ไม่พบสมาชิก</Text>
              ) : (
                members.map((member, index) => {
                  const isMe = member.userId === currentUserId;
                  const isThisOwner = member.role === 'OWNER';
                  const canChangeRole = !isMe && !isThisOwner && (isOwner || (isAdminOrOwner && member.role !== 'ADMIN'));

                  return (
                    <View key={member.userId} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: index < members.length - 1 ? 1 : 0, borderBottomColor: '#f9fafb', gap: 12 }}>
                      {/* Avatar */}
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#425C95', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{getInitials(member.user.Name)}</Text>
                      </View>

                      {/* Info */}
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{member.user.Name}</Text>
                          {isMe && <Text style={{ fontSize: 11, color: '#9ca3af' }}>(คุณ)</Text>}
                          {isThisOwner && <Crown size={13} color="#d97706" />}
                        </View>
                        <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{member.user.email}</Text>
                      </View>

                      {/* Role badge + change button */}
                      {canChangeRole ? (
                        <TouchableOpacity
                          onPress={() => handleOpenRolePicker(member)}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: ROLE_COLORS[member.role]?.bg ?? '#f3f4f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '700', color: ROLE_COLORS[member.role]?.text ?? '#374151' }}>
                            {ROLE_LABELS[member.role] ?? member.role}
                          </Text>
                          <ChevronDown size={12} color={ROLE_COLORS[member.role]?.text ?? '#374151'} />
                        </TouchableOpacity>
                      ) : (
                        <RoleBadge role={member.role} />
                      )}
                    </View>
                  );
                })
              )}
            </View>

            {/* Note */}
            <Text style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', paddingBottom: 8 }}>
              {isOwner ? 'Owner สามารถเปลี่ยน role ได้ทุก role' : 'Admin สามารถเปลี่ยนได้เฉพาะ Moderator และ Member'}
            </Text>

          </ScrollView>
        </View>
      </Modal>

      {/* ===== ROLE PICKER MODAL ===== */}
      <Modal visible={showRolePicker} transparent animationType="fade" onRequestClose={() => setShowRolePicker(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 32 }} activeOpacity={1} onPress={() => setShowRolePicker(false)}>
          <TouchableOpacity activeOpacity={1} style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden' }}>

            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>เปลี่ยน Role</Text>
              <Text style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>{selectedMember?.user.Name}</Text>
            </View>

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

            <TouchableOpacity onPress={() => setShowRolePicker(false)} style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: '#6b7280', fontWeight: '600' }}>ยกเลิก</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
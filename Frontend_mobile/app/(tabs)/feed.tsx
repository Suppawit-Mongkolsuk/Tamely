import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, RefreshControl, Modal, KeyboardAvoidingView,
  Platform, ScrollView, Alert, ActionSheetIOS,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Pin, MessageCircle, ImageIcon, X, Send, MoreHorizontal } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import Header from '../../components/ui/Header';

/* ======================= TYPES ======================= */

interface Author {
  id: string;
  Name: string;
  avatarUrl: string | null;
}

interface Post {
  id: string;
  title: string;
  body: string;
  imageUrls: string[];
  isPinned: boolean;
  createdAt: string;
  author: Author;
  commentCount: number;
}

interface PostsResponse {
  success: boolean;
  data: Post[];
  total: number;
  limit: number;
  offset: number;
}

/* ======================= CONFIG ======================= */

const API_BASE = 'https://ineffectual-marian-nonnattily.ngrok-free.dev';

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

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const colors = ['#425C95', '#7C3AED', '#059669', '#DC2626', '#D97706'];
  const colorIndex = name.charCodeAt(0) % colors.length;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors[colorIndex], alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontSize: size * 0.35, fontWeight: '700' }}>{getInitials(name)}</Text>
    </View>
  );
}

/* ======================= POST CARD ======================= */

interface PostCardProps {
  post: Post;
  currentUserId: string;
  isAdminOrOwner: boolean;
  token: string;
  onDeleted: () => void;
  onEdit: (post: Post) => void;
}

function PostCard({ post, currentUserId, isAdminOrOwner, token, onDeleted, onEdit }: PostCardProps) {
  const canManage = isAdminOrOwner || post.author.id === currentUserId;

  const handleMorePress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['ยกเลิก', 'แก้ไขโพสต์', 'ลบโพสต์'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) onEdit(post);
          if (index === 2) confirmDelete();
        },
      );
    } else {
      // Android — ใช้ Alert เป็น action sheet
      Alert.alert('จัดการโพสต์', '', [
        { text: 'แก้ไขโพสต์', onPress: () => onEdit(post) },
        { text: 'ลบโพสต์', style: 'destructive', onPress: confirmDelete },
        { text: 'ยกเลิก', style: 'cancel' },
      ]);
    }
  };

  const confirmDelete = () => {
    Alert.alert('ลบโพสต์?', 'โพสต์นี้จะถูกลบถาวร', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: deletePost },
    ]);
  };

  const deletePost = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!res.ok) {
        const json = await res.json();
        if (res.status === 403) {
          Alert.alert('ไม่มีสิทธิ์', 'คุณไม่มีสิทธิ์ลบโพสต์นี้');
        } else {
          Alert.alert('เกิดข้อผิดพลาด', json.message ?? 'ลบโพสต์ไม่สำเร็จ');
        }
        return;
      }

      onDeleted();
    } catch {
      Alert.alert('Network Error', 'ไม่สามารถเชื่อมต่อ server ได้');
    }
  };

  return (
    <TouchableOpacity
      style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: post.isPinned ? '#dbeafe' : '#f3f4f6', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
      activeOpacity={0.8}
    >
      {/* Pinned + More button row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: post.isPinned ? 8 : 0 }}>
        {post.isPinned ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Pin size={12} color="#425C95" />
            <Text style={{ fontSize: 11, color: '#425C95', fontWeight: '700', letterSpacing: 0.3 }}>PINNED</Text>
          </View>
        ) : <View />}

        {/* จุดสามจุด — แสดงเฉพาะคนที่มีสิทธิ์ */}
        {canManage && (
          <TouchableOpacity
            onPress={handleMorePress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ padding: 2 }}
          >
            <MoreHorizontal size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 6, lineHeight: 22 }}>{post.title}</Text>
      <Text style={{ fontSize: 13, color: '#6b7280', lineHeight: 20, marginBottom: 12 }} numberOfLines={3}>{post.body}</Text>

      {post.imageUrls.length > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 }}>
          <ImageIcon size={13} color="#9ca3af" />
          <Text style={{ fontSize: 12, color: '#9ca3af' }}>{post.imageUrls.length} รูปภาพ</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f9fafb' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Avatar name={post.author.Name} size={24} />
          <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '500' }}>{post.author.Name}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MessageCircle size={13} color="#9ca3af" />
            <Text style={{ fontSize: 12, color: '#9ca3af' }}>{post.commentCount}</Text>
          </View>
          <Text style={{ fontSize: 12, color: '#9ca3af' }}>{timeAgo(post.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ======================= SKELETON ======================= */

function SkeletonCard() {
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f3f4f6' }}>
      <View style={{ height: 14, width: '70%', backgroundColor: '#f3f4f6', borderRadius: 7, marginBottom: 10 }} />
      <View style={{ height: 12, width: '100%', backgroundColor: '#f9fafb', borderRadius: 6, marginBottom: 6 }} />
      <View style={{ height: 12, width: '80%', backgroundColor: '#f9fafb', borderRadius: 6, marginBottom: 16 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ height: 12, width: 80, backgroundColor: '#f3f4f6', borderRadius: 6 }} />
        <View style={{ height: 12, width: 60, backgroundColor: '#f3f4f6', borderRadius: 6 }} />
      </View>
    </View>
  );
}

/* ======================= POST FORM MODAL (ใช้ทั้ง Create และ Edit) ======================= */

interface PostFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string;
  wsId: string;
  editingPost?: Post | null; // ถ้ามีค่า = edit mode, ถ้าไม่มี = create mode
}

function PostFormModal({ visible, onClose, onSuccess, token, wsId, editingPost }: PostFormModalProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEditMode = !!editingPost;

  // โหลดค่าเดิมเมื่อเปิด edit mode
  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title);
      setBody(editingPost.body);
    } else {
      setTitle('');
      setBody('');
    }
  }, [editingPost, visible]);

  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      setSubmitting(true);

      const url = isEditMode
        ? `${API_BASE}/api/posts/${editingPost!.id}`
        : `${API_BASE}/api/workspaces/${wsId}/posts`;

      const res = await fetch(url, {
        method: isEditMode ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          Alert.alert('ไม่มีสิทธิ์', isEditMode ? 'คุณไม่มีสิทธิ์แก้ไขโพสต์นี้' : 'เฉพาะ Admin หรือ Owner เท่านั้นที่สร้างประกาศได้');
        } else {
          Alert.alert('เกิดข้อผิดพลาด', json.message ?? 'ไม่สามารถบันทึกได้');
        }
        return;
      }

      setTitle('');
      setBody('');
      onClose();
      onSuccess();
    } catch {
      Alert.alert('Network Error', 'ไม่สามารถเชื่อมต่อ server ได้');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    const isDirty = isEditMode
      ? title !== editingPost?.title || body !== editingPost?.body
      : title.length > 0 || body.length > 0;

    if (isDirty) {
      Alert.alert('ยกเลิก?', 'ข้อมูลที่กรอกจะหายไป', [
        { text: 'อยู่ต่อ', style: 'cancel' },
        { text: 'ยกเลิก', style: 'destructive', onPress: () => { setTitle(''); setBody(''); onClose(); } },
      ]);
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <TouchableOpacity onPress={handleClose} style={{ padding: 4 }}>
              <X size={22} color="#6b7280" />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>
              {isEditMode ? 'แก้ไขประกาศ' : 'สร้างประกาศ'}
            </Text>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: canSubmit ? '#425C95' : '#e5e7eb', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}
            >
              <Send size={14} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                {submitting ? 'กำลังส่ง...' : isEditMode ? 'บันทึก' : 'โพสต์'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>
              หัวข้อ <Text style={{ color: '#ef4444' }}>*</Text>
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="ชื่อประกาศ..."
              placeholderTextColor="#d1d5db"
              maxLength={200}
              style={{ backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 4 }}
            />
            <Text style={{ fontSize: 11, color: '#9ca3af', textAlign: 'right', marginBottom: 16 }}>
              {title.length}/200
            </Text>

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>
              เนื้อหา <Text style={{ color: '#ef4444' }}>*</Text>
            </Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="รายละเอียดประกาศ..."
              placeholderTextColor="#d1d5db"
              multiline
              textAlignVertical="top"
              style={{ backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#f3f4f6', minHeight: 160 }}
            />

            {!isEditMode && (
              <View style={{ backgroundColor: '#eff6ff', borderRadius: 10, padding: 12, marginTop: 16, flexDirection: 'row', gap: 8 }}>
                <Text style={{ fontSize: 16 }}>ℹ️</Text>
                <Text style={{ fontSize: 12, color: '#1d4ed8', flex: 1, lineHeight: 18 }}>
                  เฉพาะ Admin และ Owner เท่านั้นที่สามารถสร้างประกาศได้
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ======================= FEED SCREEN ======================= */

export default function FeedScreen() {
  const params = useLocalSearchParams();

  const rawToken = params.token;
  const rawWsId = params.wsId;
  const rawUser = params.user;
  const rawRole = params.role;
  const token = Array.isArray(rawToken) ? rawToken[0] : (rawToken ?? '');
  const wsId = Array.isArray(rawWsId) ? rawWsId[0] : (rawWsId ?? '');
  const userStr = Array.isArray(rawUser) ? rawUser[0] : (rawUser ?? '');
  const role = Array.isArray(rawRole) ? rawRole[0] : (rawRole ?? '');
  const userData = userStr ? JSON.parse(userStr) : null;

  const isAdminOrOwner = role === 'OWNER' || role === 'ADMIN';

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const loadPosts = useCallback(async (isRefresh = false) => {
    if (!token || !wsId) {
      setLoading(false);
      return;
    }
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE}/api/workspaces/${wsId}/posts?limit=50&offset=0`, {
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: PostsResponse = await res.json();
      setPosts(json.data);
    } catch {
      setError('ไม่สามารถโหลดโพสต์ได้ กรุณาลองใหม่');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, wsId]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPost(null);
  };

  const filtered = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.body.toLowerCase().includes(search.toLowerCase()),
  );
  const pinned = filtered.filter((p) => p.isPinned);
  const recent = filtered.filter((p) => !p.isPinned);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['top']}>
      <Header
        subtitle="Stay updated with announcements"
        userName={userData?.displayName ?? 'Your Name'}
        userEmail={userData?.email ?? ''}
        userInitials={(userData?.displayName ?? 'YO')
          .split(' ')
          .map((w: string) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)}
      />

      <FlatList
        data={recent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadPosts(true)} tintColor="#425C95" colors={['#425C95']} />
        }
        ListHeaderComponent={
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#f3f4f6', gap: 8, marginBottom: 20 }}>
              <Search size={16} color="#9ca3af" />
              <TextInput placeholder="ค้นหาประกาศ..." placeholderTextColor="#d1d5db" value={search} onChangeText={setSearch} style={{ flex: 1, fontSize: 14, color: '#111827' }} />
            </View>

            {loading && <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>}

            {error && !loading && (
              <TouchableOpacity onPress={() => loadPosts()} style={{ backgroundColor: '#fef2f2', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#fecaca' }}>
                <Text style={{ color: '#dc2626', fontSize: 13, marginBottom: 4 }}>{error}</Text>
                <Text style={{ color: '#425C95', fontSize: 13, fontWeight: '600' }}>แตะเพื่อลองใหม่</Text>
              </TouchableOpacity>
            )}

            {!loading && pinned.length > 0 && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <Pin size={14} color="#425C95" />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#425C95' }}>Pinned Announcements</Text>
                  <View style={{ backgroundColor: '#dbeafe', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99 }}>
                    <Text style={{ fontSize: 11, color: '#1d4ed8', fontWeight: '700' }}>{pinned.length}</Text>
                  </View>
                </View>
                {pinned.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={userData?.id ?? ''}
                    isAdminOrOwner={isAdminOrOwner}
                    token={token}
                    onDeleted={() => loadPosts(true)}
                    onEdit={handleEdit}
                  />
                ))}
              </>
            )}

            {!loading && recent.length > 0 && (
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 12, marginTop: pinned.length > 0 ? 8 : 0 }}>
                Recent Announcements
              </Text>
            )}
          </>
        }
        renderItem={({ item }) => !loading ? (
          <PostCard
            post={item}
            currentUserId={userData?.id ?? ''}
            isAdminOrOwner={isAdminOrOwner}
            token={token}
            onDeleted={() => loadPosts(true)}
            onEdit={handleEdit}
          />
        ) : null}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>📭</Text>
              <Text style={{ color: '#9ca3af', fontSize: 14 }}>{search ? 'ไม่พบโพสต์ที่ค้นหา' : 'ยังไม่มีประกาศ'}</Text>
            </View>
          ) : null
        }
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={() => { setEditingPost(null); setShowForm(true); }}
        style={{ position: 'absolute', bottom: 24, right: 20, backgroundColor: '#425C95', width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: '#425C95', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 }}
        activeOpacity={0.85}
      >
        <Text style={{ color: '#fff', fontSize: 26, lineHeight: 30 }}>+</Text>
      </TouchableOpacity>

      {/* Create / Edit Modal */}
      <PostFormModal
        visible={showForm}
        onClose={handleCloseForm}
        onSuccess={() => loadPosts(true)}
        token={token}
        wsId={wsId}
        editingPost={editingPost}
      />
    </SafeAreaView>
  );
}
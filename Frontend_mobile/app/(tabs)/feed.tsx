import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, RefreshControl, Modal, KeyboardAvoidingView,
  Platform, ScrollView, Alert, ActionSheetIOS,
  Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Pin, MessageCircle, X, Send, MoreHorizontal, Camera } from 'lucide-react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

interface Member {
  role: string;
  user: { id: string; Name: string; email: string; avatarUrl: string | null };
}

/* ======================= CONFIG ======================= */

import { API_BASE } from '@/lib/config';
const MAX_IMAGES = 10;
const MAX_FILE_SIZE_MB = 5;

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

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const colors = ['#425C95', '#7C3AED', '#059669', '#DC2626', '#D97706'];
  const colorIndex = name.charCodeAt(0) % colors.length;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors[colorIndex], alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontSize: size * 0.35, fontWeight: '700' }}>{getInitials(name)}</Text>
    </View>
  );
}

/* ======================= MENTION HOOK ======================= */

function useMention(members: Member[], currentUserId: string) {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  const handleChange = (text: string, setValue: (v: string) => void) => {
    setValue(text);
    const lastAt = text.lastIndexOf('@');
    if (lastAt !== -1) {
      const afterAt = text.slice(lastAt + 1);
      if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
        setMentionQuery(afterAt);
        return;
      }
    }
    setMentionQuery(null);
  };

  const handleSelect = (
    member: Member,
    currentText: string,
    setValue: (v: string) => void,
    inputRef?: React.RefObject<TextInput | null>,
  ) => {
    const lastAt = currentText.lastIndexOf('@');
    const before = currentText.slice(0, lastAt);
    const name = member.user.Name;
    const mention = name.includes(' ') ? `@[${name}] ` : `@${name} `;
    setValue(before + mention);
    setMentionQuery(null);
    inputRef?.current?.focus();
  };

  const suggestions = mentionQuery !== null
    ? members.filter((m) =>
        m.user.Name.toLowerCase().includes(mentionQuery.toLowerCase()) &&
        m.user.id !== currentUserId
      ).slice(0, 5)
    : [];

  return { mentionQuery, setMentionQuery, handleChange, handleSelect, suggestions };
}

/* ======================= MENTION SUGGESTIONS ======================= */

function MentionSuggestions({ suggestions, onSelect }: { suggestions: Member[]; onSelect: (m: Member) => void }) {
  if (suggestions.length === 0) return null;
  return (
    <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#f3f4f6', borderRadius: 12, marginBottom: 8, overflow: 'hidden' }}>
      {suggestions.map((m) => (
        <TouchableOpacity key={m.user.id} onPress={() => onSelect(m)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f9fafb' }}>
          <Avatar name={m.user.Name} size={28} />
          <View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }}>{m.user.Name}</Text>
            <Text style={{ fontSize: 11, color: '#9ca3af' }}>{m.role}</Text>
          </View>
        </TouchableOpacity>
      ))}
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
  onPress: () => void;
}

function PostCard({ post, currentUserId, isAdminOrOwner, token, onDeleted, onEdit, onPress }: PostCardProps) {
  const canManage = isAdminOrOwner || post.author.id === currentUserId;

  const handleMorePress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['ยกเลิก', 'แก้ไขโพสต์', 'ลบโพสต์'], destructiveButtonIndex: 2, cancelButtonIndex: 0 },
        (index) => { if (index === 1) onEdit(post); if (index === 2) confirmDelete(); },
      );
    } else {
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
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
      });
      if (!res.ok) {
        const json = await res.json();
        Alert.alert(res.status === 403 ? 'ไม่มีสิทธิ์' : 'เกิดข้อผิดพลาด', json.message ?? 'ลบโพสต์ไม่สำเร็จ');
        return;
      }
      onDeleted();
    } catch { Alert.alert('Network Error', 'ไม่สามารถเชื่อมต่อ server ได้'); }
  };

  return (
    <TouchableOpacity onPress={onPress} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: post.isPinned ? '#dbeafe' : '#f3f4f6', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }} activeOpacity={0.8}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: post.isPinned ? 8 : 0 }}>
        {post.isPinned ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Pin size={12} color="#425C95" />
            <Text style={{ fontSize: 11, color: '#425C95', fontWeight: '700', letterSpacing: 0.3 }}>PINNED</Text>
          </View>
        ) : <View />}
        {canManage && (
          <TouchableOpacity onPress={handleMorePress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ padding: 2 }}>
            <MoreHorizontal size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 6, lineHeight: 22 }}>{post.title}</Text>
      <Text style={{ fontSize: 13, color: '#6b7280', lineHeight: 20, marginBottom: 12 }} numberOfLines={3}>{post.body}</Text>
      {post.imageUrls.length > 0 && (
        <View style={{ marginBottom: 10 }}>
          <Image source={{ uri: post.imageUrls[0] }} style={{ width: '100%', height: 160, borderRadius: 10, backgroundColor: '#f3f4f6' }} resizeMode="cover" />
          {post.imageUrls.length > 1 && (
            <View style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>+{post.imageUrls.length - 1}</Text>
            </View>
          )}
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

/* ======================= POST FORM MODAL ======================= */

interface PostFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string;
  wsId: string;
  editingPost?: Post | null;
  members: Member[];
  currentUserId: string;
}

function PostFormModal({ visible, onClose, onSuccess, token, wsId, editingPost, members, currentUserId }: PostFormModalProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeMentionField, setActiveMentionField] = useState<'title' | 'body' | null>(null);

  const titleMention = useMention(members, currentUserId);
  const bodyMention = useMention(members, currentUserId);
  const titleRef = useRef<TextInput | null>(null);
  const bodyRef = useRef<TextInput | null>(null);

  const isEditMode = !!editingPost;

  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title); setBody(editingPost.body);
      setSelectedImages([]); setUploadedUrls(editingPost.imageUrls ?? []);
    } else {
      setTitle(''); setBody(''); setSelectedImages([]); setUploadedUrls([]);
    }
  }, [editingPost, visible]);

  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && !submitting && !uploading;

  const handleSelectMention = (member: Member) => {
    if (activeMentionField === 'title') {
      titleMention.handleSelect(member, title, setTitle, titleRef);
      titleMention.setMentionQuery(null);
    } else if (activeMentionField === 'body') {
      bodyMention.handleSelect(member, body, setBody, bodyRef);
      bodyMention.setMentionQuery(null);
    }
    setActiveMentionField(null);
  };

  const handlePickImages = async () => {
    if (selectedImages.length + uploadedUrls.length >= MAX_IMAGES) {
      Alert.alert('ครบแล้ว', `แนบรูปได้สูงสุด ${MAX_IMAGES} รูปต่อโพสต์`); return;
    }
    const remaining = MAX_IMAGES - selectedImages.length - uploadedUrls.length;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] as any, allowsMultipleSelection: true, selectionLimit: remaining, quality: 0.8 });
    if (result.canceled) return;
    const valid = result.assets.filter((a) => {
      const sizeMB = (a.fileSize ?? 0) / (1024 * 1024);
      if (sizeMB > MAX_FILE_SIZE_MB) { Alert.alert('ไฟล์ใหญ่เกินไป', `${a.fileName ?? 'รูป'} มีขนาดเกิน ${MAX_FILE_SIZE_MB}MB`); return false; }
      return true;
    });
    if (valid.length === 0) return;
    setSelectedImages((prev) => [...prev, ...valid]);
  };

  const uploadImages = async (): Promise<string[]> => {
    if (selectedImages.length === 0) return uploadedUrls;
    setUploading(true);
    try {
      const formData = new FormData();
      for (const asset of selectedImages) {
        const ext = asset.uri.split('.').pop() ?? 'jpg';
        formData.append('images', { uri: asset.uri, name: asset.fileName ?? `image.${ext}`, type: `image/${ext === 'jpg' ? 'jpeg' : ext}` } as any);
      }
      formData.append('postId', `temp-${Date.now()}`);
      const res = await fetch(`${API_BASE}/api/posts/upload-images`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' }, body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const json = await res.json();
      return [...uploadedUrls, ...(json.data?.urls ?? [])];
    } finally { setUploading(false); }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      const finalImageUrls = await uploadImages();
      const url = isEditMode ? `${API_BASE}/api/posts/${editingPost!.id}` : `${API_BASE}/api/workspaces/${wsId}/posts`;
      const res = await fetch(url, { method: isEditMode ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' }, body: JSON.stringify({ title: title.trim(), body: body.trim(), imageUrls: finalImageUrls }) });
      const json = await res.json();
      if (!res.ok) { Alert.alert(res.status === 403 ? 'ไม่มีสิทธิ์' : 'เกิดข้อผิดพลาด', json.message ?? 'ไม่สามารถบันทึกได้'); return; }
      setTitle(''); setBody(''); setSelectedImages([]); setUploadedUrls([]);
      onClose(); onSuccess();
    } catch { Alert.alert('Network Error', 'ไม่สามารถเชื่อมต่อ server ได้'); }
    finally { setSubmitting(false); }
  };

  const handleClose = () => {
    const isDirty = isEditMode ? title !== editingPost?.title || body !== editingPost?.body || selectedImages.length > 0 : title.length > 0 || body.length > 0 || selectedImages.length > 0;
    if (isDirty) {
      Alert.alert('ยกเลิก?', 'ข้อมูลที่กรอกจะหายไป', [
        { text: 'อยู่ต่อ', style: 'cancel' },
        { text: 'ยกเลิก', style: 'destructive', onPress: () => { setTitle(''); setBody(''); setSelectedImages([]); setUploadedUrls([]); onClose(); } },
      ]);
    } else { onClose(); }
  };

  const totalImages = selectedImages.length + uploadedUrls.length;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <TouchableOpacity onPress={handleClose} style={{ padding: 4 }}><X size={22} color="#6b7280" /></TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{isEditMode ? 'แก้ไขประกาศ' : 'สร้างประกาศ'}</Text>
            <TouchableOpacity onPress={handleSubmit} disabled={!canSubmit} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: canSubmit ? '#425C95' : '#e5e7eb', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}>
              {submitting || uploading ? <ActivityIndicator size="small" color="#fff" /> : <Send size={14} color="#fff" />}
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{uploading ? 'กำลังอัปโหลด...' : submitting ? 'กำลังส่ง...' : isEditMode ? 'บันทึก' : 'โพสต์'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>หัวข้อ <Text style={{ color: '#ef4444' }}>*</Text><Text style={{ color: '#9ca3af', fontWeight: '400' }}> (พิมพ์ @ เพื่อแท็ก)</Text></Text>
            <TextInput ref={titleRef} value={title} onChangeText={(text) => { titleMention.handleChange(text, setTitle); setActiveMentionField('title'); }} onFocus={() => setActiveMentionField('title')} placeholder="ชื่อประกาศ..." placeholderTextColor="#d1d5db" maxLength={200} style={{ backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 4 }} />
            <Text style={{ fontSize: 11, color: '#9ca3af', textAlign: 'right', marginBottom: 8 }}>{title.length}/200</Text>
            {activeMentionField === 'title' && <MentionSuggestions suggestions={titleMention.suggestions} onSelect={handleSelectMention} />}

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 8 }}>เนื้อหา <Text style={{ color: '#ef4444' }}>*</Text><Text style={{ color: '#9ca3af', fontWeight: '400' }}> (พิมพ์ @ เพื่อแท็ก)</Text></Text>
            <TextInput ref={bodyRef} value={body} onChangeText={(text) => { bodyMention.handleChange(text, setBody); setActiveMentionField('body'); }} onFocus={() => setActiveMentionField('body')} placeholder="รายละเอียดประกาศ..." placeholderTextColor="#d1d5db" multiline textAlignVertical="top" style={{ backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#f3f4f6', minHeight: 140, marginBottom: 8 }} />
            {activeMentionField === 'body' && <MentionSuggestions suggestions={bodyMention.suggestions} onSelect={handleSelectMention} />}

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>รูปภาพ <Text style={{ color: '#9ca3af', fontWeight: '400' }}>(ไม่บังคับ)</Text></Text>
              <TouchableOpacity onPress={handlePickImages} disabled={totalImages >= MAX_IMAGES} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: totalImages >= MAX_IMAGES ? '#f3f4f6' : '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                <Camera size={14} color={totalImages >= MAX_IMAGES ? '#9ca3af' : '#425C95'} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: totalImages >= MAX_IMAGES ? '#9ca3af' : '#425C95' }}>เพิ่มรูป {totalImages > 0 ? `(${totalImages}/${MAX_IMAGES})` : ''}</Text>
              </TouchableOpacity>
            </View>

            {uploadedUrls.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {uploadedUrls.map((url, i) => (
                    <View key={`u-${i}`} style={{ position: 'relative' }}>
                      <Image source={{ uri: url }} style={{ width: 80, height: 80, borderRadius: 10, backgroundColor: '#f3f4f6' }} />
                      <TouchableOpacity onPress={() => setUploadedUrls((prev) => prev.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#ef4444', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                        <X size={12} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}

            {selectedImages.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {selectedImages.map((asset, i) => (
                    <View key={`l-${i}`} style={{ position: 'relative' }}>
                      <Image source={{ uri: asset.uri }} style={{ width: 80, height: 80, borderRadius: 10, backgroundColor: '#f3f4f6' }} />
                      <View style={{ position: 'absolute', bottom: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1 }}>
                        <Text style={{ color: '#fff', fontSize: 9 }}>รอส่ง</Text>
                      </View>
                      <TouchableOpacity onPress={() => setSelectedImages((prev) => prev.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#ef4444', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                        <X size={12} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}

            <Text style={{ fontSize: 11, color: '#9ca3af', marginBottom: 16 }}>แต่ละรูปต้องไม่เกิน {MAX_FILE_SIZE_MB}MB — รองรับ JPG, PNG, GIF</Text>
            {!isEditMode && (
              <View style={{ backgroundColor: '#eff6ff', borderRadius: 10, padding: 12, flexDirection: 'row', gap: 8 }}>
                <Text style={{ fontSize: 16 }}>ℹ️</Text>
                <Text style={{ fontSize: 12, color: '#1d4ed8', flex: 1, lineHeight: 18 }}>เฉพาะ Admin และ Owner เท่านั้นที่สามารถสร้างประกาศได้</Text>
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

  const [token, setToken] = useState('');
  const [wsId, setWsId] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [role, setRole] = useState('');

  const isAdminOrOwner = role === 'OWNER' || role === 'ADMIN';

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  // โหลดจาก params ก่อน ถ้าไม่มี fallback AsyncStorage
  useEffect(() => {
    const rawToken = params.token;
    const rawWsId = params.wsId;
    const rawUser = params.user;
    const rawRole = params.role;
    const pToken = Array.isArray(rawToken) ? rawToken[0] : (rawToken ?? '');
    const pWsId = Array.isArray(rawWsId) ? rawWsId[0] : (rawWsId ?? '');
    const pUserStr = Array.isArray(rawUser) ? rawUser[0] : (rawUser ?? '');
    const pRole = Array.isArray(rawRole) ? rawRole[0] : (rawRole ?? '');

    if (pToken && pWsId) {
      setToken(pToken);
      setWsId(pWsId);
      setRole(pRole);
      if (pUserStr) setUserData(JSON.parse(pUserStr));
      // บันทึก ลง AsyncStorage เพื่อให้ tab อื่นและ reload ใช้ได้
      AsyncStorage.setItem('token', pToken);
      AsyncStorage.setItem('wsId', pWsId);
      AsyncStorage.setItem('user', pUserStr);
      AsyncStorage.setItem('role', pRole);
      // ดึงชื่อ workspace แล้ว save ให้ tab Profile ใช้ได้
      fetch(`${API_BASE}/api/workspaces/${pWsId}`, {
        headers: { Authorization: `Bearer ${pToken}`, 'ngrok-skip-browser-warning': 'true' },
      }).then((r) => r.json()).then((json) => {
        if (json?.data?.name) AsyncStorage.setItem('wsName', json.data.name);
      }).catch(() => {});
    } else {
      // fallback: อ่านจาก AsyncStorage เมื่อ params ว่าง (เช่น reload)
      Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('wsId'),
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('role'),
      ]).then(([t, w, u, r]) => {
        if (t) setToken(t);
        if (w) setWsId(w);
        if (u) setUserData(JSON.parse(u));
        if (r) setRole(r);
      });
    }
  }, []);

  // refresh userData เมื่อกลับมาที่หน้านี้ (เช่น หลังแก้ profile)
  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem('user').then((u) => {
      if (u) setUserData(JSON.parse(u));
    });
  }, []));

  const loadPosts = useCallback(async (isRefresh = false) => {
    if (!token || !wsId) { setLoading(false); return; }
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/workspaces/${wsId}/posts?limit=50&offset=0`, { headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: PostsResponse = await res.json();
      setPosts(json.data);
    } catch { setError('ไม่สามารถโหลดโพสต์ได้ กรุณาลองใหม่'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [token, wsId]);

  const loadMembers = useCallback(async () => {
    if (!wsId || !token) return;
    try {
      const res = await fetch(`${API_BASE}/api/workspaces/${wsId}/members`, { headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' } });
      if (!res.ok) return;
      const json = await res.json();
      setMembers(json.data ?? []);
    } catch {}
  }, [wsId, token]);

  useEffect(() => { loadPosts(); loadMembers(); }, [loadPosts, loadMembers]);

  const handleEdit = (post: Post) => { setEditingPost(post); setShowForm(true); };
  const handleCloseForm = () => { setShowForm(false); setEditingPost(null); };

  const filtered = posts.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()) || p.body.toLowerCase().includes(search.toLowerCase()));
  const pinned = filtered.filter((p) => p.isPinned);
  const recent = filtered.filter((p) => !p.isPinned);

  const navigateToDetail = (post: Post) => router.push({
    pathname: '/(tabs)/post-detail',
    params: { post: JSON.stringify(post), token, wsId, currentUserId: userData?.id ?? '' },
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['top']}>
      <Header
        subtitle="Stay updated with announcements"
        userName={userData?.displayName ?? 'Your Name'}
        userEmail={userData?.email ?? ''}
        userInitials={(userData?.displayName ?? 'YO').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
        userAvatarUrl={userData?.avatarUrl ?? null}
        userRole={ROLE_LABELS[role] ?? 'Member'}
        workspaceId={wsId}
        role={role}
        token={token}
        currentUserId={userData?.id ?? ''}
      />

      <FlatList
        data={recent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadPosts(true)} tintColor="#425C95" colors={['#425C95']} />}
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
                {pinned.map((post) => <PostCard key={post.id} post={post} currentUserId={userData?.id ?? ''} isAdminOrOwner={isAdminOrOwner} token={token} onDeleted={() => loadPosts(true)} onEdit={handleEdit} onPress={() => navigateToDetail(post)} />)}
              </>
            )}
            {!loading && recent.length > 0 && (
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 12, marginTop: pinned.length > 0 ? 8 : 0 }}>Recent Announcements</Text>
            )}
          </>
        }
        renderItem={({ item }) => !loading ? <PostCard post={item} currentUserId={userData?.id ?? ''} isAdminOrOwner={isAdminOrOwner} token={token} onDeleted={() => loadPosts(true)} onEdit={handleEdit} onPress={() => navigateToDetail(item)} /> : null}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>📭</Text>
              <Text style={{ color: '#9ca3af', fontSize: 14 }}>{search ? 'ไม่พบโพสต์ที่ค้นหา' : 'ยังไม่มีประกาศ'}</Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity onPress={() => { setEditingPost(null); setShowForm(true); }} style={{ position: 'absolute', bottom: 24, right: 20, backgroundColor: '#425C95', width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: '#425C95', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 }} activeOpacity={0.85}>
        <Text style={{ color: '#fff', fontSize: 26, lineHeight: 30 }}>+</Text>
      </TouchableOpacity>

      <PostFormModal visible={showForm} onClose={handleCloseForm} onSuccess={() => loadPosts(true)} token={token} wsId={wsId} editingPost={editingPost} members={members} currentUserId={userData?.id ?? ''} />
    </SafeAreaView>
  );
}
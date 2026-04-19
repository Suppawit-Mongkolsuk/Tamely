import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Image,
  TextInput, KeyboardAvoidingView, Platform,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Pin, MessageCircle, ImageIcon, Send, Trash2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DecorativeBubble from '../../components/ui/DecBubble';

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

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: Author;
}

interface Member {
  role: string;
  user: { id: string; Name: string; email: string; avatarUrl: string | null };
}

/* ======================= CONFIG ======================= */

import { API_BASE } from '@/lib/config';

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
  return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getInitials(name: string): string {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0] ?? '').join('').toUpperCase().slice(0, 2) || '?';
}

/* ======================= AVATAR ======================= */

function Avatar({ name, size = 40, light = false }: { name: string; size?: number; light?: boolean }) {
  const colors = ['#425C95', '#7C3AED', '#059669', '#DC2626', '#D97706'];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: light ? 'rgba(255,255,255,0.25)' : colors[colorIndex],
      alignItems: 'center', justifyContent: 'center',
      borderWidth: light ? 2 : 0,
      borderColor: light ? 'rgba(255,255,255,0.5)' : 'transparent',
    }}>
      <Text style={{ color: '#fff', fontSize: size * 0.35, fontWeight: '700' }}>{getInitials(name)}</Text>
    </View>
  );
}

/* ======================= POST DETAIL SCREEN ======================= */

export default function PostDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const postStr = Array.isArray(params.post) ? params.post[0] : (params.post ?? '');
  const rawWsId = params.wsId;
  const rawCurrentUserId = params.currentUserId;

  const post: Post | null = postStr ? (() => { try { return JSON.parse(postStr); } catch { return null; } })() : null;
  const wsId = Array.isArray(rawWsId) ? rawWsId[0] : (rawWsId ?? '');
  const currentUserId = Array.isArray(rawCurrentUserId) ? rawCurrentUserId[0] : (rawCurrentUserId ?? '');

  // อ่าน token จาก AsyncStorage โดยตรง เพื่อหลีกเลี่ยงปัญหา URL encoding
  const [token, setToken] = useState('');
  const [storageLoaded, setStorageLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('token').then((t) => {
      setToken(t ?? '');
      setStorageLoaded(true);
    });
  }, []);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  /* ======================= LOAD COMMENTS ======================= */

  const loadComments = useCallback(async () => {
    if (!post || !token) return;
    try {
      setCommentsLoading(true);
      const res = await fetch(`${API_BASE}/api/posts/${post.id}/comments?limit=100&offset=0`, {
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setComments(json.data);
    } catch {
    } finally {
      setCommentsLoading(false);
    }
  }, [post?.id, token]);

  /* ======================= LOAD MEMBERS ======================= */

  const loadMembers = useCallback(async () => {
    if (!wsId || !token) return;
    try {
      const res = await fetch(`${API_BASE}/api/workspaces/${wsId}/members`, {
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
      });
      if (!res.ok) return;
      const json = await res.json();
      setMembers(json.data);
    } catch {}
  }, [wsId, token]);

  useEffect(() => {
    if (storageLoaded) {
      loadComments();
      loadMembers();
    }
  }, [storageLoaded, loadComments, loadMembers]);

  /* ======================= HANDLE TEXT INPUT + @ DETECTION ======================= */

  const handleCommentChange = (text: string) => {
    setCommentText(text);
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

  const handleSelectMention = (member: Member) => {
    const lastAt = commentText.lastIndexOf('@');
    const before = commentText.slice(0, lastAt);
    const name = member.user.Name;
    const mention = name.includes(' ') ? `@[${name}] ` : `@${name} `;
    setCommentText(before + mention);
    setMentionQuery(null);
    inputRef.current?.focus();
  };

  /* ======================= SUBMIT COMMENT ======================= */

  const handleSubmitComment = async () => {
    if (!commentText.trim() || submitting || !post) return;
    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      if (!res.ok) throw new Error();
      setCommentText('');
      setMentionQuery(null);
      loadComments();
    } catch {
      Alert.alert('เกิดข้อผิดพลาด', 'ส่ง comment ไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  /* ======================= DELETE COMMENT ======================= */

  const handleDeleteComment = (commentId: string) => {
    Alert.alert('ลบ comment?', '', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ', style: 'destructive', onPress: async () => {
          try {
            await fetch(`${API_BASE}/api/comments/${commentId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
            });
            loadComments();
          } catch {
            Alert.alert('เกิดข้อผิดพลาด', 'ลบ comment ไม่สำเร็จ');
          }
        }
      },
    ]);
  };

  /* ======================= MENTION SUGGESTIONS ======================= */

  const mentionSuggestions = mentionQuery !== null
    ? members.filter((m) =>
        m.user.Name.toLowerCase().includes(mentionQuery.toLowerCase()) &&
        m.user.id !== currentUserId
      ).slice(0, 5)
    : [];

  /* ======================= RENDER MENTION TAG ======================= */

  const renderCommentContent = (content: string) => {
    const parts = content.split(/(@\[[^\]]+\]|@\w+)/g);
    return (
      <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>
        {parts.map((part, i) =>
          part.startsWith('@') ? (
            <Text key={i} style={{ color: '#425C95', fontWeight: '700' }}>{part}</Text>
          ) : (
            <Text key={i}>{part}</Text>
          )
        )}
      </Text>
    );
  };

  if (!post) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#9ca3af' }}>ไม่พบโพสต์</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* HEADER */}
        <LinearGradient
          colors={['#152C53', '#234476', '#42639B']}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20, position: 'relative', overflow: 'hidden' }}
        >
          <DecorativeBubble size={80} top={-30} right={-20} opacity={0.08} />
          <DecorativeBubble size={40} bottom={-10} left={30} opacity={0.06} />

          <TouchableOpacity
            onPress={() => router.back()}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16, alignSelf: 'flex-start' }}
          >
            <ArrowLeft size={18} color="rgba(255,255,255,0.8)" />
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>ประกาศ</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Avatar name={post.author.Name} size={36} light />
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' }}>
                {post.author.Name}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                {timeAgo(post.createdAt)}
              </Text>
            </View>
            {post.isPinned && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 }}>
                <Pin size={11} color="rgba(255,255,255,0.8)" />
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600' }}>Pinned</Text>
              </View>
            )}
          </View>

          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', lineHeight: 28 }}>
            {post.title}
          </Text>
        </LinearGradient>

        {/* CONTENT */}
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ fontSize: 15, color: '#374151', lineHeight: 26, marginBottom: 24 }}>
            {post.body}
          </Text>

          {post.imageUrls.length > 0 && (
            <View style={{ marginBottom: 24, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <ImageIcon size={14} color="#9ca3af" />
                <Text style={{ fontSize: 13, color: '#9ca3af', fontWeight: '600' }}>
                  {`รูปภาพ (${post.imageUrls.length})`}
                </Text>
              </View>
              {post.imageUrls.map((url, index) => (
                <Image
                  key={index}
                  source={{ uri: url }}
                  style={{ width: '100%', height: 200, borderRadius: 12, backgroundColor: '#f3f4f6' }}
                  resizeMode="cover"
                />
              ))}
            </View>
          )}

          <View style={{ height: 1, backgroundColor: '#f3f4f6', marginBottom: 20 }} />

          {/* Comment count */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#f3f4f6' }}>
              <MessageCircle size={18} color="#9ca3af" />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#6b7280' }}>
                {comments.length > 0 ? `${comments.length} ความคิดเห็น` : 'ความคิดเห็น'}
              </Text>
            </View>
          </View>

          {/* Comments */}
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 }}>
            ความคิดเห็น
          </Text>

          {commentsLoading ? (
            <ActivityIndicator color="#425C95" style={{ marginVertical: 20 }} />
          ) : comments.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <MessageCircle size={28} color="#d1d5db" />
              <Text style={{ color: '#9ca3af', fontSize: 13, marginTop: 8 }}>ยังไม่มีความคิดเห็น</Text>
              <Text style={{ color: '#d1d5db', fontSize: 12, marginTop: 2 }}>เป็นคนแรกที่แสดงความคิดเห็น</Text>
            </View>
          ) : (
            comments.map((comment) => (
              <View
                key={comment.id}
                style={{ backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#f3f4f6' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Avatar name={comment.user.Name} size={28} />
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }}>{comment.user.Name}</Text>
                      <Text style={{ fontSize: 11, color: '#9ca3af' }}>{timeAgo(comment.createdAt)}</Text>
                    </View>
                  </View>
                  {comment.user.id === currentUserId && (
                    <TouchableOpacity onPress={() => handleDeleteComment(comment.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Trash2 size={15} color="#d1d5db" />
                    </TouchableOpacity>
                  )}
                </View>
                {renderCommentContent(comment.content)}
              </View>
            ))
          )}
        </ScrollView>

        {/* MENTION SUGGESTIONS */}
        {mentionSuggestions.length > 0 && (
          <View style={{ backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6', maxHeight: 180 }}>
            <ScrollView keyboardShouldPersistTaps="always">
              {mentionSuggestions.map((item) => (
                <TouchableOpacity
                  key={item.user.id}
                  onPress={() => handleSelectMention(item)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f9fafb' }}
                >
                  <Avatar name={item.user.Name} size={30} />
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }}>{item.user.Name}</Text>
                    <Text style={{ fontSize: 11, color: '#9ca3af' }}>{item.role}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* COMMENT INPUT */}
        <View style={{ backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
          <TextInput
            ref={inputRef}
            value={commentText}
            onChangeText={handleCommentChange}
            placeholder="แสดงความคิดเห็น... (พิมพ์ @ เพื่อแท็ก)"
            placeholderTextColor="#d1d5db"
            multiline
            maxLength={2000}
            style={{ flex: 1, fontSize: 14, color: '#111827', backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, maxHeight: 100, borderWidth: 1, borderColor: '#f3f4f6' }}
          />
          <TouchableOpacity
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || submitting}
            style={{ backgroundColor: commentText.trim() ? '#425C95' : '#e5e7eb', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Pin, Heart, MessageCircle, ImageIcon } from 'lucide-react-native';

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

/* ======================= POST DETAIL SCREEN ======================= */

export default function PostDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // รับ post object ที่ส่งมาจาก feed เป็น JSON string
  const postStr = Array.isArray(params.post) ? params.post[0] : (params.post ?? '');
  const post: Post | null = postStr ? JSON.parse(postStr) : null;

  // Like state — UI เท่านั้น รอ backend
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const handleLike = () => {
    // TODO: เชื่อม POST /api/posts/:id/like เมื่อ backend พร้อม
    if (liked) {
      setLiked(false);
      setLikeCount((c) => c - 1);
    } else {
      setLiked(true);
      setLikeCount((c) => c + 1);
    }
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

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', flex: 1 }} numberOfLines={1}>
          {post.title}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

        {/* Pinned badge */}
        {post.isPinned && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, alignSelf: 'flex-start', marginBottom: 16 }}>
            <Pin size={13} color="#425C95" />
            <Text style={{ fontSize: 12, color: '#425C95', fontWeight: '700' }}>Pinned Announcement</Text>
          </View>
        )}

        {/* Title */}
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#111827', lineHeight: 30, marginBottom: 16 }}>
          {post.title}
        </Text>

        {/* Author row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
          <Avatar name={post.author.Name} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{post.author.Name}</Text>
            <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{timeAgo(post.createdAt)}</Text>
          </View>
        </View>

        {/* Body */}
        <Text style={{ fontSize: 15, color: '#374151', lineHeight: 26, marginBottom: 24 }}>
          {post.body}
        </Text>

        {/* Images */}
        {post.imageUrls.length > 0 && (
          <View style={{ marginBottom: 24, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <ImageIcon size={14} color="#9ca3af" />
              <Text style={{ fontSize: 13, color: '#9ca3af', fontWeight: '600' }}>
                รูปภาพ ({post.imageUrls.length})
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

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: '#f3f4f6', marginBottom: 20 }} />

        {/* Like + Comment bar */}
        <View style={{ flexDirection: 'row', gap: 12 }}>

          {/* Like button */}
          <TouchableOpacity
            onPress={handleLike}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: liked ? '#fef2f2' : '#f9fafb', borderWidth: 1, borderColor: liked ? '#fecaca' : '#f3f4f6' }}
            activeOpacity={0.8}
          >
            <Heart
              size={20}
              color={liked ? '#ef4444' : '#9ca3af'}
              fill={liked ? '#ef4444' : 'transparent'}
            />
            <Text style={{ fontSize: 14, fontWeight: '600', color: liked ? '#ef4444' : '#6b7280' }}>
              {likeCount > 0 ? `${likeCount} ถูกใจ` : 'ถูกใจ'}
            </Text>
          </TouchableOpacity>

          {/* Comment button — disabled รอ backend */}
          <TouchableOpacity
            disabled
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#f3f4f6', opacity: 0.5 }}
          >
            <MessageCircle size={20} color="#9ca3af" />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#6b7280' }}>
              {post.commentCount > 0 ? `${post.commentCount} ความคิดเห็น` : 'ความคิดเห็น'}
            </Text>
          </TouchableOpacity>

        </View>

        {/* Coming soon note */}
        <Text style={{ fontSize: 11, color: '#d1d5db', textAlign: 'center', marginTop: 12 }}>
          ระบบ comment จะเปิดใช้งานเร็วๆ นี้
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}
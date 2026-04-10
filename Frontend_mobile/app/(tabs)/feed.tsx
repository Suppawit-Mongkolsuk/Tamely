import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal, Pin } from 'lucide-react-native';
import Header from '../../components/ui/Header';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  time: string;
  tags: string[];
  pinned?: boolean;
  views?: number;
}

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    title: 'Q1 Product Roadmap Review',
    content: 'Please review this updated Q1 roadmap. Key priorities include feature enhancements, performance optimization, and user experience improvements.',
    author: 'Sarah Johnson',
    time: '2 hours ago',
    tags: ['Engineering', 'General'],
    pinned: true,
  },
  {
    id: '2',
    title: 'Team Building Event - Friday 5PM',
    content: "Join us for a team building activity this Friday at 5PM. We'll have games, food, and fun activities. Please RSVP by Wednesday.",
    author: 'Suppawit Mongkonsuk',
    time: '2 hours ago',
    tags: ['Company-wide', 'Announcements'],
    pinned: true,
  },
  {
    id: '3',
    title: 'New Design System Components Released',
    content: 'The design team has released new components for the design system. Check out the updated documentation.',
    author: 'Suppawit Mongkonsuk',
    time: '2 hours ago',
    tags: ['Design', 'Design Systems'],
  },
  {
    id: '4',
    title: 'Security Update Required',
    content: 'All team members must complete the security training module by end of week. This is mandatory for compliance purposes.',
    author: 'IT Department',
    time: '2 days ago',
    tags: ['Company-wide', 'Security'],
    views: 156,
  },
  {
    id: '5',
    title: 'Office Closed - Public Holiday',
    content: 'The office will be closed next Monday for the public holiday. Remote work is optional. Please plan your tasks accordingly.',
    author: 'HR Team',
    time: '3 days ago',
    tags: ['Company-wide'],
    views: 203,
  },
];

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  Engineering:     { bg: '#dbeafe', text: '#1d4ed8' },
  General:         { bg: '#f3f4f6', text: '#374151' },
  'Company-wide':  { bg: '#fce7f3', text: '#be185d' },
  Announcements:   { bg: '#fef9c3', text: '#854d0e' },
  Design:          { bg: '#ede9fe', text: '#6d28d9' },
  'Design Systems':{ bg: '#ede9fe', text: '#6d28d9' },
  Security:        { bg: '#fee2e2', text: '#991b1b' },
};

function TagBadge({ tag }: { tag: string }) {
  const color = TAG_COLORS[tag] ?? { bg: '#f3f4f6', text: '#374151' };
  return (
    <View style={{ backgroundColor: color.bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99, marginRight: 6 }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: color.text }}>{tag}</Text>
    </View>
  );
}

function PostCard({ post, pinned }: { post: Post; pinned?: boolean }) {
  return (
    <TouchableOpacity
      style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: pinned ? '#e0e7ff' : '#f3f4f6',
      }}
      activeOpacity={0.8}
    >
      {pinned && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
          <Pin size={12} color="#425C95" />
          <Text style={{ fontSize: 11, color: '#425C95', fontWeight: '600' }}>Pinned</Text>
        </View>
      )}

      <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 6 }}>
        {post.title}
      </Text>
      <Text style={{ fontSize: 13, color: '#6b7280', lineHeight: 20, marginBottom: 10 }} numberOfLines={3}>
        {post.content}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
        {post.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 12, color: '#9ca3af' }}>
          By {post.author}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {post.views && (
            <Text style={{ fontSize: 12, color: '#9ca3af' }}>{post.views} views</Text>
          )}
          <Text style={{ fontSize: 12, color: '#9ca3af' }}>{post.time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function FeedScreen() {
  const [search, setSearch] = useState('');

  const pinned = MOCK_POSTS.filter((p) => p.pinned);
  const recent = MOCK_POSTS.filter((p) => !p.pinned);

  const filtered = (posts: Post[]) =>
    posts.filter((p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <Header subtitle="Stay updated with announcements" />

      <FlatList
        data={[...filtered(pinned), ...filtered(recent)]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <>
            {/* Search + Filter */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: '#f3f4f6',
                  gap: 8,
                }}
              >
                <Search size={16} color="#9ca3af" />
                <TextInput
                  placeholder="Search announcements..."
                  placeholderTextColor="#d1d5db"
                  value={search}
                  onChangeText={setSearch}
                  style={{ flex: 1, fontSize: 14, color: '#111827' }}
                />
              </View>
              <TouchableOpacity
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: '#f3f4f6',
                }}
              >
                <SlidersHorizontal size={18} color="#425C95" />
              </TouchableOpacity>
            </View>

            {/* Pinned Section */}
            {filtered(pinned).length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Pin size={14} color="#425C95" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#425C95' }}>
                  Pinned Announcements
                </Text>
              </View>
            )}
            {filtered(pinned).map((post) => (
              <PostCard key={post.id} post={post} pinned />
            ))}

            {/* Recent Section */}
            {filtered(recent).length > 0 && (
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 12, marginTop: 4 }}>
                Recent Announcements
              </Text>
            )}
          </>
        }
        renderItem={({ item }) => <PostCard post={item} />}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: '#9ca3af', marginTop: 40 }}>
            ไม่พบโพสต์
          </Text>
        }
      />

      {/* ปุ่ม + สร้างโพสต์ */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 24,
          right: 20,
          backgroundColor: '#425C95',
          width: 52,
          height: 52,
          borderRadius: 26,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontSize: 28, lineHeight: 32 }}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
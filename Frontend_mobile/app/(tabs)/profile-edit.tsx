import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Image, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, Crown, Shield, Star, User } from 'lucide-react-native';

const API_BASE = 'https://ineffectual-marian-nonnattily.ngrok-free.dev';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MODERATOR: 'Moderator',
  MEMBER: 'Member',
};

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  OWNER: { bg: '#fef3c7', text: '#92400e' },
  ADMIN: { bg: '#ede9fe', text: '#5b21b6' },
  MODERATOR: { bg: '#dbeafe', text: '#1e40af' },
  MEMBER: { bg: '#f3f4f6', text: '#374151' },
};

const RoleIcon = ({ role }: { role: string }) => {
  const size = 14;
  if (role === 'OWNER') return <Crown size={size} color="#92400e" />;
  if (role === 'ADMIN') return <Shield size={size} color="#5b21b6" />;
  if (role === 'MODERATOR') return <Star size={size} color="#1e40af" />;
  return <User size={size} color="#374151" />;
};

function getInitials(name: string): string {
  if (!name) return 'YO';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function ProfileEditScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [token, setToken] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [wsName, setWsName] = useState('');

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const t = await AsyncStorage.getItem('token') ?? '';
        const r = await AsyncStorage.getItem('role') ?? 'MEMBER';
        const ws = await AsyncStorage.getItem('wsName') ?? '';
        const u = await AsyncStorage.getItem('user');
        setToken(t);
        setRole(r);
        setWsName(ws);
        if (u) {
          const user = JSON.parse(u);
          setDisplayName(user.displayName ?? '');
          setEmail(user.email ?? '');
          setBio(user.bio ?? '');
          setAvatarUrl(user.avatarUrl ?? null);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: asset.uri,
        name: asset.fileName ?? 'avatar.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      } as any);

      const res = await fetch(`${API_BASE}/api/auth/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: formData,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }
      const data = await res.json();
      // Backend ส่งกลับมาเป็น { success: true, data: { displayName, avatarUrl, bio } }
      const newUrl = data.data?.avatarUrl ?? data.avatarUrl ?? asset.uri;
      setAvatarUrl(newUrl);

      // update AsyncStorage
      const u = await AsyncStorage.getItem('user');
      if (u) {
        const user = JSON.parse(u);
        await AsyncStorage.setItem('user', JSON.stringify({ ...user, avatarUrl: newUrl }));
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to upload avatar. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Validation', 'Display name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ displayName: displayName.trim(), bio: bio.trim() }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }
      const data = await res.json();
      // Backend ส่งกลับมาเป็น { success: true, data: { displayName, avatarUrl, bio } }
      const updated = data.data ?? data;

      // update AsyncStorage
      const u = await AsyncStorage.getItem('user');
      if (u) {
        const user = JSON.parse(u);
        await AsyncStorage.setItem('user', JSON.stringify({
          ...user,
          displayName: updated.displayName ?? displayName.trim(),
          bio: updated.bio ?? bio.trim(),
        }));
      }

      Alert.alert('Saved', 'Profile updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#425C95" />;

  const roleStyle = ROLE_COLORS[role] ?? ROLE_COLORS.MEMBER;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['top']}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827' }}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={{ paddingHorizontal: 4 }}>
          {saving
            ? <ActivityIndicator size="small" color="#425C95" />
            : <Text style={{ fontSize: 15, fontWeight: '700', color: '#425C95' }}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Avatar */}
        <View style={{ alignItems: 'center', paddingVertical: 32, backgroundColor: '#fff', marginBottom: 16 }}>
          <TouchableOpacity onPress={handlePickAvatar} disabled={uploadingAvatar} activeOpacity={0.85}>
            <View style={{ width: 96, height: 96, borderRadius: 48 }}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{ width: 96, height: 96, borderRadius: 48 }}
                />
              ) : (
                <View style={{
                  width: 96, height: 96, borderRadius: 48,
                  backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ color: '#fff', fontSize: 32, fontWeight: '700' }}>
                    {getInitials(displayName)}
                  </Text>
                </View>
              )}
              {/* Camera overlay */}
              <View style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center',
                borderWidth: 2, borderColor: '#fff',
              }}>
                {uploadingAvatar
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Camera size={13} color="#fff" />
                }
              </View>
            </View>
          </TouchableOpacity>
          <Text style={{ marginTop: 10, fontSize: 13, color: '#6b7280' }}>
            Tap to change photo
          </Text>
        </View>

        {/* Form */}
        <View style={{ backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, overflow: 'hidden' }}>
          {/* Display Name */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#9ca3af', marginBottom: 6 }}>DISPLAY NAME</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor="#d1d5db"
              maxLength={50}
              style={{ fontSize: 16, color: '#111827', paddingVertical: 4 }}
            />
          </View>

          {/* Email (read-only) */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#9ca3af', marginBottom: 6 }}>EMAIL</Text>
            <Text style={{ fontSize: 16, color: '#9ca3af' }}>{email}</Text>
            <Text style={{ fontSize: 11, color: '#d1d5db', marginTop: 4 }}>Email cannot be changed</Text>
          </View>

          {/* Bio */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#9ca3af', marginBottom: 6 }}>BIO</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us a little about yourself..."
              placeholderTextColor="#d1d5db"
              multiline
              maxLength={200}
              style={{ fontSize: 15, color: '#111827', minHeight: 72, textAlignVertical: 'top', paddingVertical: 4 }}
            />
            <Text style={{ fontSize: 11, color: '#d1d5db', marginTop: 6, textAlign: 'right' }}>
              {bio.length}/200
            </Text>
          </View>
        </View>

        {/* Role in Workspace */}
        {wsName ? (
          <View style={{ backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#9ca3af', marginBottom: 10 }}>
              ROLE IN {wsName.toUpperCase()}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 5,
                backgroundColor: roleStyle.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
              }}>
                <RoleIcon role={role} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: roleStyle.text }}>
                  {ROLE_LABELS[role] ?? 'Member'}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: '#9ca3af' }}>Role is managed by workspace admin</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
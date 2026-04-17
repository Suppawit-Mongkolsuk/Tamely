import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft, User, Lock, Bell, BellRing, HelpCircle,
  LogOut, ChevronRight, Sparkles, Wand2
} from 'lucide-react-native';
import { unregisterPushToken, NOTIF_KEYS, AI_KEYS } from '../../hooks/useNotifications';

function getInitials(name: string): string {
  if (!name) return 'YO';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

const MenuIcon = ({ icon: Icon, color, bgColor }: any) => (
  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center' }}>
    <Icon size={18} color={color} />
  </View>
);

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [dmEnabled, setDmEnabled] = useState(true);
  const [autoSumEnabled, setAutoSumEnabled] = useState(true);
  const [smartSugEnabled, setSmartSugEnabled] = useState(true);
  // refresh รูป/ชื่อ เมื่อกลับมาจากหน้า profile-edit
  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem('user').then((u) => {
      if (u) setUserData(JSON.parse(u));
    });
  }, []));

  useEffect(() => {
    const loadData = async () => {
      try {
        const u = await AsyncStorage.getItem('user');
        if (u) setUserData(JSON.parse(u));

        const pushRaw = await AsyncStorage.getItem(NOTIF_KEYS.push);
        const dmRaw = await AsyncStorage.getItem(NOTIF_KEYS.dm);
        const sumRaw = await AsyncStorage.getItem(AI_KEYS.autoSummarize);
        const sugRaw = await AsyncStorage.getItem(AI_KEYS.smartSuggest);
        if (pushRaw !== null) setPushEnabled(pushRaw !== 'false');
        if (dmRaw !== null) setDmEnabled(dmRaw !== 'false');
        if (sumRaw !== null) setAutoSumEnabled(sumRaw !== 'false');
        if (sugRaw !== null) setSmartSugEnabled(sugRaw !== 'false');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handlePushToggle = async (val: boolean) => {
    setPushEnabled(val);
    await AsyncStorage.setItem(NOTIF_KEYS.push, String(val));
  };

  const handleDmToggle = async (val: boolean) => {
    setDmEnabled(val);
    await AsyncStorage.setItem(NOTIF_KEYS.dm, String(val));
  };

  const handleAutoSumToggle = async (val: boolean) => {
    setAutoSumEnabled(val);
    await AsyncStorage.setItem(AI_KEYS.autoSummarize, String(val));
  };

  const handleSmartSugToggle = async (val: boolean) => {
    setSmartSugEnabled(val);
    await AsyncStorage.setItem(AI_KEYS.smartSuggest, String(val));
  };

  const handleLogOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          // ลบ push token ออกจาก server ก่อน logout
          // เพื่อไม่ให้ส่ง notification หลัง logout
          await unregisterPushToken();
          await AsyncStorage.clear();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#425C95" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={22} color="#111827" /></TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', marginLeft: 12 }}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile-edit' as any)} style={{ margin: 20, padding: 16, backgroundColor: '#f5f7ff', borderRadius: 16, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {userData?.avatarUrl
              ? <Image source={{ uri: userData.avatarUrl }} style={{ width: 56, height: 56, borderRadius: 28 }} />
              : <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>{getInitials(userData?.displayName || 'YO')}</Text>
            }
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>{userData?.displayName || 'Your Name'}</Text>
            <Text style={{ fontSize: 13, color: '#6b7280' }}>{userData?.email || 'your.email@company.com'}</Text>
            <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Active now</Text>
          </View>
          <ChevronRight size={20} color="#d1d5db" />
        </TouchableOpacity>

        <Text style={{ fontSize: 12, fontWeight: '700', color: '#9ca3af', marginHorizontal: 20, marginTop: 10, marginBottom: 8 }}>ACCOUNT</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile-edit' as any)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20 }}>
          <MenuIcon icon={User} color="#3b82f6" bgColor="#eff6ff" />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontWeight: '600', color: '#111827' }}>Profile</Text>
            <Text style={{ fontSize: 12, color: '#9ca3af' }}>Edit your personal information</Text>
          </View>
          <ChevronRight size={18} color="#d1d5db" />
        </TouchableOpacity>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20 }}>
          <MenuIcon icon={Lock} color="#ec4899" bgColor="#fdf2f8" />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontWeight: '600', color: '#111827' }}>Privacy & Security</Text>
            <Text style={{ fontSize: 12, color: '#9ca3af' }}>Manage your data and permissions</Text>
          </View>
          <ChevronRight size={18} color="#d1d5db" />
        </TouchableOpacity>

        <Text style={{ fontSize: 12, fontWeight: '700', color: '#9ca3af', marginHorizontal: 20, marginTop: 20, marginBottom: 8 }}>NOTIFICATIONS</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20 }}>
          <MenuIcon icon={BellRing} color="#10b981" bgColor="#ecfdf5" />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontWeight: '600' }}>Push Notifications</Text>
            <Text style={{ fontSize: 12, color: '#9ca3af' }}>Receive alerts for new messages</Text>
          </View>
          <Switch value={pushEnabled} onValueChange={handlePushToggle} trackColor={{ true: '#111827' }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20 }}>
          <MenuIcon icon={Bell} color="#eab308" bgColor="#fefce8" />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontWeight: '600' }}>Direct Messages</Text>
            <Text style={{ fontSize: 12, color: '#9ca3af' }}>Get notified for DMs</Text>
          </View>
          <Switch value={dmEnabled} onValueChange={handleDmToggle} trackColor={{ true: '#111827' }} />
        </View>

        <Text style={{ fontSize: 12, fontWeight: '700', color: '#9ca3af', marginHorizontal: 20, marginTop: 20, marginBottom: 8 }}>AI ASSISTANT</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20 }}>
          <MenuIcon icon={Sparkles} color="#8b5cf6" bgColor="#f5f3ff" />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontWeight: '600' }}>Auto-Summarize</Text>
            <Text style={{ fontSize: 12, color: '#9ca3af' }}>Summarize long conversations</Text>
          </View>
          <Switch value={autoSumEnabled} onValueChange={handleAutoSumToggle} trackColor={{ true: '#111827' }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20 }}>
          <MenuIcon icon={Wand2} color="#8b5cf6" bgColor="#f5f3ff" />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontWeight: '600' }}>Smart Suggestions</Text>
            <Text style={{ fontSize: 12, color: '#9ca3af' }}>Get AI-powered recommendations</Text>
          </View>
          <Switch value={smartSugEnabled} onValueChange={handleSmartSugToggle} trackColor={{ true: '#111827' }} />
        </View>

        <Text style={{ fontSize: 12, fontWeight: '700', color: '#9ca3af', marginHorizontal: 20, marginTop: 20, marginBottom: 8 }}>HELP & SUPPORT</Text>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20 }}>
          <MenuIcon icon={HelpCircle} color="#f97316" bgColor="#fff7ed" />
          <View style={{ flex: 1, marginLeft: 14 }}><Text style={{ fontWeight: '600' }}>Help Center</Text></View>
          <ChevronRight size={18} color="#d1d5db" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogOut}
          style={{ margin: 20, padding: 14, backgroundColor: '#fff1f2', borderRadius: 12, borderWidth: 1, borderColor: '#fca5a5', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}
        >
          <LogOut size={18} color="#ef4444" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#ef4444' }}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={{ textAlign: 'center', fontSize: 11, color: '#d1d5db', marginBottom: 30 }}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
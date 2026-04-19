import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert, ActivityIndicator, Image, Modal, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft, User, Bell, BellRing, HelpCircle,
  LogOut, ChevronRight, Sparkles, Wand2, Settings,
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
  const params = useLocalSearchParams<{ wsId?: string; token?: string; role?: string; wsName?: string }>();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [wsId, setWsId] = useState('');
  const [token, setToken] = useState('');
  const [wsRole, setWsRole] = useState('');
  const [wsName, setWsName] = useState('');

  const [myPermissions, setMyPermissions] = useState<string[]>([]);
  const isAdminOrOwner = myPermissions.includes('MANAGE_WORKSPACE') || myPermissions.includes('MANAGE_MEMBERS') || wsRole === 'OWNER' || wsRole === 'ADMIN';

  const [helpVisible, setHelpVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    const pairs = await AsyncStorage.multiGet(['user', 'token', 'wsId', 'role', 'wsName', 'myPermissions']);
    const map = Object.fromEntries(pairs.map(([k, v]) => [k, v ?? '']));
    if (map['user']) try { setUserData(JSON.parse(map['user'])); } catch {}
    setToken(map['token']);
    setWsId(map['wsId']);
    setWsRole(map['role']);
    setWsName(map['wsName']);
    if (map['myPermissions']) try { setMyPermissions(JSON.parse(map['myPermissions'])); } catch {}
    setRefreshing(false);
  };

  const [pushEnabled, setPushEnabled] = useState(true);
  const [dmEnabled, setDmEnabled] = useState(true);
  const [autoSumEnabled, setAutoSumEnabled] = useState(true);
  const [smartSugEnabled, setSmartSugEnabled] = useState(true);

  // refresh รูป/ชื่อ และ ws context เมื่อกลับมาที่ tab นี้
  useFocusEffect(useCallback(() => {
    // feed.tsx บันทึก key: 'token', 'wsId', 'role', 'user', 'wsName'
    AsyncStorage.multiGet(['user', 'token', 'wsId', 'role', 'wsName', 'myPermissions']).then((pairs) => {
      const map = Object.fromEntries(pairs.map(([k, v]) => [k, v ?? '']));
      if (map['user']) try { setUserData(JSON.parse(map['user'])); } catch {}
      setToken(map['token']);
      setWsId(map['wsId']);
      setWsRole(map['role']);
      setWsName(map['wsName']);
      if (map['myPermissions']) try { setMyPermissions(JSON.parse(map['myPermissions'])); } catch {}
    });
  }, []));

  useEffect(() => {
    const loadData = async () => {
      try {
        const u = await AsyncStorage.getItem('user');
        if (u) setUserData(JSON.parse(u));

        // โหลด ws context — feed.tsx บันทึก key: 'token', 'wsId', 'role', 'wsName'
        const wsIdVal = params.wsId || await AsyncStorage.getItem('wsId') || '';
        const tokenVal = params.token || await AsyncStorage.getItem('token') || '';
        const roleVal = params.role || await AsyncStorage.getItem('role') || '';
        const nameVal = params.wsName || await AsyncStorage.getItem('wsName') || '';
        setWsId(wsIdVal);
        setToken(tokenVal);
        setWsRole(roleVal);
        setWsName(nameVal);

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
    try {
      await AsyncStorage.setItem(NOTIF_KEYS.push, String(val));
    } catch {
      setPushEnabled(!val);
    }
  };

  const handleDmToggle = async (val: boolean) => {
    setDmEnabled(val);
    try {
      await AsyncStorage.setItem(NOTIF_KEYS.dm, String(val));
    } catch {
      setDmEnabled(!val);
    }
  };

  const handleAutoSumToggle = async (val: boolean) => {
    setAutoSumEnabled(val);
    try {
      await AsyncStorage.setItem(AI_KEYS.autoSummarize, String(val));
    } catch {
      setAutoSumEnabled(!val);
    }
  };

  const handleSmartSugToggle = async (val: boolean) => {
    setSmartSugEnabled(val);
    try {
      await AsyncStorage.setItem(AI_KEYS.smartSuggest, String(val));
    } catch {
      setSmartSugEnabled(!val);
    }
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

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#425C95']} />}>
        <TouchableOpacity onPress={() => router.push('/(screensDetail)/profile-edit' as any)} style={{ margin: 20, padding: 16, backgroundColor: '#f5f7ff', borderRadius: 16, flexDirection: 'row', alignItems: 'center' }}>
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
        <TouchableOpacity onPress={() => router.push('/(screensDetail)/profile-edit' as any)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20 }}>
          <MenuIcon icon={User} color="#3b82f6" bgColor="#eff6ff" />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontWeight: '600', color: '#111827' }}>Profile</Text>
            <Text style={{ fontSize: 12, color: '#9ca3af' }}>Edit your personal information</Text>
          </View>
          <ChevronRight size={18} color="#d1d5db" />
        </TouchableOpacity>
        {isAdminOrOwner && (
          <TouchableOpacity
            onPress={() => router.push({
              pathname: '/(screensDetail)/workspace-management',
              params: { wsId, token, role: wsRole, wsName },
            })}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20 }}
          >
            <MenuIcon icon={Settings} color="#425C95" bgColor="#eff6ff" />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontWeight: '600', color: '#111827' }}>Workspace Management</Text>
              <Text style={{ fontSize: 12, color: '#9ca3af' }}>จัดการสมาชิก ห้อง และตั้งค่า workspace</Text>
            </View>
            <ChevronRight size={18} color="#d1d5db" />
          </TouchableOpacity>
        )}

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
        <TouchableOpacity onPress={() => setHelpVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20 }}>
          <MenuIcon icon={HelpCircle} color="#f97316" bgColor="#fff7ed" />
          <View style={{ flex: 1, marginLeft: 14 }}><Text style={{ fontWeight: '600' }}>Help Center</Text></View>
          <ChevronRight size={18} color="#d1d5db" />
        </TouchableOpacity>

        <Modal visible={helpVisible} animationType="slide" transparent onRequestClose={() => setHelpVisible(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center' }}>
                    <HelpCircle size={20} color="#f97316" />
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>Help Center</Text>
                </View>
                <TouchableOpacity onPress={() => setHelpVisible(false)} style={{ padding: 4 }}>
                  <Text style={{ fontSize: 22, color: '#9ca3af', lineHeight: 24 }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                {[
                  {
                    emoji: '💬',
                    title: 'การส่งข้อความ',
                    body: 'แตะที่ห้องแชทหรือ DM เพื่อเริ่มบทสนทนา พิมพ์ข้อความแล้วกดปุ่มส่ง ระบบรองรับการพิมพ์หลายบรรทัด',
                  },
                  {
                    emoji: '🔔',
                    title: 'การแจ้งเตือน',
                    body: 'เปิด/ปิด Push Notification และ DM ได้ที่หน้า Settings → Notifications ระบบจะส่งแจ้งเตือนเมื่อมีคนกล่าวถึงคุณหรือส่ง DM',
                  },
                  {
                    emoji: '🤖',
                    title: 'AI Assistant',
                    body: 'ใช้ AI Chat ที่แท็บ AI เพื่อถามคำถามหรือขอสรุปบทสนทนา เปิดใช้ Auto-Summarize เพื่อให้ AI สรุปให้อัตโนมัติ',
                  },
                  {
                    emoji: '🏢',
                    title: 'Workspace',
                    body: 'สร้างหรือเข้าร่วม Workspace ด้วย Invite Code ที่ได้รับจากผู้ดูแล สมาชิกสามารถดูห้องแชทและโพสต์ภายใน Workspace ได้',
                  },
                  {
                    emoji: '📢',
                    title: 'Feed & ประกาศ',
                    body: 'ดูโพสต์ประกาศของทีมได้ที่แท็บ Feed สามารถคอมเมนต์และรีแอคชันได้ โพสต์ที่ปักหมุดจะแสดงด้านบนเสมอ',
                  },
                  {
                    emoji: '👤',
                    title: 'แก้ไขโปรไฟล์',
                    body: 'กดที่รูปโปรไฟล์ด้านบนหน้า Settings เพื่อเปลี่ยนชื่อ รูปภาพ และข้อมูลส่วนตัว',
                  },
                  {
                    emoji: '📞',
                    title: 'การโทร',
                    body: 'กดปุ่มโทรในหน้า DM เพื่อเริ่มการโทรด้วยเสียง ระบบรองรับการโทรแบบ 1-ต่อ-1 ผ่านอินเทอร์เน็ต',
                  },
                ].map((item) => (
                  <View key={item.title} style={{ marginBottom: 16, backgroundColor: '#f9fafb', borderRadius: 14, padding: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 }}>
                      <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{item.title}</Text>
                    </View>
                    <Text style={{ fontSize: 13, color: '#6b7280', lineHeight: 20 }}>{item.body}</Text>
                  </View>
                ))}

                <View style={{ backgroundColor: '#f0f4ff', borderRadius: 14, padding: 16, marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#425C95', marginBottom: 4 }}>📧 ติดต่อทีมพัฒนา</Text>
                  <Text style={{ fontSize: 13, color: '#6b7280', lineHeight: 20 }}>หากพบปัญหาหรือต้องการความช่วยเหลือเพิ่มเติม ติดต่อได้ที่{'\n'}support@tamely.app</Text>
                </View>

                <View style={{ height: 30 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>

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
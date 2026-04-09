import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, TextInput,
  FlatList, ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Search, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import WorkspaceCard from '../../components/ui/WorkspaceCard';
import DecorativeBubble from '../../components/ui/DecBubble';

interface WorkspaceData {
  id: string;
  name: string;
  iconUrl?: string | null;
  memberCount?: number;
  role?: string;
}

const API_BASE = 'https://ineffectual-marian-nonnattily.ngrok-free.dev';

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export default function WorkspaceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const rawToken = params.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : (rawToken ?? '');

  const fetchWorkspaces = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetchWithTimeout(
        `${API_BASE}/api/workspaces`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        }
      );

      const raw = await response.text();
      const result = JSON.parse(raw);

      if (response.ok) {
        setWorkspaces(result.data || result);
      } else {
        Alert.alert('Error', result.error ?? 'โหลด Workspace ไม่สำเร็จ');
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        Alert.alert('Timeout', 'เชื่อมต่อ Server นานเกินไป กรุณาลองใหม่');
      } else {
        Alert.alert('Error', 'ไม่สามารถโหลดข้อมูล Workspace ได้');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [token]);

  const handleCreateWorkspace = async () => {
    Alert.prompt(
      'Create New Workspace',
      'Enter workspace name',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async (name?: string) => {
            if (!name) return;
            try {
              const res = await fetchWithTimeout(
                `${API_BASE}/api/workspaces`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true',
                  },
                  body: JSON.stringify({ name }),
                }
              );
              if (res.ok) {
                fetchWorkspaces();
              }
            } catch (err) {
              Alert.alert('Error', 'สร้าง Workspace ไม่สำเร็จ');
            }
          },
        },
      ]
    );
  };

  const filteredWorkspaces = workspaces.filter((ws: WorkspaceData) =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>

      {/* ส่วน Header แบบ Figma */}
      <LinearGradient
        colors={['#1e3a5f', '#2d5087', '#425C95']}
        style={{
          height: 180,          // กำหนด height ตายตัว
          paddingHorizontal: 24,
          position: 'relative',
        }}
      >
        <DecorativeBubble size={35} top={-5} right={-8} opacity={0.12} />
        <DecorativeBubble size={20} top={5}  right={10} opacity={0.07} />

        {/* Logo วาง absolute ซ้ายบน */}
        <Image
          source={require('../../assets/images/TeamlyImage/TeamlyLogo.png')}
          style={{
            position: 'absolute',
            top: -100,
            left: -50,
            width: 300,
            height: 330,
          }}
          resizeMode="contain"
        />

        {/* Logout วาง absolute ขวาบน */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 20,
            right: 24,
            backgroundColor: 'rgba(255,255,255,0.15)',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 999,
          }}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
            Logout
          </Text>
        </TouchableOpacity>

        {/* Title + Subtitle วาง absolute ล่างซ้าย */}
        <Text style={{
          position: 'absolute',
          bottom: 32,
          left: 24,
          fontSize: 28,
          fontWeight: '800',
          color: '#fff',
          marginBottom: 6,
        }}>
          Choose a Workspace
        </Text>
        <Text style={{
          position: 'absolute',
          bottom: 10,
          left: 24,
          color: 'rgba(255,255,255,0.7)',
          fontSize: 14,
        }}>
          Select a workspace to continue or start a new one
        </Text>
      </LinearGradient>

      {/* ส่วน Content ด้านล่าง */}
      <View className="flex-1 px-6 pt-6">

        {/* ปุ่มด้านบน: Join และ New */}
        <View className="flex-row gap-4 mb-8">
          <TouchableOpacity
            className="flex-1 bg-white border-2 border-dashed border-blue-200 rounded-3xl p-6 items-center justify-center shadow-sm"
            onPress={() => router.push('/(workspace)/enter-code')}
          >
            <View className="w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center mb-3">
              <Search size={24} color="#425C95" />
            </View>
            <Text className="font-bold text-[#425C95]">Join with Code</Text>
            <Text className="text-xs text-gray-400 mt-1">Enter invite code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-green-50 border-2 border-dashed border-green-200 rounded-3xl p-6 items-center justify-center shadow-sm"
            onPress={handleCreateWorkspace}
          >
            <View className="w-12 h-12 bg-green-100 rounded-2xl items-center justify-center mb-3">
              <Plus size={24} color="#16a34a" />
            </View>
            <Text className="font-bold text-green-700">New Workspace</Text>
            <Text className="text-xs text-gray-400 mt-1">Create your own</Text>
          </TouchableOpacity>
        </View>

        {/* ช่อง Search */}
        <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-3 mb-6 border border-gray-100">
          <Search size={20} color="#9ca3af" />
          <TextInput
            placeholder="Search workspaces..."
            className="flex-1 ml-3 text-gray-700"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* ส่วนแสดงรายการข้อมูลจริง */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#425C95" className="mt-10" />
        ) : (
          <FlatList
            data={filteredWorkspaces}
            keyExtractor={(item) => item.id}
            renderItem={({ item }: { item: WorkspaceData }) => (
              <WorkspaceCard
                id={item.id}
                name={item.name}
                imageUrl={item.iconUrl}
                memberCount={item.memberCount || 0}
                lastActive="Active now"
                isAdmin={item.role === 'OWNER' || item.role === 'ADMIN'}
                onPress={(id) =>
                  router.push({
                    pathname: '/(tabs)/feed',
                    params: { workspaceId: id },
                  })
                }
              />
            )}
            ListEmptyComponent={
              <Text className="text-center text-gray-400 mt-10">
                ยังไม่มี Workspaceหรอ สร้างสิ
              </Text>
            }
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => {
                  setIsRefreshing(true);
                  fetchWorkspaces();
                }}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
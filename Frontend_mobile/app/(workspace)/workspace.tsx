import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, FlatList, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Search, Plus } from 'lucide-react-native';
import WorkspaceCard from '../../components/ui/WorkspaceCard';
import DecorativeBubble from '../../components/ui/DecBubble';

interface WorkspaceData {
  id: string;
  name: string;
  iconUrl?: string | null;
  memberCount?: number;
  role?: string;
}

export default function WorkspaceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // 1. สถานะสำหรับเก็บข้อมูลจริงจาก Backend
  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ดึง user และ token มาจาก params
  const token = (params.token as string) ?? '';

  // 2. ฟังก์ชันดึงข้อมูลจาก Backend
  const fetchWorkspaces = async () => {
    if (!token) return;

    try {
      const response = await fetch('http://10.0.2.2:8080/api/workspaces', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (response.ok) {
        setWorkspaces(result.data || result);
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      Alert.alert('Error', 'ไม่สามารถโหลดข้อมูล Workspace ได้');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [token]);

  // 3. ฟังก์ชันสร้าง Workspace ใหม่ (กรณีอยากกดสร้างแล้วโชว์ทันที)
  const handleCreateWorkspace = async () => {
    Alert.prompt(
      "Create New Workspace",
      "Enter workspace name",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Create",
          onPress: async (name?: string) => {
            if (!name) return;
            try {
              const res = await fetch('http://10.0.2.2:8080/api/workspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name })
              });
              if (res.ok) {
                fetchWorkspaces(); // บังคับรีโหลดข้อมูลใหม่หลังจากสร้างเสร็จ
              }
            } catch (err) {
              Alert.alert("Error", "สร้าง Workspace ไม่สำเร็จ");
            }
          }
        }
      ]
    );
  };

  const filteredWorkspaces = workspaces.filter((ws: WorkspaceData) =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <DecorativeBubble size={60} top={-15} right={-10} opacity={0.08} />
      <DecorativeBubble size={40} top={10} right={-20} opacity={0.04} />

      {/* ส่วน Header */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
        <Image source={require('../../assets/images/TeamlyImage/TeamlyLogo.png')} className="w-28 h-8" resizeMode="contain"/>

        <TouchableOpacity 
          className="bg-gray-100 px-3 py-1.5 rounded-full"
          onPress={() => router.replace('/(auth)/login')}>
            <Text className="text-gray-500 text-xs font-bold">Logout</Text>
          </TouchableOpacity>
      </View>

      <View className="flex-1 px-6">
        <Text className="text-3xl font-extrabold text-[#425C95] mt-6 mb-2">
          Choose a Workspace
        </Text>
        <Text className="text-gray-500 mb-8">
          Select a workspace to continue or start a new one
        </Text>

        {/* ปุ่มด้านบน: Join และ New */}
        <View className="flex-row gap-4 mb-8">
          <TouchableOpacity 
            className="flex-1 bg-white border-2 border-dashed border-blue-200 rounded-3xl p-6 items-center justify-center shadow-sm"
            onPress={() => router.push('/(auth)/enter-code')}
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
                onPress={(id) => router.push({ pathname: '/(tabs)/feed', params: { workspaceId: id } })}
              />
            )}
            ListEmptyComponent={
              <Text className="text-center text-gray-400 mt-10">ยังไม่มี Workspace</Text>
            }
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={() => {
                setIsRefreshing(true);
                fetchWorkspaces();
              }} />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
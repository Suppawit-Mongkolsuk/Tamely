import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Users, Clock, Shield, ChevronRight, Building2 } from 'lucide-react-native';

interface WorkspaceCardProps {
  id: string;
  name: string;
  imageUrl?: string | null;
  memberCount: number;
  lastActive: string;
  planType?: 'Pro' | 'Enterprise' | null;
  isAdmin?: boolean;
  unreadCount?: number;
  onPress: (id: string) => void;
}

export default function WorkspaceCard({
  id,
  name,
  imageUrl,
  memberCount,
  lastActive,
  planType,
  isAdmin,
  unreadCount,
  onPress,
}: WorkspaceCardProps) {
  
  return (
    <TouchableOpacity
      onPress={() => onPress(id)}
      activeOpacity={0.7}
      className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 flex-row items-center shadow-sm">
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} className="w-14 h-14 rounded-xl mr-4 bg-gray-100" resizeMode="cover" />
      ) : (
        <View className="w-14 h-14 rounded-xl mr-4 bg-blue-50 items-center justify-center">
          <Building2 size={28} color="#425C95" />
        </View>
      )}

      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          <Text className="text-lg font-bold text-gray-800 mr-2" numberOfLines={1}>
            {name ?? ''}
          </Text>
          {planType && (
            <View className="bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              <Text className="text-blue-600 text-[10px] font-bold uppercase">{planType}</Text>
            </View>
          )}
        </View>

        {/*จำนวน USER*/}
        <View className="flex-row items-center mb-2">
          <Users size={12} color="#9ca3af" />
          <Text className="text-gray-400 text-xs ml-1 mr-3">{`${memberCount ?? 0} members`}</Text>
          
          {/*เวลาที่ใช้งานล่าสุด*/}
          <Clock size={12} color="#9ca3af" />
          <Text className="text-gray-400 text-xs ml-1">{lastActive}</Text>
        </View>

        {(!!isAdmin || (!!unreadCount && unreadCount > 0)) && (
          <View className="flex-row items-center mt-1">
            {isAdmin && (
              <View className="flex-row items-center bg-blue-50 border border-blue-100 px-2 py-1 rounded-full mr-2">
                <Shield size={12} color="#3b82f6" />
                <Text className="text-blue-500 text-xs font-medium ml-1">Admin</Text>
              </View>
            )}
            
            {unreadCount !== undefined && unreadCount > 0 && (
              <View className="bg-[#425C95] px-2 py-1 rounded-full">
                <Text className="text-white text-xs font-bold">{`${unreadCount} unread`}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <ChevronRight size={20} color="#d1d5db" />
    </TouchableOpacity>
  );
}
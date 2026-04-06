import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

// 🔴 1. นี่คือการกำหนดสเปค (Interface) บอกว่า Avatar รับค่าอะไรได้บ้าง
interface AvatarProps {
  initials?: string;
  imageUrl?: string;
  size?: number;
  isOnline?: boolean;
  onPress?: () => void;
}

// 🔴 2. ต้องเอา AvatarProps มาใส่ตรงนี้ด้วย เพื่อให้ฟังก์ชันรู้จัก
export default function Avatar({ 
  initials = '??', 
  imageUrl, 
  size = 40, 
  isOnline = false, 
  onPress 
}: AvatarProps) { // <--- จุดสำคัญอยู่ตรง : AvatarProps ครับ
  
  const badgeSize = size * 0.3;

  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={!onPress}
      className="relative"
    >
      <View 
        style={{ width: size, height: size, borderRadius: size / 2 }}
        className="bg-white/20 border border-white/30 items-center justify-center overflow-hidden"
      >
        {imageUrl ? (
          <Image 
            source={{ uri: imageUrl }} 
            style={{ width: size, height: size }} 
            resizeMode="cover"
          />
        ) : (
          <Text 
            className="text-white font-bold" 
            style={{ fontSize: size * 0.4 }}
          >
            {initials}
          </Text>
        )}
      </View>

      {isOnline && (
        <View 
          style={{ width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2 }}
          className="absolute bottom-0 right-0 bg-green-500 border-2 border-[#062b50]" 
        />
      )}
    </TouchableOpacity>
  );
}
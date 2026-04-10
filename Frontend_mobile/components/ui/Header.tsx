import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { User, Zap, Shield, LogOut, X } from 'lucide-react-native';
import DecorativeBubble from './DecBubble';

interface HeaderProps {
  subtitle?: string;
  userInitials?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  workspaceName?: string;
}

export default function Header({
  subtitle = 'Stay updated with announcements',
  userInitials = 'YO',
  userName = 'Your Name',
  userEmail = 'your.email@company.com',
  userRole = 'Team Member',
  workspaceName = 'Teamly Workspace',
}: HeaderProps) {
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      <LinearGradient
        colors={['#152C53', '#234476', '#42639B']}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, position: 'relative' }}
      >
        <DecorativeBubble size={35} top={-5} right={-8} opacity={0.12} />
        <DecorativeBubble size={20} top={5} right={10}  opacity={0.07} />
        <DecorativeBubble size={45} bottom={-13} left={-10} opacity={0.08} />

        <View 
          style={{
            position: 'absolute',
            top: -50,   
            left: -25,  
            width: 200, 
            height: 200,
          }}
          pointerEvents="none" 
        >
          <Image
            source={require('../../assets/images/TeamlyImage/TeamlyLogo.png')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        </View>


        {/* 🟢 Row สำหรับ Avatar จัดให้อยู่ขวาสุด (flex-end) */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4, zIndex: 10 }}>
          {/* Avatar */}
          <TouchableOpacity
            onPress={() => setShowProfile(true)}
            style={{ position: 'relative' }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: 'rgba(255,255,255,0.4)',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                {userInitials}
              </Text>
            </View>
            {/* Online indicator */}
            <View
              style={{
                position: 'absolute',
                bottom: 1,
                right: 1,
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: '#22c55e',
                borderWidth: 2,
                borderColor: '#234476',
              }}
            />
          </TouchableOpacity>
        </View>

        {/* Subtitle */}
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2, zIndex: 10 }}>
          {subtitle}
        </Text>
      </LinearGradient>

      {/* Profile Modal */}
      <Modal
        visible={showProfile}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfile(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
          activeOpacity={1}
          onPress={() => setShowProfile(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{
              position: 'absolute',
              top: 80,
              right: 16,
              left: 16,
              backgroundColor: '#fff',
              borderRadius: 20,
              overflow: 'hidden',
            }}
          >
            {/* Profile Header */}
            <LinearGradient
              colors={['#152C53', '#234476', '#42639B']}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 16 }}
            >
              <TouchableOpacity
                onPress={() => setShowProfile(false)}
                style={{ position: 'absolute', top: 12, right: 12 }}
              >
                <X size={18} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: 'rgba(255,255,255,0.4)',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                    {userInitials}
                  </Text>
                </View>
                <View>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                    {userName}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                    {userRole}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' }} />
                    <Text style={{ color: '#22c55e', fontSize: 12, fontWeight: '600' }}>Active now</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>

            {/* Info */}
            <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
              <Text style={{ fontSize: 13, color: '#6b7280' }}>{userEmail}</Text>
              <Text style={{ fontSize: 13, color: '#425C95', marginTop: 4 }}>{workspaceName}</Text>
            </View>

            {/* Menu Items */}
            {[
              { icon: <User size={18} color="#425C95" />, label: 'Profile & Settings' },
              { icon: <Zap size={18} color="#f59e0b" />, label: 'Set Status', sub: 'Active now' },
              { icon: <Shield size={18} color="#8b5cf6" />, label: 'Privacy & Security' },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: '#f9fafb',
                  gap: 12,
                }}
              >
                {item.icon}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{item.label}</Text>
                  {item.sub && <Text style={{ fontSize: 12, color: '#9ca3af' }}>{item.sub}</Text>}
                </View>
                <Text style={{ color: '#d1d5db', fontSize: 18 }}>›</Text>
              </TouchableOpacity>
            ))}

            {/* Sign Out */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 14,
                gap: 12,
              }}
              onPress={() => {
                setShowProfile(false);
                router.replace('/(auth)/login');
              }}
            >
              <LogOut size={18} color="#ef4444" />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#ef4444' }}>Sign Out</Text>
            </TouchableOpacity>

            <Text style={{ textAlign: 'center', fontSize: 11, color: '#d1d5db', paddingBottom: 12 }}>
              Teamly v1.0.0
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
  Animated, Dimensions,
} from 'react-native';
import { Phone, PhoneOff, Mic, MicOff, Minimize2, Maximize2 } from 'lucide-react-native';
import type { CallState, UseWebRTCReturn } from '../../hooks/useWebRTC';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return [hrs, mins, secs].map((v) => String(v).padStart(2, '0')).join(':');
  }
  return [mins, secs].map((v) => String(v).padStart(2, '0')).join(':');
}

function getInitials(name: string): string {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0] ?? '').join('').toUpperCase().slice(0, 2) || '?';
}

function CallAvatar({ name, size = 80 }: { name: string; size?: number }) {
  const colors = ['#425C95', '#7C3AED', '#059669', '#DC2626', '#D97706'];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: colors[colorIndex],
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
    }}>
      <Text style={{ color: '#fff', fontSize: size * 0.35, fontWeight: '700' }}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

interface CallOverlayProps {
  callState: CallState;
  acceptCall: UseWebRTCReturn['acceptCall'];
  rejectCall: UseWebRTCReturn['rejectCall'];
  endCall: UseWebRTCReturn['endCall'];
  toggleMute: UseWebRTCReturn['toggleMute'];
  minimizeCallUI: UseWebRTCReturn['minimizeCallUI'];
  expandCallUI: UseWebRTCReturn['expandCallUI'];
}

export default function CallOverlay({
  callState,
  acceptCall,
  rejectCall,
  endCall,
  toggleMute,
  minimizeCallUI,
  expandCallUI,
}: CallOverlayProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (callState.status === 'ringing' || callState.status === 'calling') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [callState.status]);

  const peerName = callState.peerName ?? 'Unknown';

  if (callState.status === 'idle' || callState.status === 'ended') return null;

  // minimized bar ตอน calling หรือ connected
  if (callState.isMinimized && (callState.status === 'calling' || callState.status === 'connected')) {
    return (
      <View style={styles.minimizedContainer}>
        <TouchableOpacity style={styles.minimizedBar} onPress={expandCallUI} activeOpacity={0.9}>
          <CallAvatar name={peerName} size={36} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.minimizedName} numberOfLines={1}>{peerName}</Text>
            <Text style={styles.minimizedStatus}>
              {callState.status === 'calling' ? 'กำลังโทร...' : formatDuration(callState.callDuration)}
            </Text>
          </View>
          {callState.status === 'connected' && (
            <TouchableOpacity onPress={toggleMute} style={styles.minimizedBtn}>
              {callState.isMuted
                ? <MicOff size={18} color="#fff" />
                : <Mic size={18} color="#fff" />}
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={expandCallUI} style={styles.minimizedBtn}>
            <Maximize2 size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={endCall} style={[styles.minimizedBtn, styles.endBtnSmall]}>
            <PhoneOff size={18} color="#fff" />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    );
  }

  // ringing screen
  if (callState.status === 'ringing') {
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.fullscreenOverlay}>
          <View style={styles.ringingCard}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: 24 }}>
              <CallAvatar name={peerName} size={96} />
            </Animated.View>
            <Text style={styles.ringingName}>{peerName}</Text>
            <Text style={styles.ringingSubtitle}>โทรหาคุณ</Text>
            <View style={styles.ringingButtons}>
              <TouchableOpacity
                onPress={() => void acceptCall()}
                style={[styles.circleBtn, styles.acceptBtn]}
              >
                <Phone size={28} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={rejectCall}
                style={[styles.circleBtn, styles.rejectBtn]}
              >
                <PhoneOff size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.ringingLabels}>
              <Text style={styles.btnLabel}>รับสาย</Text>
              <Text style={styles.btnLabel}>ปฏิเสธ</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // calling screen (outgoing)
  if (callState.status === 'calling') {
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.fullscreenDark}>
          <TouchableOpacity onPress={minimizeCallUI} style={styles.minimizeTopBtn}>
            <Minimize2 size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: 24 }}>
            <CallAvatar name={peerName} size={96} />
          </Animated.View>
          <Text style={styles.callName}>{peerName}</Text>
          <Text style={styles.callStatus}>กำลังโทร...</Text>
          <TouchableOpacity onPress={endCall} style={[styles.circleBtn, styles.rejectBtn, { marginTop: 40 }]}>
            <PhoneOff size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.btnLabel}>วางสาย</Text>
        </View>
      </Modal>
    );
  }

  // connected screen
  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.fullscreenDark}>
        <TouchableOpacity onPress={minimizeCallUI} style={styles.minimizeTopBtn}>
          <Minimize2 size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <CallAvatar name={peerName} size={96} />
        <Text style={[styles.callName, { marginTop: 24 }]}>{peerName}</Text>
        <Text style={styles.callDuration}>{formatDuration(callState.callDuration)}</Text>
        <View style={styles.connectedButtons}>
          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity
              onPress={toggleMute}
              style={[styles.circleBtn, callState.isMuted ? styles.mutedBtn : styles.muteBtn]}
            >
              {callState.isMuted
                ? <MicOff size={24} color="#fff" />
                : <Mic size={24} color="#fff" />}
            </TouchableOpacity>
            <Text style={styles.btnLabel}>{callState.isMuted ? 'ปิดเสียง' : 'เสียง'}</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity onPress={endCall} style={[styles.circleBtn, styles.rejectBtn, { width: 64, height: 64 }]}>
              <PhoneOff size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.btnLabel}>วางสาย</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  minimizedContainer: {
    position: 'absolute',
    bottom: 90,
    left: 12,
    right: 12,
    zIndex: 9998,
  },
  minimizedBar: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  minimizedName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  minimizedStatus: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  minimizedBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  endBtnSmall: {
    backgroundColor: '#ef4444',
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  ringingCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    width: SCREEN_WIDTH - 48,
  },
  ringingName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  ringingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 32,
  },
  ringingButtons: {
    flexDirection: 'row',
    gap: 32,
  },
  ringingLabels: {
    flexDirection: 'row',
    gap: 72,
    marginTop: 10,
  },
  fullscreenDark: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  minimizeTopBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    padding: 8,
  },
  callName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  callStatus: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  callDuration: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
    fontVariant: ['tabular-nums'],
  },
  circleBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    backgroundColor: '#16a34a',
  },
  rejectBtn: {
    backgroundColor: '#ef4444',
  },
  muteBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  mutedBtn: {
    backgroundColor: '#ef4444',
  },
  connectedButtons: {
    flexDirection: 'row',
    gap: 40,
    marginTop: 48,
    alignItems: 'flex-start',
  },
  btnLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});
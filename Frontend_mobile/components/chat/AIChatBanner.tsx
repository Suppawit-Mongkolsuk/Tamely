import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sparkles, Wand2, X } from 'lucide-react-native';
import { AI_KEYS } from '../../hooks/useNotifications';

const API_BASE = 'https://ineffectual-marian-nonnattily.ngrok-free.dev';

interface Props {
  // snapshot ของข้อความที่ยังไม่ได้อ่านตอนเปิดแชท (ก่อน mark read)
  unreadMessages: { content: string; sender: { Name: string }; createdAt: string }[];
  wsId: string;
  token: string;
}

export default function AIChatBanner({ unreadMessages, wsId, token }: Props) {
  const [autoSumEnabled, setAutoSumEnabled] = useState(false);
  const [smartSugEnabled, setSmartSugEnabled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [loadingSum, setLoadingSum] = useState(false);
  const [loadingSug, setLoadingSug] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultType, setResultType] = useState<'summary' | 'suggest' | null>(null);
  const [opacity] = useState(new Animated.Value(0));

  // reset banner เมื่อมี unread ชุดใหม่เข้ามา
  const prevCountRef = React.useRef(0);
  useEffect(() => {
    if (unreadMessages.length > prevCountRef.current) {
      setDismissed(false);
      setResult(null);
      opacity.setValue(0);
    }
    prevCountRef.current = unreadMessages.length;
  }, [unreadMessages.length]);

  useEffect(() => {
    const loadPrefs = async () => {
      const sumRaw = await AsyncStorage.getItem(AI_KEYS.autoSummarize);
      const sugRaw = await AsyncStorage.getItem(AI_KEYS.smartSuggest);
      setAutoSumEnabled(sumRaw !== 'false');
      setSmartSugEnabled(sugRaw !== 'false');
    };
    loadPrefs();
  }, []);

  useEffect(() => {
    if (unreadMessages.length > 0 && (autoSumEnabled || smartSugEnabled) && !dismissed) {
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [unreadMessages.length, autoSumEnabled, smartSugEnabled, dismissed]);

  const buildContext = () => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const recent = unreadMessages.filter((m) => new Date(m.createdAt).getTime() >= cutoff);
    return recent.map((m) => `${m.sender.Name}: ${m.content}`).join('\n');
  };

  const handleSummarize = async () => {
    const context = buildContext();
    if (!context) {
      setResult('ไม่มีข้อความใหม่ใน 24 ชั่วโมงที่ผ่านมา');
      setResultType('summary');
      return;
    }
    setLoadingSum(true);
    setResult(null);
    try {
      const prompt = `สรุปบทสนทนาต่อไปนี้ให้กระชับเป็นภาษาไทย (ห้ามค้นหาข้อมูลเพิ่มเติม ให้ใช้เฉพาะข้อความที่ให้มาเท่านั้น):\n\n${context}`;
      const res = await fetch(`${API_BASE}/api/workspaces/${wsId}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ message: prompt, history: [] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(`status ${res.status}`);
      setResult(json.data?.reply ?? json.reply ?? 'ไม่สามารถสรุปได้');
      setResultType('summary');
    } catch (e) {
      console.warn('[AIChatBanner] summarize error:', e);
      setResult('เกิดข้อผิดพลาด กรุณาลองใหม่');
      setResultType('summary');
    } finally {
      setLoadingSum(false);
    }
  };

  const handleSuggest = async () => {
    const context = buildContext();
    if (!context) {
      setResult('ไม่มีข้อความใหม่ใน 24 ชั่วโมงที่ผ่านมา');
      setResultType('suggest');
      return;
    }
    setLoadingSug(true);
    setResult(null);
    try {
      const prompt = `จากบทสนทนาต่อไปนี้ (ห้ามค้นหาข้อมูลเพิ่มเติม ให้ใช้เฉพาะข้อความที่ให้มาเท่านั้น):\n\n${context}\n\nแนะนำ 2-3 ข้อความตอบกลับที่เหมาะสมเป็นภาษาไทย ให้สั้นกระชับ`;
      const res = await fetch(`${API_BASE}/api/workspaces/${wsId}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ message: prompt, history: [] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(`status ${res.status}`);
      setResult(json.data?.reply ?? json.reply ?? 'ไม่สามารถแนะนำได้');
      setResultType('suggest');
    } catch {
      setResult('เกิดข้อผิดพลาด กรุณาลองใหม่');
      setResultType('suggest');
    } finally {
      setLoadingSug(false);
    }
  };

  const bothDisabled = !autoSumEnabled && !smartSugEnabled;
  if (unreadMessages.length === 0 || bothDisabled || dismissed) return null;

  return (
    <Animated.View style={{ opacity, marginHorizontal: 12, marginTop: 8, marginBottom: 4 }}>
      <View style={{ backgroundColor: '#f5f3ff', borderRadius: 14, borderWidth: 1, borderColor: '#ddd6fe', overflow: 'hidden' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Sparkles size={15} color="#7c3aed" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#5b21b6' }}>
              AI Assistant · {unreadMessages.length} ข้อความใหม่
            </Text>
          </View>
          <TouchableOpacity onPress={() => setDismissed(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={15} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Buttons */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: result ? 8 : 12 }}>
          {autoSumEnabled && (
            <TouchableOpacity
              onPress={handleSummarize}
              disabled={loadingSum || loadingSug}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: '#7c3aed', borderRadius: 8, paddingVertical: 8 }}
            >
              {loadingSum
                ? <ActivityIndicator size="small" color="#fff" />
                : <Sparkles size={13} color="#fff" />}
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>สรุปให้หน่อย</Text>
            </TouchableOpacity>
          )}
          {smartSugEnabled && (
            <TouchableOpacity
              onPress={handleSuggest}
              disabled={loadingSum || loadingSug}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: '#fff', borderRadius: 8, paddingVertical: 8, borderWidth: 1, borderColor: '#ddd6fe' }}
            >
              {loadingSug
                ? <ActivityIndicator size="small" color="#7c3aed" />
                : <Wand2 size={13} color="#7c3aed" />}
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#7c3aed' }}>แนะนำตอบกลับ</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Result */}
        {result && (
          <View style={{ marginHorizontal: 14, marginBottom: 12, backgroundColor: '#fff', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#ede9fe' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              {resultType === 'summary'
                ? <Sparkles size={11} color="#7c3aed" />
                : <Wand2 size={11} color="#7c3aed" />}
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#7c3aed' }}>
                {resultType === 'summary' ? 'สรุป' : 'คำแนะนำ'}
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: '#374151', lineHeight: 20 }}>{result}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

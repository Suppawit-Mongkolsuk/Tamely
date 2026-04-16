// ===== notification-prefs — mute per conversation/room =====
// เก็บใน localStorage แบบ user-specific: tamely_muted_<userId>

const key = (userId: string) => `tamely_muted_${userId}`;

function getMutedSet(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(key(userId));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveMutedSet(userId: string, muted: Set<string>) {
  localStorage.setItem(key(userId), JSON.stringify([...muted]));
}

/** ตรวจว่า conversation/room นี้ถูก mute หรือไม่ */
export function isConversationMuted(userId: string, conversationId: string): boolean {
  return getMutedSet(userId).has(conversationId);
}

/** toggle mute — คืนค่า true ถ้า mute หลังจาก toggle */
export function toggleConversationMute(userId: string, conversationId: string): boolean {
  const muted = getMutedSet(userId);
  if (muted.has(conversationId)) {
    muted.delete(conversationId);
  } else {
    muted.add(conversationId);
  }
  saveMutedSet(userId, muted);
  return muted.has(conversationId);
}

import { prisma } from '../../index';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export type PushPayload = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
};

/**
 * ส่ง push notification ผ่าน Expo Push API
 * รองรับส่งหลายคนพร้อมกัน (batch)
 */
export const sendPushNotifications = async (payloads: PushPayload[]) => {
  const valid = payloads.filter(
    (p) => p.to && p.to.startsWith('ExponentPushToken['),
  );
  if (valid.length === 0) return;

  try {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(valid),
    });
  } catch (err) {
    console.error('[Push] failed to send:', err);
  }
};

/**
 * ดึง push token ของ user หลายคนพร้อมกัน
 * return map userId -> pushToken
 */
export const getPushTokens = async (
  userIds: string[],
): Promise<Map<string, string>> => {
  if (userIds.length === 0) return new Map();

  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      pushToken: { not: null },
    },
    select: { id: true, pushToken: true },
  });

  const map = new Map<string, string>();
  for (const u of users) {
    if (u.pushToken) map.set(u.id, u.pushToken);
  }
  return map;
};

/**
 * ส่ง push ให้ user หลายคนพร้อมกัน
 */
export const pushToUsers = async (
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
) => {
  const tokenMap = await getPushTokens(userIds);
  if (tokenMap.size === 0) return;

  const payloads: PushPayload[] = [];
  for (const [, token] of tokenMap) {
    payloads.push({ to: token, title, body, sound: 'default', data });
  }

  await sendPushNotifications(payloads);
};

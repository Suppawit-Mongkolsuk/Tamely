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
  const valid = payloads.filter( // กรองเอาเฉพาะ payload ต้องเป็น Expo Push Token เท่านั้น
    (p) => p.to && p.to.startsWith('ExponentPushToken['), // ตรวจสอบว่า token มีรูปแบบที่ถูกต้อง หรือไม่ 
  );
  if (valid.length === 0) return; // ถ้าไม่มี payload ที่ถูกต้องเลย ก็ไม่ต้องส่งอะไร

  try {
    await fetch(EXPO_PUSH_URL, { // ส่งคำขอ POST ไปยัง Expo Push API เพื่อส่ง push notification ทั้งหมดที่ผ่านการกรองแล้ว
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(valid), // แปลงข้อมูล payload ที่ถูกต้องเป็น JSON string เพื่อส่งใน body ของคำขอ
    });
  } catch (err) {
    console.error('[Push] failed to send:', err);
  }
};

/**
 * ดึง push token ของ user หลายคนพร้อมกัน
 * return map userId -> pushToken
 */
export const getPushTokens = async ( // ฟังก์ชันนี้ใช้สำหรับดึง push token ของ user หลายคนพร้อมกัน โดยรับ userIds เป็น array ของ userId ที่ต้องการดึง push token และ return เป็น Map ที่มี key เป็น userId และ value เป็น pushToken
  userIds: string[],
): Promise<Map<string, string>> => {
  if (userIds.length === 0) return new Map(); // ถ้าไม่มี userId ที่ต้องดึง push token ก็ return Map ว่างๆ ไปเลย

  const users = await prisma.user.findMany({ // ดึงข้อมูล user ที่มี id อยู่ใน userIds และมี pushToken ไ
    where: {
      id: { in: userIds },
      pushToken: { not: null },
    },
    select: { id: true, pushToken: true },
  });

  const map = new Map<string, string>(); // สร้าง Map ที่จะเก็บ userId -> pushToken
  for (const u of users) { // วนสร้าง Map จากข้อมูล user ที่ดึงมา
    if (u.pushToken) map.set(u.id, u.pushToken); // ถ้า user มี pushToken ก็เพิ่มเข้า Map โดยใช้ userId เป็น key และ pushToken เป็น value
  }
  return map; // return Map ที่ได้กลับไป
};

/**
 * ส่ง push ให้ user หลายคนพร้อมกัน
 */
export const pushToUsers = async ( // ฟังก์ชันนี้ใช้สำหรับส่ง push notification ให้กับ user หลายคนพร้อมกัน โดยรับ userIds เป็น array 
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
) => {
  const tokenMap = await getPushTokens(userIds); // ดึง push token ของ userIds ที่ต้องการส่ง push notification ให้ โดยจะได้ Map ที่มี key เป็น userId และ value
  if (tokenMap.size === 0) return; 

  const payloads: PushPayload[] = []; // สร้าง array ที่จะเก็บ payload ของ push notification ที่จะส่ง
  for (const [, token] of tokenMap) { // วนสร้าง payload สำหรับแต่ละ push token ที่ได้มา โดยใช้ title, body, data ที่รับเข้ามาเป็นข้อมูลใน payload
    payloads.push({ to: token, title, body, sound: 'default', data }); // เพิ่ม payload ที่สร้างขึ้นเข้า array ของ payloads
  }

  await sendPushNotifications(payloads); // ส่ง push notification ทั้งหมดที่สร้างขึ้น
};

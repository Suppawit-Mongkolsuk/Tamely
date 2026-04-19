# คู่มือ Merge Dev → DevFolk

## ⚠️ ห้าม merge Dev เข้า DevFolk โดยตรง

Dev branch มีการตั้งค่าที่ขัดแย้งกับ WebRTC ใน DevFolk ถ้า merge ตรงๆ จะทำให้ระบบโทรพังทั้งหมด

---

## สิ่งที่ต้องระวังใน `Frontend_mobile`

### 1. `app.json`

| Key | Dev (ห้ามใช้) | DevFolk (ถูกต้อง) |
|-----|--------------|------------------|
| `newArchEnabled` | `true` ❌ | `false` ✅ |
| `slug` | `"taemly"` | `"Frontend_mobile"` |
| `projectId` | `42465bc3-...` | `ae72affe-...` |

> `newArchEnabled: true` จะทำให้ `react-native-webrtc` crash ทันที เพราะ WebRTC รองรับแค่ Old Architecture

### 2. `package.json`

| Package | Dev (ห้ามใช้) | DevFolk (ถูกต้อง) |
|---------|--------------|------------------|
| `react-native-reanimated` | `~4.1.1` ❌ | `~3.19.5` ✅ |
| `react-native-worklets` | มี ❌ | ไม่มี ✅ |
| `patch-package` | ไม่มี ❌ | มี ✅ |
| `postinstall` script | ไม่มี ❌ | `"patch-package"` ✅ |

> `reanimated 4.x` + `react-native-worklets` ต้องการ New Architecture ซึ่งขัดกับ WebRTC

---

## วิธี Merge ที่ถูกต้อง

### ขั้นตอน

```bash
# 1. อยู่บน DevFolk
git checkout DevFolk

# 2. merge Dev เข้ามา
git merge Dev

# 3. ถ้ามี conflict ให้แก้ตามนี้
```

### ไฟล์ที่ต้อง resolve conflict ด้วยตัวเอง

**`Frontend_mobile/app.json`** — ให้ใช้ค่าของ DevFolk เสมอ:
```json
"newArchEnabled": false,
"slug": "Frontend_mobile",
"projectId": "ae72affe-d522-4a16-a802-e89e2a298334"
```

**`Frontend_mobile/package.json`** — ให้ใช้ค่าของ DevFolk เสมอ:
```json
"react-native-reanimated": "~3.19.5",
"postinstall": "patch-package"
```
และ **ลบ** `react-native-worklets` ออก, **คง** `patch-package` ไว้

---

## หลัง merge เสร็จ

```bash
cd Frontend_mobile
npm install        # patch-package จะรันอัตโนมัติผ่าน postinstall
```

ตรวจสอบว่าไฟล์ `patches/react-native-css-interop+0.2.3.patch` ยังอยู่ครบ ถ้าหายให้แจ้ง Folk

---

## DevFolk → Dev (merge เข้า branch หลัก)

```bash
git checkout Dev
git merge DevFolk
```

conflict ที่ `Frontend_mobile/app.json` และ `package.json` — **ให้เลือกของ DevFolk เสมอ** เหมือนกัน เพราะ DevFolk มีการตั้งค่า WebRTC ที่ถูกต้อง

---

## สรุปง่ายๆ

> ไม่ว่าจะ merge ทิศทางไหน — conflict ที่ `app.json` และ `package.json` ใน `Frontend_mobile/` **ให้เลือกของ DevFolk เสมอ**

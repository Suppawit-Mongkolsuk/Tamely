import { io, Socket } from 'socket.io-client';
import { config } from './config';

let socket: Socket | null = null;

// apiClient เก็บ token ใน memory — ดึงผ่าน import โดยตรงไม่ได้เพราะ circular
// จึงใช้ global store อย่างง่าย
let _token: string = '';

export const setSocketToken = (token: string) => {
  _token = token;
};

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(config.wsUrl, {
      withCredentials: true,
      autoConnect: false,
      auth: { token: _token },
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) {
    // อัพเดต token ก่อน connect ทุกครั้ง
    s.auth = { token: _token };
    s.connect();
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
  socket = null; // reset instance เพื่อให้ token ใหม่ถูกใช้ครั้งต่อไป
};

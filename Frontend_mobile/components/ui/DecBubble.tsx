import React from 'react';
import { View, useWindowDimensions } from 'react-native';

interface DecorativeBubbleProps {
  size: number; // ขนาด (เปอร์เซ็นต์ของหน้าจอที่สั้นที่สุด)
  top?: number; // ตำแหน่งเปอร์เซ็นต์จากด้านบน
  bottom?: number; // ตำแหน่งเปอร์เซ็นต์จากด้านล่าง
  right?: number; // ตำแหน่งเปอร์เซ็นต์จากด้านขวา
  left?: number; // ตำแหน่งเปอร์เซ็นต์จากด้านซ้าย
  opacity?: number; // ความโปร่งใส (0-1) เช่น 0.1 หรือ 0.05
}

export default function DecorativeBubble({
  size,
  top,
  bottom,
  right,
  left,
  opacity = 0.1 // ค่าเริ่มต้นโปร่งใส 10%
}: DecorativeBubbleProps) {
  // 1. ดึงขนาดหน้าจอปัจจุบันมา
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  // 2. คำนวณขนาดจริงตามเปอร์เซ็นต์ของความกว้างหน้าจอ (เพื่อให้เป็นวงกลม)
  const actualSize = (screenWidth * size) / 100;

  // 3. เตรียม Style สำหรับตำแหน่งและขนาด
  const style = {
    position: 'absolute',
    width: actualSize,
    height: actualSize,
    borderRadius: actualSize / 2, // บังคับให้เป็นวงกลมเสมอ
    backgroundColor: 'white',
    opacity: opacity,
    
    // แปลงเปอร์เซ็นต์ให้เป็นค่าพิกเซลจริง
    top: top !== undefined ? (screenHeight * top) / 100 : undefined,
    bottom: bottom !== undefined ? (screenHeight * bottom) / 100 : undefined,
    right: right !== undefined ? (screenWidth * right) / 100 : undefined,
    left: left !== undefined ? (screenWidth * left) / 100 : undefined,
    zIndex: -1 // เอาไว้หลังสุดเสมอ
  };
}
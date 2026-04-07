import React from 'react';
import { View, useWindowDimensions, ViewStyle } from 'react-native';

interface DecorativeBubbleProps {
  size: number;
  top?: number;
  bottom?: number;
  right?: number;
  left?: number;
  opacity?: number;
}

export default function DecBubble({
  size,
  top,
  bottom,
  right,
  left,
  opacity = 0.1
}: DecorativeBubbleProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const actualSize = (screenWidth * size) / 100;

  const style: ViewStyle = {
    position: 'absolute' as const, 
    width: actualSize,
    height: actualSize,
    borderRadius: actualSize / 2,
    backgroundColor: 'white',
    opacity: opacity,
    top: top !== undefined ? (screenHeight * top) / 100 : undefined,
    bottom: bottom !== undefined ? (screenHeight * bottom) / 100 : undefined,
    right: right !== undefined ? (screenWidth * right) / 100 : undefined,
    left: left !== undefined ? (screenWidth * left) / 100 : undefined,
    zIndex: -1
  };

  return <View style={style} pointerEvents="none" />;
}
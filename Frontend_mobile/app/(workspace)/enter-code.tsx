import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EnterCodeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white justify-center items-center">
      <Text className="text-xl font-bold">Enter Organization Code</Text>
    </SafeAreaView>
  );
}